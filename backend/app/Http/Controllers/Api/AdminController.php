<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;

class AdminController extends BaseController
{
    /**
     * Get all users with pagination and filters
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUsers(Request $request)
    {
        try {
            $query = User::with('roles');

            // Include trashed users if filtering by inactive, otherwise only active
            if ($request->has('status') && $request->input('status') === 'inactive') {
                $query->onlyTrashed();
            } else {
                $query->whereNull('deleted_at');
            }

            // Filter by role
            if ($request->has('role')) {
                $query->role($request->input('role'));
            }

            // Search by name or email
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Sort
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $users = $query->paginate($request->get('per_page', 15));

            // Add status to each user
            $users->getCollection()->transform(function ($user) {
                $user->status = $user->trashed() ? 'inactive' : 'active';
                return $user;
            });

            return $this->sendResponse($users, 'Users retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve users', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get single user details
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUser($id)
    {
        try {
            $user = User::with([
                'roles',
                'customerProfile',
                'orders' => function ($query) {
                    $query->with(['orderItems.product:id,name,price'])
                          ->orderBy('created_at', 'desc')
                          ->limit(10); // Limit to prevent loading too many orders
                }
            ])->findOrFail($id);

            return $this->sendResponse($user, 'User details retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('User not found', 404, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Create new user
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createUser(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
                'role' => 'required|in:customer,barista,manager,admin,super-admin',
            ]);

            $user = User::create([
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'password' => Hash::make($request->input('password')),
            ]);

            // Assign role
            $user->assignRole($request->input('role'));

            return $this->sendResponse($user->load('roles'), 'User created successfully', 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to create user', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update user
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateUser(Request $request, $id)
    {
        try {
            $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $id,
                'password' => 'sometimes|string|min:8',
                'role' => 'sometimes|in:customer,barista,manager,admin,super-admin',
            ]);

            $user = User::findOrFail($id);

            // Update basic info
            if ($request->has('name')) {
                $user->name = $request->input('name');
            }

            if ($request->has('email')) {
                $user->email = $request->input('email');
            }

            if ($request->has('password')) {
                $user->password = Hash::make($request->input('password'));
            }

            $user->save();

            // Update role if provided
            if ($request->has('role')) {
                $user->syncRoles([$request->input('role')]);
            }

            return $this->sendResponse($user->load('roles'), 'User updated successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to update user', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Deactivate user (soft delete)
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function deactivateUser($id)
    {
        try {
            $user = User::findOrFail($id);

            // Prevent self-deactivation
            if ($user->id === auth()->id()) {
                return $this->sendError('Cannot deactivate your own account', 403);
            }

            $user->delete();

            return $this->sendResponse(null, 'User deactivated successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to deactivate user', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Reactivate user
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function reactivateUser($id)
    {
        try {
            $user = User::withTrashed()->findOrFail($id);
            $user->restore();

            return $this->sendResponse($user, 'User reactivated successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to reactivate user', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get user statistics
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserStatistics()
    {
        try {
            $stats = [
                'total_users' => User::count(),
                'active_users' => User::count(),
                'inactive_users' => 0, // Not using soft deletes on User model
                'by_role' => [
                    'customers' => User::role('customer')->count(),
                    'baristas' => User::role('barista')->count(),
                    'managers' => User::role('manager')->count(),
                    'admins' => User::role('admin')->count(),
                ],
                'new_users_today' => User::whereDate('created_at', today())->count(),
                'new_users_this_week' => User::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
                'new_users_this_month' => User::whereMonth('created_at', now()->month)->count(),
            ];

            return $this->sendResponse($stats, 'User statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve statistics', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get all orders (Admin access)
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllOrders(Request $request)
    {
        try {
            $query = Order::with(['user', 'orderItems.product']);

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            // Filter by payment status
            if ($request->has('payment_status')) {
                $query->where('payment_status', $request->input('payment_status'));
            }

            // Filter by order type
            if ($request->has('order_type')) {
                $query->where('order_type', $request->input('order_type'));
            }

            // Search by order number or customer name
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function($q) use ($search) {
                    $q->where('order_number', 'like', "%{$search}%")
                      ->orWhereHas('user', function($userQuery) use ($search) {
                          $userQuery->where('name', 'like', "%{$search}%")
                                    ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            // Date range filter
            if ($request->has('start_date')) {
                $query->whereDate('created_at', '>=', $request->input('start_date'));
            }
            if ($request->has('end_date')) {
                $query->whereDate('created_at', '<=', $request->input('end_date'));
            }

            // Sort
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $orders = $query->paginate($request->get('per_page', 15));

            return $this->sendResponse($orders, 'Orders retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve orders', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get order details (Admin access)
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getOrderDetails($id)
    {
        try {
            $order = Order::with(['user', 'orderItems.product', 'deliveryAddress'])
                ->findOrFail($id);

            return $this->sendResponse($order, 'Order details retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Order not found', 404, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update order status (Admin access)
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateOrderStatus(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:pending,confirmed,preparing,ready,completed,cancelled',
            ]);

            if ($validator->fails()) {
                return $this->sendValidationError($validator->errors()->toArray());
            }

            $order = Order::findOrFail($id);
            $oldStatus = $order->status;
            $newStatus = $request->input('status');

            // Create status history entry (store as JSON in a note or just log it)
            $statusHistory = [
                'from' => $oldStatus,
                'to' => $newStatus,
                'timestamp' => now()->toIso8601String(),
                'updated_by' => auth()->user()->name ?? 'Admin'
            ];

            // For now, we'll just log the status change since status_history column doesn't exist
            // You might want to add a status_history column or use a separate table for this
            \Log::info('Order status changed', $statusHistory);

            $order->status = $newStatus;

            // Set completed_at timestamp when status is completed
            if ($newStatus === 'completed' && $oldStatus !== 'completed') {
                $order->completed_at = now();
            }

            // Set prepared_at timestamp when status is ready
            if ($newStatus === 'ready' && $oldStatus !== 'ready') {
                $order->prepared_at = now();
            }

            $order->save();

            // Optionally send notification to customer
            // event(new OrderStatusUpdated($order));

            return $this->sendResponse($order->load(['user', 'orderItems.product']), 'Order status updated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to update order status', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get dashboard statistics
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDashboardStats()
    {
        try {
            $stats = [
                'totalOrders' => Order::count(),
                'totalUsers' => User::count(),
                'totalProducts' => Product::count(),
                'totalRevenue' => Order::where('payment_status', 'paid')->sum('total_amount'),
            ];

            // Get recent orders
            $recentOrders = Order::with(['user', 'orderItems'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            $data = [
                'stats' => $stats,
                'recentOrders' => $recentOrders,
            ];

            return $this->sendResponse($data, 'Dashboard statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve dashboard statistics', 500, ['error' => $e->getMessage()]);
        }
    }
}
