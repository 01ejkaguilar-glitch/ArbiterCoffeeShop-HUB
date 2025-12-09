<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Models\User;
use App\Models\Product;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\InventoryItem;
use App\Models\PerformanceReview;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AnalyticsController extends BaseController
{
    /**
     * Get sales analytics
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSalesAnalytics(Request $request)
    {
        try {
            $startDate = $request->get('start_date', now()->startOfMonth());
            $endDate = $request->get('end_date', now()->endOfMonth());

            // Overall sales stats
            $totalSales = Order::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->sum('total_amount');

            $totalOrders = Order::whereBetween('created_at', [$startDate, $endDate])->count();

            $avgOrderValue = $totalOrders > 0 ? $totalSales / $totalOrders : 0;

            // Sales by day
            $dailySales = Order::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total, COUNT(*) as orders')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            // Top selling products with category
            $topProducts = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                ->whereBetween('orders.created_at', [$startDate, $endDate])
                ->where('orders.payment_status', 'paid')
                ->select([
                    'products.name',
                    'categories.name as category',
                    DB::raw('SUM(order_items.quantity) as total_sold'),
                    DB::raw('SUM(order_items.quantity * order_items.unit_price) as revenue')
                ])
                ->groupBy('products.id', 'products.name', 'categories.name')
                ->orderByDesc('total_sold')
                ->limit(10)
                ->get();

            // Revenue by category
            $revenueByCategory = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->join('categories', 'products.category_id', '=', 'categories.id')
                ->whereBetween('orders.created_at', [$startDate, $endDate])
                ->where('orders.payment_status', 'paid')
                ->select([
                    'categories.name',
                    DB::raw('COUNT(DISTINCT orders.id) as order_count'),
                    DB::raw('SUM(order_items.quantity * order_items.unit_price) as revenue'),
                    DB::raw('ROUND((SUM(order_items.quantity * order_items.unit_price) / ' . ($totalSales > 0 ? $totalSales : 1) . ') * 100, 2) as percentage')
                ])
                ->groupBy('categories.id', 'categories.name')
                ->orderByDesc('revenue')
                ->get();

            // Orders by status
            $totalOrderCount = Order::whereBetween('created_at', [$startDate, $endDate])->count();
            $ordersByStatus = Order::whereBetween('created_at', [$startDate, $endDate])
                ->selectRaw('status, COUNT(*) as count, SUM(total_amount) as total')
                ->groupBy('status')
                ->get()
                ->map(function ($item) use ($totalOrderCount) {
                    $item->percentage = $totalOrderCount > 0 ? round(($item->count / $totalOrderCount) * 100, 2) : 0;
                    return $item;
                });

            // Sales by order type
            $orderTypeBreakdown = Order::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->selectRaw('order_type, COUNT(*) as count, SUM(total_amount) as total')
                ->groupBy('order_type')
                ->get();

            // Payment method breakdown
            $paymentMethodBreakdown = Order::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->selectRaw('payment_method, COUNT(*) as count, SUM(total_amount) as total')
                ->groupBy('payment_method')
                ->get();

            // Total customers
            $totalCustomers = User::role('customer')->count();

            $analytics = [
                'totalRevenue' => (float) $totalSales,
                'totalOrders' => $totalOrders,
                'totalCustomers' => $totalCustomers,
                'averageOrderValue' => (float) $avgOrderValue,
                'topProducts' => $topProducts,
                'revenueByCategory' => $revenueByCategory,
                'ordersByStatus' => $ordersByStatus,
                'summary' => [
                    'total_sales' => number_format($totalSales, 2),
                    'total_orders' => $totalOrders,
                    'average_order_value' => number_format($avgOrderValue, 2),
                ],
                'daily_sales' => $dailySales,
                'order_type_breakdown' => $orderTypeBreakdown,
                'payment_method_breakdown' => $paymentMethodBreakdown,
                'date_range' => [
                    'start' => $startDate,
                    'end' => $endDate,
                ],
            ];

            return $this->sendResponse($analytics, 'Sales analytics retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve sales analytics', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get customer analytics
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCustomerAnalytics(Request $request)
    {
        try {
            $startDate = $request->get('start_date', now()->startOfMonth());
            $endDate = $request->get('end_date', now()->endOfMonth());

            // Total customers
            $totalCustomers = User::role('customer')->count();
            $newCustomers = User::role('customer')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();

            // Active customers (who placed orders in period)
            $activeCustomers = User::role('customer')
                ->whereHas('orders', function ($query) use ($startDate, $endDate) {
                    $query->whereBetween('created_at', [$startDate, $endDate]);
                })
                ->count();

            // Top customers by spending
            $topCustomers = User::role('customer')
                ->select(['users.id', 'users.name', 'users.email'])
                ->selectRaw('COUNT(orders.id) as order_count')
                ->selectRaw('SUM(orders.total_amount) as total_spent')
                ->join('orders', 'users.id', '=', 'orders.user_id')
                ->whereBetween('orders.created_at', [$startDate, $endDate])
                ->where('orders.payment_status', 'paid')
                ->groupBy('users.id', 'users.name', 'users.email')
                ->orderByDesc('total_spent')
                ->limit(10)
                ->get();

            // Customer retention (repeat customers)
            $repeatCustomers = User::role('customer')
                ->whereHas('orders', function ($query) use ($startDate, $endDate) {
                    $query->whereBetween('created_at', [$startDate, $endDate]);
                }, '>', 1)
                ->count();

            $retentionRate = $activeCustomers > 0 ? ($repeatCustomers / $activeCustomers) * 100 : 0;

            // Average order frequency
            $avgOrderFrequency = $activeCustomers > 0
                ? Order::whereBetween('created_at', [$startDate, $endDate])->count() / $activeCustomers
                : 0;

            $analytics = [
                'summary' => [
                    'total_customers' => $totalCustomers,
                    'new_customers' => $newCustomers,
                    'active_customers' => $activeCustomers,
                    'repeat_customers' => $repeatCustomers,
                    'retention_rate' => number_format($retentionRate, 2) . '%',
                    'avg_order_frequency' => number_format($avgOrderFrequency, 2),
                ],
                'top_customers' => $topCustomers,
                'date_range' => [
                    'start' => $startDate,
                    'end' => $endDate,
                ],
            ];

            return $this->sendResponse($analytics, 'Customer analytics retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve customer analytics', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get performance analytics
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPerformanceAnalytics(Request $request)
    {
        try {
            $startDate = $request->get('start_date', now()->startOfMonth());
            $endDate = $request->get('end_date', now()->endOfMonth());

            // Employee performance
            $employeePerformance = Employee::select('employees.*')
                ->selectRaw('COUNT(DISTINCT orders.id) as orders_processed')
                ->selectRaw('COUNT(DISTINCT attendances.id) as days_worked')
                ->leftJoin('users', 'employees.user_id', '=', 'users.id')
                ->leftJoin('orders', function ($join) use ($startDate, $endDate) {
                    $join->on('users.id', '=', 'orders.user_id')
                        ->whereBetween('orders.created_at', [$startDate, $endDate]);
                })
                ->leftJoin('attendances', function ($join) use ($startDate, $endDate) {
                    $join->on('employees.id', '=', 'attendances.employee_id')
                        ->whereBetween('attendances.date', [$startDate, $endDate]);
                })
                ->groupBy('employees.id')
                ->get();

            // Attendance statistics
            $totalScheduledDays = Attendance::whereBetween('date', [$startDate, $endDate])->count();
            $presentDays = Attendance::whereBetween('date', [$startDate, $endDate])
                ->where('status', 'present')
                ->count();
            $attendanceRate = $totalScheduledDays > 0 ? ($presentDays / $totalScheduledDays) * 100 : 0;

            // Average order completion time (mock data - would need actual tracking)
            $avgCompletionTime = DB::table('orders')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->whereNotNull('completed_at')
                ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, completed_at)) as avg_minutes')
                ->first();

            $analytics = [
                'summary' => [
                    'total_employees' => Employee::where('status', 'active')->count(),
                    'attendance_rate' => number_format($attendanceRate, 2) . '%',
                    'avg_completion_time' => $avgCompletionTime->avg_minutes ? number_format($avgCompletionTime->avg_minutes, 2) . ' minutes' : 'N/A',
                ],
                'employee_performance' => $employeePerformance,
                'date_range' => [
                    'start' => $startDate,
                    'end' => $endDate,
                ],
            ];

            return $this->sendResponse($analytics, 'Performance analytics retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve performance analytics', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get dashboard overview
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDashboardOverview()
    {
        try {
            $today = today();
            $thisWeek = [now()->startOfWeek(), now()->endOfWeek()];
            $thisMonth = [now()->startOfMonth(), now()->endOfMonth()];

            $overview = [
                'today' => [
                    'sales' => Order::whereDate('created_at', $today)->where('payment_status', 'paid')->sum('total_amount'),
                    'orders' => Order::whereDate('created_at', $today)->count(),
                    'customers' => Order::whereDate('created_at', $today)->distinct('user_id')->count(),
                ],
                'this_week' => [
                    'sales' => Order::whereBetween('created_at', $thisWeek)->where('payment_status', 'paid')->sum('total_amount'),
                    'orders' => Order::whereBetween('created_at', $thisWeek)->count(),
                    'customers' => Order::whereBetween('created_at', $thisWeek)->distinct('user_id')->count(),
                ],
                'this_month' => [
                    'sales' => Order::whereBetween('created_at', $thisMonth)->where('payment_status', 'paid')->sum('total_amount'),
                    'orders' => Order::whereBetween('created_at', $thisMonth)->count(),
                    'customers' => Order::whereBetween('created_at', $thisMonth)->distinct('user_id')->count(),
                ],
                'pending_orders' => Order::where('status', 'pending')->count(),
                'active_employees' => Employee::where('status', 'active')->count(),
                'low_stock_items' => DB::table('inventory_items')->whereRaw('quantity <= reorder_level')->count(),
            ];

            return $this->sendResponse($overview, 'Dashboard overview retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve dashboard overview', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get barista performance analytics
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBaristaPerformance(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'employee_id' => 'nullable|exists:employees,id',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', 422, $validator->errors()->toArray());
            }

            $startDate = $request->input('start_date') ?? Carbon::now()->subDays(30)->toDateString();
            $endDate = $request->input('end_date') ?? Carbon::now()->toDateString();
            $employeeId = $request->input('employee_id');

            $query = Employee::with(['user', 'performanceReviews', 'attendances'])
                ->where('position', 'barista')
                ->orWhere('position', 'senior_barista');

            if ($employeeId) {
                $query->where('id', $employeeId);
            }

            $employees = $query->get();

            $performanceData = $employees->map(function ($employee) use ($startDate, $endDate) {
                // Get performance reviews in date range
                $reviews = $employee->performanceReviews()
                    ->whereBetween('review_date', [$startDate, $endDate])
                    ->get();

                // Calculate average scores
                $avgScores = [
                    'speed_score' => $reviews->avg('speed_score') ?? 0,
                    'quality_score' => $reviews->avg('quality_score') ?? 0,
                    'attendance_score' => $reviews->avg('attendance_score') ?? 0,
                    'teamwork_score' => $reviews->avg('teamwork_score') ?? 0,
                    'customer_service_score' => $reviews->avg('customer_service_score') ?? 0,
                    'overall_score' => $reviews->avg('overall_score') ?? 0,
                ];

                // Get attendance metrics
                $attendances = $employee->attendances()
                    ->whereBetween('date', [$startDate, $endDate])
                    ->get();

                $attendanceMetrics = [
                    'total_days' => $attendances->count(),
                    'present_days' => $attendances->where('status', 'present')->count(),
                    'late_days' => $attendances->where('status', 'late')->count(),
                    'absent_days' => $attendances->where('status', 'absent')->count(),
                    'attendance_rate' => $attendances->count() > 0
                        ? round(($attendances->where('status', 'present')->count() / $attendances->count()) * 100, 2)
                        : 0,
                ];

                // Get shift metrics
                $shifts = Shift::where('employee_id', $employee->id)
                    ->whereBetween('date', [$startDate, $endDate])
                    ->get();

                $shiftMetrics = [
                    'total_shifts' => $shifts->count(),
                    'completed_shifts' => $shifts->where('status', 'completed')->count(),
                    'cancelled_shifts' => $shifts->where('status', 'cancelled')->count(),
                ];

                return [
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->user->name,
                    'employee_number' => $employee->employee_number,
                    'position' => $employee->position,
                    'average_scores' => $avgScores,
                    'attendance_metrics' => $attendanceMetrics,
                    'shift_metrics' => $shiftMetrics,
                    'total_reviews' => $reviews->count(),
                ];
            });

            return $this->sendResponse([
                'performance_data' => $performanceData,
                'date_range' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'summary' => [
                    'total_baristas' => $performanceData->count(),
                    'avg_overall_score' => round($performanceData->avg('average_scores.overall_score'), 2),
                    'avg_attendance_rate' => round($performanceData->avg('attendance_metrics.attendance_rate'), 2),
                ],
            ], 'Barista performance data retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Error retrieving barista performance', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Generate performance report
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    /** @phpstan-ignore-next-line */
    public function generatePerformanceReport(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'employee_ids' => 'nullable|array',
                'employee_ids.*' => 'exists:employees,id',
                'report_type' => 'required|in:summary,detailed,comparison',
                'format' => 'nullable|in:json,pdf,csv',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', 422, $validator->errors()->toArray());
            }

            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $employeeIds = $request->input('employee_ids');
            $reportType = $request->input('report_type');
            $format = $request->get('format', 'json');

            $query = Employee::with(['user', 'performanceReviews', 'attendances']);

            if ($employeeIds) {
                $query->whereIn('id', $employeeIds);
            }

            $employees = $query->get();

            $reportData = [];

            if ($reportType === 'summary') {
                // Summary report: aggregated statistics
                $allReviews = PerformanceReview::whereBetween('review_date', [$startDate, $endDate])
                    ->when($employeeIds, function ($q) use ($employeeIds) {
                        return $q->whereIn('employee_id', $employeeIds);
                    })
                    ->get();

                $reportData = [
                    'report_type' => 'summary',
                    'total_employees' => $employees->count(),
                    'total_reviews' => $allReviews->count(),
                    'average_scores' => [
                        'speed' => round($allReviews->avg('speed_score'), 2),
                        'quality' => round($allReviews->avg('quality_score'), 2),
                        'attendance' => round($allReviews->avg('attendance_score'), 2),
                        'teamwork' => round($allReviews->avg('teamwork_score'), 2),
                        'customer_service' => round($allReviews->avg('customer_service_score'), 2),
                        'overall' => round($allReviews->avg('overall_score'), 2),
                    ],
                    'score_distribution' => [
                        'excellent' => $allReviews->where('overall_score', '>=', 90)->count(),
                        'good' => $allReviews->whereBetween('overall_score', [75, 89])->count(),
                        'average' => $allReviews->whereBetween('overall_score', [60, 74])->count(),
                        'needs_improvement' => $allReviews->where('overall_score', '<', 60)->count(),
                    ],
                ];
            } elseif ($reportType === 'detailed') {
                // Detailed report: individual employee breakdown
                $reportData = $employees->map(function ($employee) use ($startDate, $endDate) {
                    $reviews = $employee->performanceReviews()
                        ->whereBetween('review_date', [$startDate, $endDate])
                        ->get();

                    return [
                        'employee_id' => $employee->id,
                        'employee_name' => $employee->user->name,
                        'position' => $employee->position,
                        'total_reviews' => $reviews->count(),
                        'reviews' => $reviews->map(function ($review) {
                            return [
                                'review_date' => $review->review_date,
                                'period_start' => $review->period_start,
                                'period_end' => $review->period_end,
                                'scores' => [
                                    'speed' => $review->speed_score,
                                    'quality' => $review->quality_score,
                                    'attendance' => $review->attendance_score,
                                    'teamwork' => $review->teamwork_score,
                                    'customer_service' => $review->customer_service_score,
                                    'overall' => $review->overall_score,
                                ],
                                'comments' => $review->comments,
                                'reviewed_by' => $review->reviewedBy->name ?? 'N/A',
                            ];
                        }),
                        'average_scores' => [
                            'speed' => round($reviews->avg('speed_score'), 2),
                            'quality' => round($reviews->avg('quality_score'), 2),
                            'attendance' => round($reviews->avg('attendance_score'), 2),
                            'teamwork' => round($reviews->avg('teamwork_score'), 2),
                            'customer_service' => round($reviews->avg('customer_service_score'), 2),
                            'overall' => round($reviews->avg('overall_score'), 2),
                        ],
                    ];
                });
            } elseif ($reportType === 'comparison') {
                // Comparison report: compare employees side by side
                $reportData = $employees->map(function ($employee) use ($startDate, $endDate) {
                    $reviews = $employee->performanceReviews()
                        ->whereBetween('review_date', [$startDate, $endDate])
                        ->get();

                    return [
                        'employee_id' => $employee->id,
                        'employee_name' => $employee->user->name,
                        'position' => $employee->position,
                        'average_scores' => [
                            'speed' => round($reviews->avg('speed_score'), 2),
                            'quality' => round($reviews->avg('quality_score'), 2),
                            'attendance' => round($reviews->avg('attendance_score'), 2),
                            'teamwork' => round($reviews->avg('teamwork_score'), 2),
                            'customer_service' => round($reviews->avg('customer_service_score'), 2),
                            'overall' => round($reviews->avg('overall_score'), 2),
                        ],
                        'total_reviews' => $reviews->count(),
                    ];
                })->sortByDesc('average_scores.overall')->values();
            }

            return $this->sendResponse([
                'report' => $reportData,
                'metadata' => [
                    'report_type' => $reportType,
                    'date_range' => [
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'format' => $format,
                    'generated_at' => now()->toISOString(),
                ],
            ], 'Performance report generated successfully');
        } catch (\Exception $e) {
            return $this->sendError('Error generating performance report', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get inventory analytics
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    /** @phpstan-ignore-next-line */
    public function getInventoryAnalytics(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'type' => 'nullable|in:ingredient,equipment,packaging',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', 422, $validator->errors()->toArray());
            }

            $startDate = $request->input('start_date') ?? Carbon::now()->subDays(30)->toDateString();
            $endDate = $request->input('end_date') ?? Carbon::now()->toDateString();
            $type = $request->input('type');

            $query = InventoryItem::with(['logs' => function ($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate]);
            }]);

            if ($type) {
                $query->where('type', $type);
            }

            $items = $query->get();

            $analytics = [
                'inventory_overview' => [
                    'total_items' => $items->count(),
                    'low_stock_items' => $items->filter(function ($item) {
                        return $item->quantity <= $item->reorder_level;
                    })->count(),
                    'out_of_stock_items' => $items->where('quantity', '<=', 0)->count(),
                    'total_value' => round($items->sum(function ($item) {
                        return $item->quantity * $item->cost_per_unit;
                    }), 2),
                ],
                'by_type' => $items->groupBy('type')->map(function ($group, $type) {
                    return [
                        'type' => $type,
                        'item_count' => $group->count(),
                        'total_quantity' => $group->sum('quantity'),
                        'total_value' => round($group->sum(function ($item) {
                            return $item->quantity * $item->cost_per_unit;
                        }), 2),
                        'low_stock_count' => $group->filter(function ($item) {
                            return $item->quantity <= $item->reorder_level;
                        })->count(),
                    ];
                })->values(),
                'inventory_movements' => $items->map(function ($item) use ($startDate, $endDate) {
                    $logs = $item->logs;

                    return [
                        'item_id' => $item->id,
                        'item_name' => $item->name,
                        'current_stock' => $item->quantity,
                        'reorder_level' => $item->reorder_level,
                        'total_additions' => $logs->where('type', 'addition')->sum('quantity'),
                        'total_deductions' => $logs->where('type', 'deduction')->sum('quantity'),
                        'total_adjustments' => $logs->where('type', 'adjustment')->sum('quantity'),
                        'movement_count' => $logs->count(),
                    ];
                }),
                'top_consumed_items' => $items->sortByDesc(function ($item) {
                    return $item->logs->where('type', 'deduction')->sum('quantity');
                })->take(10)->map(function ($item) {
                    return [
                        'item_id' => $item->id,
                        'item_name' => $item->name,
                        'type' => $item->type,
                        'total_consumed' => $item->logs->where('type', 'deduction')->sum('quantity'),
                        'current_stock' => $item->quantity,
                    ];
                })->values(),
                'date_range' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
            ];

            return $this->sendResponse($analytics, 'Inventory analytics retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Error retrieving inventory analytics', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Generate inventory forecast
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    /** @phpstan-ignore-next-line */
    public function generateInventoryForecast(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'item_id' => 'required|exists:inventory_items,id',
                'forecast_days' => 'nullable|integer|min:1|max:90',
                'method' => 'nullable|in:simple_average,weighted_average,linear_regression',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', 422, $validator->errors()->toArray());
            }

            $itemId = $request->input('item_id');
            $item = InventoryItem::with('logs')->findOrFail($itemId);
            $forecastDays = $request->input('forecast_days') ?? 30;
            $method = $request->get('method', 'simple_average');

            // Get historical consumption data (last 60 days)
            $historicalLogs = $item->logs()
                ->where('type', 'deduction')
                ->where('created_at', '>=', Carbon::now()->subDays(60))
                ->orderBy('created_at')
                ->get();

            // Calculate daily consumption
            $dailyConsumption = $historicalLogs->groupBy(function ($log) {
                return Carbon::parse($log->created_at)->toDateString();
            })->map(function ($logs) {
                return abs($logs->sum('quantity'));
            });

            $avgDailyConsumption = 0;

            if ($method === 'simple_average') {
                // Simple average of daily consumption
                $avgDailyConsumption = $dailyConsumption->avg();
            } elseif ($method === 'weighted_average') {
                // Weighted average (more recent days have higher weight)
                $weights = collect(range(1, $dailyConsumption->count()))->reverse()->values();
                $weightedSum = $dailyConsumption->values()->zip($weights)->sum(function ($pair) {
                    return $pair[0] * $pair[1];
                });
                $avgDailyConsumption = $weightedSum / $weights->sum();
            } elseif ($method === 'linear_regression') {
                // Simple linear regression for trend
                $values = $dailyConsumption->values();
                $n = $values->count();

                if ($n > 1) {
                    $xSum = $n * ($n + 1) / 2;
                    $ySum = $values->sum();
                    $xySum = $values->values()->map(function ($y, $x) {
                        return ($x + 1) * $y;
                    })->sum();
                    $x2Sum = $n * ($n + 1) * (2 * $n + 1) / 6;

                    $slope = ($n * $xySum - $xSum * $ySum) / ($n * $x2Sum - $xSum * $xSum);
                    $intercept = ($ySum - $slope * $xSum) / $n;

                    // Predict next day's consumption
                    $avgDailyConsumption = $slope * ($n + 1) + $intercept;
                } else {
                    $avgDailyConsumption = $dailyConsumption->avg();
                }
            }

            // Generate forecast
            $forecast = [];
            $currentStock = $item->quantity;

            for ($day = 1; $day <= $forecastDays; $day++) {
                $date = Carbon::now()->addDays($day)->toDateString();
                $predictedConsumption = round($avgDailyConsumption, 2);
                $predictedStock = max(0, $currentStock - ($predictedConsumption * $day));

                $forecast[] = [
                    'date' => $date,
                    'day_number' => $day,
                    'predicted_consumption' => $predictedConsumption,
                    'predicted_stock' => round($predictedStock, 2),
                    'needs_reorder' => $predictedStock <= $item->reorder_level,
                    'stockout_risk' => $predictedStock <= 0,
                ];
            }

            // Calculate reorder recommendations
            $stockoutDay = collect($forecast)->first(function ($day) {
                return $day['stockout_risk'];
            });

            $reorderDay = collect($forecast)->first(function ($day) {
                return $day['needs_reorder'];
            });

            $recommendations = [
                'current_stock' => $item->quantity,
                'reorder_level' => $item->reorder_level,
                'avg_daily_consumption' => round($avgDailyConsumption, 2),
                'days_until_reorder' => $reorderDay ? $reorderDay['day_number'] : null,
                'days_until_stockout' => $stockoutDay ? $stockoutDay['day_number'] : null,
                'recommended_order_quantity' => $stockoutDay
                    ? round($avgDailyConsumption * 30, 2) // Order 30 days worth
                    : round($avgDailyConsumption * 15, 2), // Order 15 days worth
            ];

            return $this->sendResponse([
                'item' => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'type' => $item->type,
                    'unit' => $item->unit,
                ],
                'forecast' => $forecast,
                'recommendations' => $recommendations,
                'metadata' => [
                    'forecast_method' => $method,
                    'forecast_days' => $forecastDays,
                    'historical_days' => 60,
                    'generated_at' => now()->toISOString(),
                ],
            ], 'Inventory forecast generated successfully');
        } catch (\Exception $e) {
            return $this->sendError('Error generating inventory forecast', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get customer segments
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCustomerSegments(Request $request)
    {
        try {
            $customers = User::role('customer')
                ->with(['orders' => function ($q) {
                    $q->where('status', 'completed');
                }])
                ->get();

            $segments = [
                'loyal' => [],
                'frequent' => [],
                'occasional' => [],
                'at_risk' => [],
                'dormant' => [],
                'new' => [],
            ];

            $now = Carbon::now();

            foreach ($customers as $customer) {
                $orders = $customer->orders;
                $orderCount = $orders->count();
                $totalSpent = $orders->sum('total_amount');
                $lastOrderDate = $orders->max('created_at');
                $daysSinceLastOrder = $lastOrderDate ? $now->diffInDays(Carbon::parse($lastOrderDate)) : null;
                $accountAge = $now->diffInDays(Carbon::parse($customer->created_at));

                $segmentData = [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'email' => $customer->email,
                    'total_orders' => $orderCount,
                    'total_spent' => round($totalSpent, 2),
                    'last_order_date' => $lastOrderDate,
                    'days_since_last_order' => $daysSinceLastOrder,
                    'account_age_days' => $accountAge,
                ];

                // Segmentation logic
                if ($accountAge <= 30) {
                    $segments['new'][] = $segmentData;
                } elseif ($daysSinceLastOrder === null || $daysSinceLastOrder > 90) {
                    $segments['dormant'][] = $segmentData;
                } elseif ($daysSinceLastOrder > 60) {
                    $segments['at_risk'][] = $segmentData;
                } elseif ($orderCount >= 20 && $totalSpent >= 5000) {
                    $segments['loyal'][] = $segmentData;
                } elseif ($orderCount >= 10) {
                    $segments['frequent'][] = $segmentData;
                } else {
                    $segments['occasional'][] = $segmentData;
                }
            }

            $summary = [
                'total_customers' => $customers->count(),
                'segment_counts' => [
                    'loyal' => count($segments['loyal']),
                    'frequent' => count($segments['frequent']),
                    'occasional' => count($segments['occasional']),
                    'at_risk' => count($segments['at_risk']),
                    'dormant' => count($segments['dormant']),
                    'new' => count($segments['new']),
                ],
                'segment_percentages' => [
                    'loyal' => round((count($segments['loyal']) / max($customers->count(), 1)) * 100, 2),
                    'frequent' => round((count($segments['frequent']) / max($customers->count(), 1)) * 100, 2),
                    'occasional' => round((count($segments['occasional']) / max($customers->count(), 1)) * 100, 2),
                    'at_risk' => round((count($segments['at_risk']) / max($customers->count(), 1)) * 100, 2),
                    'dormant' => round((count($segments['dormant']) / max($customers->count(), 1)) * 100, 2),
                    'new' => round((count($segments['new']) / max($customers->count(), 1)) * 100, 2),
                ],
            ];

            return $this->sendResponse([
                'segments' => $segments,
                'summary' => $summary,
            ], 'Customer segments retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Error retrieving customer segments', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Generate customer insights
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    /** @phpstan-ignore-next-line */
    public function generateCustomerInsights(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'segment' => 'nullable|in:loyal,frequent,occasional,at_risk,dormant,new,all',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', 422, $validator->errors()->toArray());
            }

            $segment = $request->input('segment') ?? 'all';
            $startDate = $request->input('start_date') ?? Carbon::now()->subDays(90)->toDateString();
            $endDate = $request->input('end_date') ?? Carbon::now()->toDateString();

            $customers = User::role('customer')
                ->with(['orders' => function ($q) use ($startDate, $endDate) {
                    $q->where('status', 'completed')
                        ->whereBetween('created_at', [$startDate, $endDate]);
                }])
                ->get();

            // Calculate insights
            $insights = [
                'overview' => [
                    'total_customers' => $customers->count(),
                    'total_orders' => $customers->sum(fn($c) => $c->orders->count()),
                    'total_revenue' => round($customers->sum(fn($c) => $c->orders->sum('total_amount')), 2),
                    'avg_order_value' => 0,
                    'avg_orders_per_customer' => 0,
                ],
                'purchasing_patterns' => [
                    'order_frequency' => [],
                    'preferred_order_types' => [],
                    'peak_ordering_days' => [],
                    'peak_ordering_hours' => [],
                ],
                'customer_behavior' => [
                    'retention_rate' => 0,
                    'repeat_purchase_rate' => 0,
                    'avg_customer_lifetime_value' => 0,
                    'churn_risk_customers' => 0,
                ],
                'recommendations' => [],
            ];

            $totalOrders = $insights['overview']['total_orders'];
            $totalRevenue = $insights['overview']['total_revenue'];

            if ($totalOrders > 0) {
                $insights['overview']['avg_order_value'] = round($totalRevenue / $totalOrders, 2);
            }

            if ($customers->count() > 0) {
                $insights['overview']['avg_orders_per_customer'] = round($totalOrders / $customers->count(), 2);
            }

            // Analyze order frequency
            $orderFrequencies = $customers->map(function ($customer) {
                $count = $customer->orders->count();
                if ($count === 0) return 'none';
                if ($count === 1) return 'one_time';
                if ($count <= 5) return 'occasional';
                if ($count <= 15) return 'regular';
                return 'frequent';
            })->countBy();

            $insights['purchasing_patterns']['order_frequency'] = $orderFrequencies->toArray();

            // Analyze preferred order types
            $allOrders = $customers->flatMap(fn($c) => $c->orders);
            $insights['purchasing_patterns']['preferred_order_types'] = $allOrders
                ->countBy('order_type')
                ->map(function ($count, $type) use ($totalOrders) {
                    return [
                        'type' => $type,
                        'count' => $count,
                        'percentage' => round(($count / max($totalOrders, 1)) * 100, 2),
                    ];
                })->values()->toArray();

            // Analyze peak ordering days
            $insights['purchasing_patterns']['peak_ordering_days'] = $allOrders
                ->groupBy(fn($order) => Carbon::parse($order->created_at)->format('l'))
                ->map(fn($orders) => $orders->count())
                ->sortDesc()
                ->take(3)
                ->toArray();

            // Analyze peak ordering hours
            $insights['purchasing_patterns']['peak_ordering_hours'] = $allOrders
                ->groupBy(fn($order) => Carbon::parse($order->created_at)->format('H:00'))
                ->map(fn($orders) => $orders->count())
                ->sortDesc()
                ->take(5)
                ->toArray();

            // Calculate retention rate (customers who made repeat purchases)
            $repeatCustomers = $customers->filter(fn($c) => $c->orders->count() > 1)->count();
            $insights['customer_behavior']['repeat_purchase_rate'] = $customers->count() > 0
                ? round(($repeatCustomers / $customers->count()) * 100, 2)
                : 0;

            // Calculate average CLV
            $insights['customer_behavior']['avg_customer_lifetime_value'] = $customers->count() > 0
                ? round($totalRevenue / $customers->count(), 2)
                : 0;

            // Identify churn risk (customers with no orders in last 60 days)
            $insights['customer_behavior']['churn_risk_customers'] = $customers->filter(function ($customer) {
                $lastOrder = $customer->orders->max('created_at');
                return $lastOrder && Carbon::parse($lastOrder)->diffInDays(Carbon::now()) > 60;
            })->count();

            // Generate recommendations
            if ($insights['customer_behavior']['churn_risk_customers'] > 0) {
                $insights['recommendations'][] = "Launch re-engagement campaign for {$insights['customer_behavior']['churn_risk_customers']} at-risk customers";
            }

            if ($insights['customer_behavior']['repeat_purchase_rate'] < 30) {
                $insights['recommendations'][] = "Implement loyalty program to increase repeat purchase rate (currently {$insights['customer_behavior']['repeat_purchase_rate']}%)";
            }

            $topDay = array_key_first($insights['purchasing_patterns']['peak_ordering_days'] ?? []);
            if ($topDay) {
                $insights['recommendations'][] = "Run promotions on {$topDay} to capitalize on peak ordering day";
            }

            $insights['metadata'] = [
                'date_range' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'segment_filter' => $segment,
                'generated_at' => now()->toISOString(),
            ];

            return $this->sendResponse($insights, 'Customer insights generated successfully');
        } catch (\Exception $e) {
            return $this->sendError('Error generating customer insights', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get real-time analytics dashboard
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRealTimeAnalytics()
    {
        try {
            $now = now();
            $today = $now->toDateString();
            $currentHour = $now->hour;

            // Real-time metrics
            $metrics = [
                'current_hour' => [
                    'orders' => Order::whereDate('created_at', $today)
                        ->whereRaw('HOUR(created_at) = ?', [$currentHour])
                        ->count(),
                    'revenue' => Order::whereDate('created_at', $today)
                        ->whereRaw('HOUR(created_at) = ?', [$currentHour])
                        ->where('payment_status', 'paid')
                        ->sum('total_amount'),
                    'customers' => Order::whereDate('created_at', $today)
                        ->whereRaw('HOUR(created_at) = ?', [$currentHour])
                        ->distinct('user_id')
                        ->count(),
                ],
                'last_24_hours' => [
                    'orders' => Order::where('created_at', '>=', $now->copy()->subDay())->count(),
                    'revenue' => Order::where('created_at', '>=', $now->copy()->subDay())
                        ->where('payment_status', 'paid')
                        ->sum('total_amount'),
                    'customers' => Order::where('created_at', '>=', $now->copy()->subDay())
                        ->distinct('user_id')
                        ->count(),
                ],
                'active_users' => [
                    'online_now' => 0, // Would need session tracking
                    'browsing_products' => 0, // Would need real-time tracking
                ],
                'system_health' => [
                    'response_time' => 0, // Would need monitoring
                    'error_rate' => 0, // Would need error tracking
                    'uptime_percentage' => 100, // Would need uptime monitoring
                ],
            ];

            // Live alerts
            $alerts = $this->generateLiveAlerts();

            // Performance indicators
            $performance = [
                'conversion_rate' => $this->calculateConversionRate(),
                'average_order_value' => $this->calculateAverageOrderValue(),
                'customer_satisfaction' => 0, // Would need feedback system
            ];

            return $this->sendResponse([
                'real_time_metrics' => $metrics,
                'live_alerts' => $alerts,
                'performance_indicators' => $performance,
                'last_updated' => $now->toISOString(),
            ], 'Real-time analytics retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Error retrieving real-time analytics', 500, ['error' => $e->getMessage()]);
        }
    }

    // Helper methods for analytics

    private function generateLiveAlerts()
    {
        $alerts = [];

        // Low stock alerts
        $lowStockCount = DB::table('inventory_items')
            ->whereRaw('quantity <= reorder_level')
            ->count();

        if ($lowStockCount > 0) {
            $alerts[] = [
                'type' => 'warning',
                'message' => "{$lowStockCount} items are low on stock",
                'priority' => 'medium',
                'timestamp' => now()->toISOString(),
            ];
        }

        // Overdue orders
        $overdueOrders = Order::where('status', 'preparing')
            ->where('created_at', '<', now()->subHours(2))
            ->count();

        if ($overdueOrders > 0) {
            $alerts[] = [
                'type' => 'error',
                'message' => "{$overdueOrders} orders are overdue for preparation",
                'priority' => 'high',
                'timestamp' => now()->toISOString(),
            ];
        }

        // High traffic alert (if orders in last hour > average)
        $recentOrders = Order::where('created_at', '>=', now()->subHour())->count();
        if ($recentOrders > 20) { // Arbitrary threshold
            $alerts[] = [
                'type' => 'info',
                'message' => "High order volume: {$recentOrders} orders in the last hour",
                'priority' => 'low',
                'timestamp' => now()->toISOString(),
            ];
        }

        return $alerts;
    }

    private function calculateConversionRate()
    {
        // Simple conversion rate calculation
        // This would need proper tracking of visitors vs customers
        $totalOrders = Order::where('created_at', '>=', now()->subDays(30))->count();
        $estimatedVisitors = max($totalOrders * 10, 1000); // Rough estimate

        return round(($totalOrders / $estimatedVisitors) * 100, 2);
    }

    private function calculateAverageOrderValue()
    {
        return round(Order::where('created_at', '>=', now()->subDays(30))
            ->where('payment_status', 'paid')
            ->avg('total_amount'), 2);
    }

    private function getHistoricalData($metric, $days)
    {
        $data = [];

        for ($i = $days; $i >= 1; $i--) {
            $date = now()->subDays($i);
            $value = 0;

            switch ($metric) {
                case 'sales':
                    $value = Order::whereDate('created_at', $date)
                        ->where('payment_status', 'paid')
                        ->sum('total_amount');
                    break;
                case 'customers':
                    $value = Order::whereDate('created_at', $date)
                        ->distinct('user_id')
                        ->count();
                    break;
                case 'orders':
                    $value = Order::whereDate('created_at', $date)->count();
                    break;
            }

            $data[] = $value;
        }

        return $data;
    }

    private function calculateTrendSlope($data)
    {
        $n = count($data);
        if ($n < 2) return 0;

        $sumX = $sumY = $sumXY = $sumXX = 0;

        foreach ($data as $i => $y) {
            $x = $i + 1;
            $sumX += $x;
            $sumY += $y;
            $sumXY += $x * $y;
            $sumXX += $x * $x;
        }

        $slope = ($n * $sumXY - $sumX * $sumY) / ($n * $sumXX - $sumX * $sumX);
        return $slope;
    }
}
