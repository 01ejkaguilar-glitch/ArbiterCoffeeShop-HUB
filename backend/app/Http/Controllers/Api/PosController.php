<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Payment;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PosController extends BaseController
{
    /**
     * Get all available products grouped by category for the POS grid.
     */
    public function getProducts()
    {
        try {
            $categories = Category::where('is_active', true)
                ->orderBy('sort_order')
                ->with(['products' => function ($q) {
                    $q->where('is_available', true)
                      ->where('stock_quantity', '>', 0)
                      ->orderBy('name');
                }])
                ->get()
                ->map(function ($cat) {
                    return [
                        'id' => $cat->id,
                        'name' => $cat->name,
                        'products' => $cat->products->map(function ($p) {
                            return [
                                'id' => $p->id,
                                'name' => $p->name,
                                'price' => (float) $p->price,
                                'image_url' => $p->image_url,
                                'stock_quantity' => $p->stock_quantity,
                                'customization_options' => $p->customization_options,
                            ];
                        }),
                    ];
                });

            return $this->sendResponse($categories, 'Products loaded');
        } catch (\Exception $e) {
            return $this->sendError('Failed to load products: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create a POS order (walk-in, no customer account required).
     */
    public function createOrder(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.special_instructions' => 'nullable|string|max:255',
            'order_type' => 'required|in:dine-in,take-out',
            'payment_method' => 'required|in:cash,gcash,card',
            'amount_tendered' => 'nullable|numeric|min:0',
            'reference_number' => 'nullable|string|max:100',
            'customer_name' => 'nullable|string|max:100',
            'discount_type' => 'nullable|in:senior,pwd,employee,promo',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        try {
            DB::beginTransaction();

            $barista = Auth::user();
            $items = $request->input('items');
            $subtotal = 0;
            $orderItems = [];

            foreach ($items as $item) {
                $product = Product::find($item['product_id']);
                if (!$product || !$product->is_available) {
                    DB::rollBack();
                    return $this->sendError('Product unavailable: ' . ($product->name ?? 'Unknown'), 400);
                }
                if ($product->stock_quantity < $item['quantity']) {
                    DB::rollBack();
                    return $this->sendError("Insufficient stock for {$product->name}", 400);
                }

                $unitPrice = (float) $product->price;
                $quantity = $item['quantity'];
                $subtotal += $unitPrice * $quantity;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'special_instructions' => $item['special_instructions'] ?? null,
                ];

                // Decrement stock
                $product->decrement('stock_quantity', $quantity);
            }

            // Apply discount
            $discountType = $request->input('discount_type');
            $discountPercent = $request->input('discount_percent', 0);
            $discountAmount = 0;
            if ($discountType && $discountPercent > 0) {
                $discountAmount = round($subtotal * ($discountPercent / 100), 2);
            }

            $totalAmount = $subtotal - $discountAmount;

            // Generate POS-prefixed order number
            $orderNumber = 'POS-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

            $order = Order::create([
                'user_id' => null, // walk-in, no customer account
                'barista_id' => $barista->id,
                'order_number' => $orderNumber,
                'status' => 'preparing',
                'order_type' => $request->input('order_type'),
                'subtotal' => $subtotal,
                'delivery_fee' => 0,
                'total_amount' => $totalAmount,
                'payment_method' => $request->input('payment_method'),
                'payment_status' => 'pending',
                'notes' => trim(implode(' | ', array_filter([
                    $request->input('customer_name') ? 'Customer: ' . $request->input('customer_name') : null,
                    $discountType ? "Discount: {$discountType} ({$discountPercent}%)" : null,
                    $request->input('notes'),
                ]))),
                'special_instructions' => null,
            ]);

            foreach ($orderItems as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'special_instructions' => $item['special_instructions'],
                ]);
            }

            // Process payment immediately for POS
            $paymentMethod = $request->input('payment_method');
            $payment = Payment::create([
                'order_id' => $order->id,
                'amount' => $totalAmount,
                'method' => $paymentMethod,
                'transaction_id' => $paymentMethod === 'cash'
                    ? 'CASH-' . strtoupper(substr(uniqid(), -8))
                    : ($request->input('reference_number') ?? strtoupper(substr(uniqid(), -8))),
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            $order->update(['payment_status' => 'paid']);

            DB::commit();

            // Build response
            $order->load('orderItems.product');

            $change = 0;
            $amountTendered = $request->input('amount_tendered', 0);
            if ($paymentMethod === 'cash' && $amountTendered > 0) {
                $change = round($amountTendered - $totalAmount, 2);
            }

            return $this->sendResponse([
                'order' => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'status' => $order->status,
                    'order_type' => $order->order_type,
                    'subtotal' => (float) $order->subtotal,
                    'discount_amount' => $discountAmount,
                    'total_amount' => (float) $order->total_amount,
                    'payment_method' => $order->payment_method,
                    'payment_status' => $order->payment_status,
                    'customer_name' => $request->input('customer_name'),
                    'barista_name' => $barista->name,
                    'items' => $order->orderItems->map(function ($oi) {
                        return [
                            'product_name' => $oi->product->name ?? 'Unknown',
                            'quantity' => $oi->quantity,
                            'unit_price' => (float) $oi->unit_price,
                            'total' => (float) ($oi->quantity * $oi->unit_price),
                        ];
                    }),
                    'created_at' => $order->created_at->toDateTimeString(),
                ],
                'payment' => [
                    'amount' => (float) $payment->amount,
                    'method' => $payment->method,
                    'amount_tendered' => (float) $amountTendered,
                    'change' => $change,
                    'reference' => $payment->transaction_id,
                ],
            ], 'Order created successfully', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to create order: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Hold/park an order for later (save cart state).
     */
    public function holdOrder(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.special_instructions' => 'nullable|string|max:255',
            'order_type' => 'required|in:dine-in,take-out',
            'customer_name' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        try {
            DB::beginTransaction();

            $barista = Auth::user();
            $items = $request->input('items');
            $subtotal = 0;
            $orderItems = [];

            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $unitPrice = (float) $product->price;
                $quantity = $item['quantity'];
                $subtotal += $unitPrice * $quantity;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'special_instructions' => $item['special_instructions'] ?? null,
                ];
            }

            $orderNumber = 'HOLD-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

            $order = Order::create([
                'user_id' => null,
                'barista_id' => $barista->id,
                'order_number' => $orderNumber,
                'status' => 'pending',
                'order_type' => $request->input('order_type'),
                'subtotal' => $subtotal,
                'delivery_fee' => 0,
                'total_amount' => $subtotal,
                'payment_method' => 'cash',
                'payment_status' => 'pending',
                'notes' => trim(implode(' | ', array_filter([
                    'HELD ORDER',
                    $request->input('customer_name') ? 'Customer: ' . $request->input('customer_name') : null,
                    $request->input('notes'),
                ]))),
            ]);

            foreach ($orderItems as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'special_instructions' => $item['special_instructions'],
                ]);
            }

            DB::commit();

            $order->load('orderItems.product');

            return $this->sendResponse([
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $request->input('customer_name'),
                'item_count' => $order->orderItems->count(),
                'total_amount' => (float) $order->total_amount,
                'created_at' => $order->created_at->toDateTimeString(),
            ], 'Order held successfully', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to hold order: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get all held/parked orders for today.
     */
    public function getHeldOrders()
    {
        try {
            $orders = Order::where('order_number', 'like', 'HOLD-%')
                ->where('status', 'pending')
                ->where('payment_status', 'pending')
                ->whereDate('created_at', today())
                ->with('orderItems.product')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($order) {
                    $customerName = null;
                    if ($order->notes && preg_match('/Customer:\s*([^|]+)/', $order->notes, $m)) {
                        $customerName = trim($m[1]);
                    }
                    return [
                        'id' => $order->id,
                        'order_number' => $order->order_number,
                        'customer_name' => $customerName,
                        'order_type' => $order->order_type,
                        'items' => $order->orderItems->map(function ($oi) {
                            return [
                                'product_id' => $oi->product_id,
                                'product_name' => $oi->product->name ?? 'Unknown',
                                'quantity' => $oi->quantity,
                                'unit_price' => (float) $oi->unit_price,
                            ];
                        }),
                        'total_amount' => (float) $order->total_amount,
                        'created_at' => $order->created_at->toDateTimeString(),
                    ];
                });

            return $this->sendResponse($orders, 'Held orders loaded');
        } catch (\Exception $e) {
            return $this->sendError('Failed to load held orders: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Resume a held order (return its data and delete the hold record).
     */
    public function resumeHeldOrder($id)
    {
        try {
            $order = Order::where('id', $id)
                ->where('order_number', 'like', 'HOLD-%')
                ->where('status', 'pending')
                ->with('orderItems.product')
                ->firstOrFail();

            $customerName = null;
            if ($order->notes && preg_match('/Customer:\s*([^|]+)/', $order->notes, $m)) {
                $customerName = trim($m[1]);
            }

            $data = [
                'order_type' => $order->order_type,
                'customer_name' => $customerName,
                'items' => $order->orderItems->map(function ($oi) {
                    return [
                        'product_id' => $oi->product_id,
                        'product_name' => $oi->product->name ?? 'Unknown',
                        'price' => (float) $oi->unit_price,
                        'quantity' => $oi->quantity,
                        'image_url' => $oi->product->image_url ?? null,
                        'special_instructions' => $oi->special_instructions,
                    ];
                }),
            ];

            // Delete the held order so it's no longer listed
            $order->orderItems()->delete();
            $order->forceDelete();

            return $this->sendResponse($data, 'Held order resumed');
        } catch (\Exception $e) {
            return $this->sendError('Failed to resume held order: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Void / cancel a POS order (requires reason).
     */
    public function voidOrder(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        try {
            $order = Order::where('id', $id)
                ->where(function ($q) {
                    $q->where('order_number', 'like', 'POS-%')
                      ->orWhere('order_number', 'like', 'HOLD-%');
                })
                ->firstOrFail();

            $order->update([
                'status' => 'cancelled',
                'notes' => $order->notes . ' | VOIDED: ' . $request->input('reason'),
            ]);

            // Restore stock for non-held orders that had stock decremented
            if (str_starts_with($order->order_number, 'POS-')) {
                foreach ($order->orderItems as $item) {
                    Product::where('id', $item->product_id)
                        ->increment('stock_quantity', $item->quantity);
                }

                // Mark payment as refunded
                Payment::where('order_id', $order->id)->update(['status' => 'refunded']);
                $order->update(['payment_status' => 'refunded']);
            }

            return $this->sendResponse(null, 'Order voided successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to void order: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get daily POS sales summary for the current shift/day.
     */
    public function getDailySummary()
    {
        try {
            $today = today();
            $baristaId = Auth::id();

            $orders = Order::where('order_number', 'like', 'POS-%')
                ->whereDate('created_at', $today)
                ->where('status', '!=', 'cancelled')
                ->get();

            $myOrders = $orders->where('barista_id', $baristaId);

            // Payment method breakdown
            $paymentBreakdown = $orders->groupBy('payment_method')->map(function ($group, $method) {
                return [
                    'method' => $method,
                    'count' => $group->count(),
                    'total' => round($group->sum('total_amount'), 2),
                ];
            })->values();

            return $this->sendResponse([
                'total_orders' => $orders->count(),
                'total_sales' => round($orders->sum('total_amount'), 2),
                'my_orders' => $myOrders->count(),
                'my_sales' => round($myOrders->sum('total_amount'), 2),
                'average_order' => $orders->count() > 0
                    ? round($orders->sum('total_amount') / $orders->count(), 2)
                    : 0,
                'payment_breakdown' => $paymentBreakdown,
                'held_orders' => Order::where('order_number', 'like', 'HOLD-%')
                    ->where('status', 'pending')
                    ->whereDate('created_at', $today)
                    ->count(),
                'voided_orders' => Order::where('order_number', 'like', 'POS-%')
                    ->whereDate('created_at', $today)
                    ->where('status', 'cancelled')
                    ->count(),
            ], 'Daily summary loaded');
        } catch (\Exception $e) {
            return $this->sendError('Failed to load daily summary: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get recent POS transactions (last 20).
     */
    public function getRecentTransactions()
    {
        try {
            $transactions = Order::where('order_number', 'like', 'POS-%')
                ->whereDate('created_at', today())
                ->with('orderItems.product')
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get()
                ->map(function ($order) {
                    return [
                        'id' => $order->id,
                        'order_number' => $order->order_number,
                        'status' => $order->status,
                        'order_type' => $order->order_type,
                        'total_amount' => (float) $order->total_amount,
                        'payment_method' => $order->payment_method,
                        'payment_status' => $order->payment_status,
                        'item_count' => $order->orderItems->count(),
                        'created_at' => $order->created_at->toDateTimeString(),
                    ];
                });

            return $this->sendResponse($transactions, 'Recent transactions loaded');
        } catch (\Exception $e) {
            return $this->sendError('Failed to load transactions: ' . $e->getMessage(), 500);
        }
    }
}
