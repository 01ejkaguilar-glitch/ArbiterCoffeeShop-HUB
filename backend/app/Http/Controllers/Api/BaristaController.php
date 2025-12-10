<?php

namespace App\Http\Controllers\Api;

use App\Models\CoffeeBean;
use App\Models\DailyFeaturedOrigin;
use App\Models\Order;
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
                'pending_orders' => $orders->where('status', 'pending')->values()->toArray(),
                'preparing_orders' => $orders->where('status', 'preparing')->values()->toArray(),
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
     * Add a new coffee bean to inventory (barista access)
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function addCoffeeBean(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'origin_country' => 'required|string|max:255',
                'region' => 'nullable|string|max:255',
                'elevation' => 'nullable|string|max:255',
                'processing_method' => 'nullable|string|max:255',
                'variety' => 'nullable|string|max:255',
                'tasting_notes' => 'nullable|string',
                'producer' => 'nullable|string|max:255',
                'stock_quantity' => 'required|integer|min:0',
                'is_featured' => 'boolean',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            $imageUrl = null;
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $filename = time() . '_' . $image->getClientOriginalName();
                $image->move(public_path('storage/coffee-beans'), $filename);
                $imageUrl = '/storage/coffee-beans/' . $filename;
            }

            $bean = CoffeeBean::create([
                'name' => $request->input('name'),
                'origin_country' => $request->input('origin_country'),
                'region' => $request->input('region'),
                'elevation' => $request->input('elevation'),
                'processing_method' => $request->input('processing_method'),
                'variety' => $request->input('variety'),
                'tasting_notes' => $request->input('tasting_notes'),
                'producer' => $request->input('producer'),
                'stock_quantity' => $request->input('stock_quantity', 0),
                'is_featured' => $request->input('is_featured', false),
                'image_url' => $imageUrl,
            ]);

            return $this->sendResponse($bean, 'Coffee bean added successfully', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to add coffee bean', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Archive a coffee bean (soft delete)
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function archiveCoffeeBean($id)
    {
        try {
            $bean = CoffeeBean::findOrFail($id);
            $bean->delete(); // Soft delete

            return $this->sendResponse(null, 'Coffee bean archived successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to archive coffee bean', 500, ['error' => $e->getMessage()]);
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

            $totalOrders = $query->count();
            $completedOrders = (clone $query)->where('status', 'completed')->get();

            // Calculate average preparation time from timestamps
            $avgPrepTime = 0;
            if ($completedOrders->count() > 0) {
                $prepTimes = [];
                foreach ($completedOrders as $order) {
                    if ($order->prepared_at && $order->created_at) {
                        $prepTime = $order->prepared_at->diffInMinutes($order->created_at);
                        $prepTimes[] = $prepTime;
                    }
                }
                $avgPrepTime = count($prepTimes) > 0 ? array_sum($prepTimes) / count($prepTimes) : 0;
            }

            $stats = [
                'orders_completed' => $completedOrders->count(),
                'total_orders' => $totalOrders,
                'avg_preparation_time' => round($avgPrepTime, 1), // in minutes
                'customer_ratings' => 4.5, // TODO: Implement rating system
                'period' => $period,
            ];

            return $this->sendResponse($stats, 'Performance metrics retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve performance metrics', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get current shift information for barista
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCurrentShift()
    {
        try {
            $user = Auth::user();
            $today = today();

            // Get today's shift for this barista
            $shift = \App\Models\Shift::where('employee_id', $user->employee->id ?? null)
                ->where('date', $today)
                ->where('status', 'active')
                ->first();

            if (!$shift) {
                return $this->sendResponse(null, 'No active shift found for today');
            }

            $now = now();
            $shiftStart = $shift->start_time;
            $shiftEnd = $shift->end_time;

            $elapsedHours = $shiftStart && $now->isAfter($shiftStart)
                ? $shiftStart->diffInHours($now, true)
                : 0;

            $remainingHours = $shiftEnd && $now->isBefore($shiftEnd)
                ? $now->diffInHours($shiftEnd, true)
                : 0;

            $shiftData = [
                'id' => $shift->id,
                'date' => $shift->date->format('Y-m-d'),
                'start_time' => $shift->start_time?->format('H:i:s'),
                'end_time' => $shift->end_time?->format('H:i:s'),
                'position' => $shift->position,
                'role' => $shift->role,
                'status' => $shift->status,
                'notes' => $shift->notes,
                'elapsed_hours' => round($elapsedHours, 2),
                'remaining_hours' => round($remainingHours, 2),
                'breaks' => [] // TODO: Add break schedule if implemented
            ];

            return $this->sendResponse($shiftData, 'Current shift information retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve shift information', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get today's assigned tasks for barista
     *
     * @return \Illuminate\Http\JsonResponse
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

    /**
     * List all featured origins
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function listFeaturedOrigins()
    {
        try {
            $featuredOrigins = DailyFeaturedOrigin::with('coffeeBean')
                ->orderBy('feature_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            return $this->sendResponse($featuredOrigins, 'Featured origins retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve featured origins', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Create a new featured origin
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createFeaturedOrigin(Request $request)
    {
        try {
            $request->validate([
                'coffee_bean_id' => 'required|exists:coffee_beans,id',
                'feature_date' => 'required|date|after_or_equal:today',
                'start_time' => 'nullable|date_format:H:i',
                'end_time' => 'nullable|date_format:H:i|after:start_time',
                'special_notes' => 'nullable|string|max:1000',
                'promotion_text' => 'nullable|string|max:500',
                'is_active' => 'boolean'
            ]);

            // Check if there's already a featured origin for this date
            $existing = DailyFeaturedOrigin::where('feature_date', $request->feature_date)
                ->where('is_active', true)
                ->first();

            if ($existing) {
                return $this->sendError('A featured origin already exists for this date', 422);
            }

            $featuredOrigin = DailyFeaturedOrigin::create([
                'coffee_bean_id' => $request->coffee_bean_id,
                'feature_date' => $request->feature_date,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'special_notes' => $request->special_notes,
                'promotion_text' => $request->promotion_text,
                'is_active' => $request->is_active ?? true,
                'created_by' => Auth::id(),
            ]);

            $featuredOrigin->load('coffeeBean');

            return $this->sendResponse($featuredOrigin, 'Featured origin created successfully', 201);
        } catch (\Exception $e) {
            return $this->sendError('Failed to create featured origin', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update a featured origin
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateFeaturedOrigin(Request $request, $id)
    {
        try {
            $featuredOrigin = DailyFeaturedOrigin::findOrFail($id);

            $request->validate([
                'coffee_bean_id' => 'sometimes|exists:coffee_beans,id',
                'feature_date' => 'sometimes|date|after_or_equal:today',
                'start_time' => 'nullable|date_format:H:i',
                'end_time' => 'nullable|date_format:H:i|after:start_time',
                'special_notes' => 'nullable|string|max:1000',
                'promotion_text' => 'nullable|string|max:500',
                'is_active' => 'boolean'
            ]);

            // Check for conflicts if date is being changed
            if ($request->has('feature_date') && $request->feature_date !== $featuredOrigin->feature_date) {
                $existing = DailyFeaturedOrigin::where('feature_date', $request->feature_date)
                    ->where('is_active', true)
                    ->where('id', '!=', $id)
                    ->first();

                if ($existing) {
                    return $this->sendError('A featured origin already exists for this date', 422);
                }
            }

            $featuredOrigin->update($request->only([
                'coffee_bean_id',
                'feature_date',
                'start_time',
                'end_time',
                'special_notes',
                'promotion_text',
                'is_active'
            ]));

            $featuredOrigin->load('coffeeBean');

            return $this->sendResponse($featuredOrigin, 'Featured origin updated successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to update featured origin', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Delete a featured origin
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteFeaturedOrigin($id)
    {
        try {
            $featuredOrigin = DailyFeaturedOrigin::findOrFail($id);
            $featuredOrigin->delete();

            return $this->sendResponse(null, 'Featured origin deleted successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to delete featured origin', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get available coffee beans for featuring
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAvailableBeans()
    {
        try {
            $beans = CoffeeBean::where('is_available', true)
                ->select('id', 'name', 'origin_country', 'region', 'tasting_notes', 'stock_quantity')
                ->orderBy('name')
                ->get();

            return $this->sendResponse($beans, 'Available coffee beans retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve available beans', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get today's featured origin
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTodaysFeaturedOrigin()
    {
        try {
            $featuredOrigin = DailyFeaturedOrigin::activeToday()
                ->with('coffeeBean')
                ->first();

            if (!$featuredOrigin) {
                return $this->sendResponse(null, 'No featured origin set for today');
            }

            return $this->sendResponse($featuredOrigin, 'Today\'s featured origin retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve today\'s featured origin', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get featured origin by date
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getFeaturedOriginByDate(Request $request)
    {
        try {
            $request->validate([
                'date' => 'required|date'
            ]);

            $featuredOrigin = DailyFeaturedOrigin::byDate($request->date)
                ->with('coffeeBean')
                ->first();

            if (!$featuredOrigin) {
                return $this->sendResponse(null, 'No featured origin found for this date');
            }

            return $this->sendResponse($featuredOrigin, 'Featured origin retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve featured origin', 500, ['error' => $e->getMessage()]);
        }
    }
}
