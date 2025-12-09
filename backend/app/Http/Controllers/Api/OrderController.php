<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Events\OrderCreated;
use App\Jobs\ProcessOrderNotification;
use App\Notifications\OrderStatusNotification;
use App\Http\Requests\StoreOrderRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends BaseController
{
    /**
     * Create a new order
     *
     * @param \App\Http\Requests\StoreOrderRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StoreOrderRequest $request)
    {
        try {
            DB::beginTransaction();

            $user = Auth::user();

            // Calculate total amount
            $subtotal = 0;
            $orderItems = [];

            $items = $request->input('items', []);

            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);

                if (!$product || !$product->is_available) {
                    return $this->sendError('Product not available', 400, [
                        'product' => $product->name
                    ]);
                }

                $unitPrice = $product->price;
                $quantity = $item['quantity'];
                $subtotal += $unitPrice * $quantity;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'special_instructions' => $item['special_instructions'] ?? null,
                ];
            }

            // Calculate delivery fee if applicable
            $deliveryFee = 0;
            $orderType = $request->input('order_type');
            if ($orderType === 'delivery') {
                $deliveryFee = 50.00; // Fixed delivery fee, can be made dynamic later
            }

            $totalAmount = $subtotal + $deliveryFee;

            // Generate order number
            $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

            // Create order
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => $orderNumber,
                'status' => 'pending',
                'order_type' => $orderType,
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total_amount' => $totalAmount,
                'payment_method' => $request->input('payment_method'),
                'payment_status' => 'pending',
                'delivery_address_id' => $request->input('delivery_address_id'),
                'scheduled_time' => $request->input('scheduled_time'),
                'notes' => $request->input('notes'),
                // 'coupon_code' => $request->input('coupon_code'),
            ]);

            // Create order items
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

            // Load relationships
            $order->load(['orderItems.product', 'user']);

            // Dispatch event for real-time notification
            event(new OrderCreated($order));

            // Queue notification job
            ProcessOrderNotification::dispatch($order, 'created');

            return $this->sendResponse($order, 'Order created successfully', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to create order', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get customer's orders
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            $query = Order::where('user_id', $user->id)
                ->with(['orderItems.product']);

            // Filter by status if provided
            $status = $request->input('status');
            if ($status !== null) {
                $query->where('status', $status);
            }

            // Filter by order type
            $orderType = $request->input('order_type');
            if ($orderType !== null) {
                $query->where('order_type', $orderType);
            }

            // Filter by date range
            if ($request->has('date_from')) {
                $query->whereDate('created_at', '>=', $request->input('date_from'));
            }
            if ($request->has('date_to')) {
                $query->whereDate('created_at', '<=', $request->input('date_to'));
            }

            // Search by order number or product name
            $search = $request->input('search');
            if ($search !== null) {
                $query->where(function ($q) use ($search) {
                    $q->where('order_number', 'like', '%' . $search . '%')
                      ->orWhereHas('orderItems.product', function ($productQuery) use ($search) {
                          $productQuery->where('name', 'like', '%' . $search . '%');
                      });
                });
            }

            // Sort by created_at descending
            $orders = $query->orderBy('created_at', 'desc')
                ->paginate(15);

            return $this->sendResponse($orders, 'Orders retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve orders', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get order details
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $user = Auth::user();

            $order = Order::where('user_id', $user->id)
                ->where('id', $id)
                ->with(['orderItems.product', 'user', 'deliveryAddress'])
                ->first();

            if (!$order) {
                return $this->sendError('Order not found', 404);
            }

            return $this->sendResponse($order, 'Order details retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve order details', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Reorder a previous order
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function reorder($id)
    {
        try {
            $user = Auth::user();

            // Get original order with eager loaded relationships
            $originalOrder = Order::where('user_id', $user->id)
                ->where('id', $id)
                ->with(['orderItems.product'])
                ->first();

            if (!$originalOrder) {
                return $this->sendError('Order not found', 404);
            }

            DB::beginTransaction();

            // Calculate new total and prepare order items
            $totalAmount = 0;
            $orderItems = [];

            // Get all product IDs first to fetch them in one query
            $productIds = $originalOrder->orderItems->pluck('product_id')->unique()->toArray();
            $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

            foreach ($originalOrder->orderItems as $item) {
                $product = $products->get($item->product_id);

                if (!$product || !$product->is_available) {
                    continue; // Skip unavailable products
                }

                $unitPrice = $product->price; // Use current price
                $quantity = $item->quantity;
                $totalAmount += $unitPrice * $quantity;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'customizations' => $item->customizations,
                ];
            }

            if (empty($orderItems)) {
                return $this->sendError('No available products to reorder', 400);
            }

            // Generate new order number
            $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

            // Create new order
            $newOrder = Order::create([
                'user_id' => $user->id,
                'order_number' => $orderNumber,
                'status' => 'pending',
                'order_type' => $originalOrder->order_type,
                'subtotal' => $totalAmount,
                'delivery_fee' => $originalOrder->delivery_fee ?? 0,
                'total_amount' => $totalAmount + ($originalOrder->delivery_fee ?? 0),
                'payment_method' => $originalOrder->payment_method,
                'payment_status' => 'pending',
            ]);

            // Create order items
            foreach ($orderItems as $item) {
                OrderItem::create([
                    'order_id' => $newOrder->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'customizations' => $item['customizations'],
                ]);
            }

            DB::commit();

            // Load relationships
            $newOrder->load(['orderItems.product', 'user']);

            return $this->sendResponse($newOrder, 'Order reordered successfully', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to reorder', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Confirm order (for cash payments)
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function confirm($id)
    {
        try {
            $user = Auth::user();

            $order = Order::where('user_id', $user->id)
                ->where('id', $id)
                ->first();

            if (!$order) {
                return $this->sendError('Order not found', 404);
            }

            if ($order->status !== 'pending') {
                return $this->sendError('Order cannot be confirmed', 400, [
                    'current_status' => $order->status
                ]);
            }

            // For cash payments, mark as confirmed and update payment status
            if ($order->payment_method === 'cash') {
                $order->payment_status = 'paid';
                $order->save();
            }

            $order->load(['orderItems.product']);

            return $this->sendResponse($order, 'Order confirmed successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to confirm order', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Send order notification to customer
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendNotification(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'type' => 'required|in:order_created,status_update,order_ready,order_completed,order_cancelled',
            ]);

            $user = Auth::user();

            // Allow both customer and staff to send notifications
            // Customer can only send for their own orders
            // Staff (barista, manager, admin) can send for any order
            $query = Order::query();

            if (!$user->hasAnyRole(['barista', 'manager', 'workforce-manager', 'admin', 'super-admin'])) {
                $query->where('user_id', $user->id);
            }

            $order = $query->where('id', $id)->first();

            if (!$order) {
                return $this->sendError('Order not found', 404);
            }

            // Load the order's user relationship
            $order->load('user');

            // Send notification to the customer
            $order->user->notify(new OrderStatusNotification($order, $validated['type']));

            return $this->sendResponse([
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'notification_type' => $validated['type'],
                'sent_to' => $order->user->email,
            ], 'Notification sent successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to send notification', 500, ['error' => $e->getMessage()]);
        }
    }
}
