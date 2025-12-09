<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Models\CoffeeBean;
use App\Http\Requests\UpdateOrderStatusRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BaristaController extends BaseController
{
    /**
     * Get active orders queue
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getOrderQueue()
    {
        try {
            $orders = Order::whereIn('status', ['pending', 'preparing'])
                ->with(['orderItems.product', 'user'])
                ->orderBy('created_at', 'asc')
                ->get();

            $queueData = [
                'pending_orders' => $orders->where('status', 'pending'),
                'preparing_orders' => $orders->where('status', 'preparing'),
                'total_queue' => $orders->count(),
            ];

            return $this->sendResponse($queueData, 'Order queue retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve order queue', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update order status
     *
     * @param \App\Http\Requests\UpdateOrderStatusRequest $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateOrderStatus(UpdateOrderStatusRequest $request, $id)
    {
        try {
            $order = Order::findOrFail($id);

            // Validate status transition
            $validTransitions = [
                'pending' => ['preparing', 'cancelled'],
                'preparing' => ['ready', 'completed', 'cancelled'],
                'ready' => ['completed'],
                'completed' => [],
                'cancelled' => [],
            ];

            if (!in_array($request->input('status'), $validTransitions[$order->status])) {
                return $this->sendError('Invalid status transition', 400, [
                    'current_status' => $order->status,
                    'requested_status' => $request->input('status')
                ]);
            }

            $oldStatus = $order->status;
            $order->status = $request->input('status');

            // Set timestamps based on status
            if ($request->input('status') === 'preparing' && !$order->prepared_at) {
                $order->prepared_at = now();
            } elseif (in_array($request->input('status'), ['completed', 'cancelled']) && !$order->completed_at) {
                $order->completed_at = now();
            }

            if ($request->input('notes')) {
                $order->notes = $request->input('notes');
            }

            if ($request->input('estimated_completion_time')) {
                $order->estimated_completion_time = $request->input('estimated_completion_time');
            }

            $order->save();

            $order->load(['orderItems.product', 'user']);

            // TODO: Broadcast real-time notification in Stage 5 Week 15

            return $this->sendResponse($order, 'Order status updated successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to update order status', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get completed orders
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCompletedOrders(Request $request)
    {
        try {
            $query = Order::where('status', 'completed')
                ->with(['orderItems.product', 'user']);

            // Filter by date if provided
            if ($request->has('date')) {
                $query->whereDate('updated_at', $request->input('date'));
            }

            $orders = $query->orderBy('updated_at', 'desc')
                ->paginate(20);

            return $this->sendResponse($orders, 'Completed orders retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve completed orders', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get barista dashboard statistics
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDashboard()
    {
        try {
            $today = now()->startOfDay();

            $stats = [
                'pending_orders' => Order::where('status', 'pending')->count(),
                'preparing_orders' => Order::where('status', 'preparing')->count(),
                'completed_today' => Order::where('status', 'completed')
                    ->whereDate('updated_at', $today)
                    ->count(),
                'total_revenue_today' => Order::where('status', 'completed')
                    ->where('payment_status', 'paid')
                    ->whereDate('updated_at', $today)
                    ->sum('total_amount'),
                'average_preparation_time' => '15 minutes', // TODO: Calculate from actual data
            ];

            return $this->sendResponse($stats, 'Dashboard statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve dashboard', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * List coffee beans (for barista management)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function listCoffeeBeans()
    {
        try {
            $beans = CoffeeBean::orderBy('name', 'asc')->get();

            return $this->sendResponse($beans, 'Coffee beans retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve coffee beans', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update coffee bean stock
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateBeanStock(Request $request, $id)
    {
        try {
            $request->validate([
                'stock_quantity' => 'required|integer|min:0',
            ]);

            $bean = CoffeeBean::findOrFail($id);
            $bean->stock_quantity = $request->input('stock_quantity');
            $bean->save();

            return $this->sendResponse($bean, 'Coffee bean stock updated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to update coffee bean stock', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get barista performance metrics
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPerformance(Request $request)
    {
        try {
            $user = Auth::user();
            $period = $request->input('period', 'today');

            $query = Order::where('barista_id', $user->id);

            if ($period === 'today') {
                $query->whereDate('created_at', today());
            } elseif ($period === 'week') {
                $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
            } elseif ($period === 'month') {
                $query->whereMonth('created_at', now()->month);
            }

            $stats = [
                'orders_completed' => $query->where('status', 'completed')->count(),
                'total_orders' => $query->count(),
                'avg_preparation_time' => $query->avg('preparation_time') ?? 0,
                'customer_ratings' => $query->avg('rating') ?? 0,
                'period' => $period,
            ];

            return $this->sendResponse($stats, 'Performance metrics retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve performance metrics', 500, ['error' => $e->getMessage()]);
        }
    }
}
