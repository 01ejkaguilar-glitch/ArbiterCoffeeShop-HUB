<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Events\OrderStatusUpdated;
use App\Notifications\OrderStatusNotification;
use App\Http\Requests\UpdateOrderStatusRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class KitchenController extends BaseController
{
    /**
     * Get kitchen dashboard statistics
     */
    public function getDashboard()
    {
        try {
            $today = now()->startOfDay();

            // Get food category IDs once (non-beverage categories)
            $foodCategoryIds = \App\Models\Category::where('name', 'NOT LIKE', '%coffee%')
                ->where('name', 'NOT LIKE', '%tea%')
                ->where('name', 'NOT LIKE', '%beverage%')
                ->where('name', 'NOT LIKE', '%drink%')
                ->pluck('id');

            // Get food order IDs in a single query
            $foodOrderIds = \App\Models\OrderItem::whereHas('product', function ($q) use ($foodCategoryIds) {
                $q->whereIn('category_id', $foodCategoryIds);
            })->pluck('order_id')->unique();

            // Single query with conditional counts instead of 4 separate queries
            $counts = Order::whereIn('id', $foodOrderIds)
                ->selectRaw("
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
                    SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing_orders,
                    SUM(CASE WHEN status = 'completed' AND DATE(updated_at) = ? THEN 1 ELSE 0 END) as completed_today,
                    SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) as total_food_orders_today
                ", [$today->toDateString(), $today->toDateString()])
                ->first();

            $stats = [
                'pending_orders' => (int) ($counts->pending_orders ?? 0),
                'preparing_orders' => (int) ($counts->preparing_orders ?? 0),
                'completed_today' => (int) ($counts->completed_today ?? 0),
                'total_food_orders_today' => (int) ($counts->total_food_orders_today ?? 0),
                'average_preparation_time' => '20 minutes',
            ];

            return $this->sendResponse($stats, 'Kitchen dashboard statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve dashboard', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get food order queue (orders containing food items)
     */
    public function getOrderQueue()
    {
        try {
            // Filter food orders at the database level instead of loading all + filtering in PHP
            $foodOrders = Order::whereIn('status', ['pending', 'confirmed', 'preparing', 'ready'])
                ->whereHas('orderItems.product.category', function ($q) {
                    $q->where('name', 'NOT LIKE', '%coffee%')
                      ->where('name', 'NOT LIKE', '%tea%')
                      ->where('name', 'NOT LIKE', '%beverage%')
                      ->where('name', 'NOT LIKE', '%drink%');
                })
                ->with(['orderItems.product.category', 'user'])
                ->orderBy('created_at', 'asc')
                ->get();

            $queueData = [
                'pending_orders' => $foodOrders->where('status', 'pending')->values()->toArray(),
                'confirmed_orders' => $foodOrders->where('status', 'confirmed')->values()->toArray(),
                'preparing_orders' => $foodOrders->where('status', 'preparing')->values()->toArray(),
                'ready_orders' => $foodOrders->where('status', 'ready')->values()->toArray(),
                'total_queue' => $foodOrders->count(),
            ];

            return $this->sendResponse($queueData, 'Kitchen order queue retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve order queue', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update order status
     */
    public function updateOrderStatus(UpdateOrderStatusRequest $request, $id)
    {
        try {
            $order = Order::findOrFail($id);

            $validTransitions = [
                'pending'   => ['confirmed', 'preparing', 'cancelled'],
                'confirmed' => ['preparing', 'cancelled'],
                'preparing' => ['ready', 'completed', 'cancelled'],
                'ready'     => ['completed'],
                'completed' => [],
                'cancelled' => [],
            ];

            if (!in_array($request->input('status'), $validTransitions[$order->status])) {
                return $this->sendError('Invalid status transition', 400, [
                    'current_status' => $order->status,
                    'requested_status' => $request->input('status')
                ]);
            }

            $order->status = $request->input('status');

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

            // Broadcast real-time event and send notification to customer
            $oldStatus = $order->getOriginal('status') ?? 'pending';
            event(new OrderStatusUpdated($order, $oldStatus, $request->input('status'), auth()->user()));

            if ($order->user) {
                $notifType = match ($request->input('status')) {
                    'preparing' => 'status_update',
                    'ready'     => 'order_ready',
                    'completed' => 'order_completed',
                    'cancelled' => 'order_cancelled',
                    default     => 'status_update',
                };
                $order->user->notify(new OrderStatusNotification($order, $notifType));
            }

            return $this->sendResponse($order, 'Order status updated successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to update order status', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get completed food orders
     */
    public function getCompletedOrders(Request $request)
    {
        try {
            $query = Order::where('status', 'completed')
                ->with(['orderItems.product.category', 'user']);

            if ($request->has('date') && $request->input('date')) {
                $query->whereDate('completed_at', $request->input('date'));
            }

            $orders = $query->orderBy('completed_at', 'desc')->paginate(20);

            return $this->sendResponse($orders, 'Completed orders retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve completed orders', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get kitchen performance metrics
     */
    public function getPerformance(Request $request)
    {
        try {
            $user = Auth::user();
            $period = $request->input('period', 'today');

            $query = Order::query();

            if ($period === 'today') {
                $query->whereDate('created_at', today());
            } elseif ($period === 'week') {
                $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
            } elseif ($period === 'month') {
                $query->whereMonth('created_at', now()->month);
            }

            $totalOrders = $query->count();
            $completedOrders = (clone $query)->where('status', 'completed')->count();

            $stats = [
                'orders_completed' => $completedOrders,
                'total_orders' => $totalOrders,
                'period' => $period,
            ];

            return $this->sendResponse($stats, 'Kitchen performance metrics retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve performance metrics', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get current shift for logged-in kitchen staff
     */
    public function getCurrentShift()
    {
        try {
            $user = Auth::user();
            $today = today();

            $shift = \App\Models\Shift::where('employee_id', $user->employee->id ?? null)
                ->where('date', $today)
                ->where('status', 'active')
                ->first();

            if (!$shift) {
                return $this->sendResponse(null, 'No active shift found for today');
            }

            $shiftData = [
                'id' => $shift->id,
                'date' => $shift->date->format('Y-m-d'),
                'start_time' => $shift->start_time?->format('H:i:s'),
                'end_time' => $shift->end_time?->format('H:i:s'),
                'position' => $shift->position,
                'role' => $shift->role,
                'status' => $shift->status,
            ];

            return $this->sendResponse($shiftData, 'Current shift information retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve shift information', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get today's tasks for kitchen staff
     */
    public function getTodaysTasks()
    {
        try {
            $user = Auth::user();

            $tasks = \App\Models\Task::where('assigned_to', $user->employee->id ?? null)
                ->whereDate('due_date', today())
                ->orderBy('priority', 'desc')
                ->orderBy('created_at', 'asc')
                ->get();

            return $this->sendResponse($tasks, 'Today\'s tasks retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve today\'s tasks', 500, ['error' => $e->getMessage()]);
        }
    }
}
