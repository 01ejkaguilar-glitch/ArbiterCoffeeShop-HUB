<?php

namespace App\Http\Controllers\Api;

use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\Task;
use App\Models\CoffeeBean;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends BaseController
{
    /**
     * Get Attendance Report
     */
    public function getAttendanceReport(Request $request)
    {
        try {
            $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'employee_id' => 'nullable|exists:employees,id'
            ]);

            $query = Attendance::with(['employee.user']);

            // Date range filter
            if ($request->has('start_date')) {
                $query->whereDate('date', '>=', $request->input('start_date'));
            }
            if ($request->has('end_date')) {
                $query->whereDate('date', '<=', $request->input('end_date'));
            }

            // Employee filter
            if ($request->has('employee_id')) {
                $query->where('employee_id', $request->input('employee_id'));
            }

            $attendances = $query->orderBy('date', 'desc')->get();

            // Calculate statistics
            $stats = [
                'total_records' => $attendances->count(),
                'present_count' => $attendances->where('status', 'present')->count(),
                'absent_count' => $attendances->where('status', 'absent')->count(),
                'late_count' => $attendances->where('status', 'late')->count(),
                'attendance_rate' => $attendances->count() > 0 
                    ? round(($attendances->where('status', 'present')->count() / $attendances->count()) * 100, 2)
                    : 0
            ];

            return $this->sendResponse([
                'attendances' => $attendances,
                'stats' => $stats
            ], 'Attendance report retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve attendance report', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get Leave and Overtime Report
     */
    public function getLeaveOTReport(Request $request)
    {
        try {
            $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'employee_id' => 'nullable|exists:employees,id',
                'type' => 'nullable|in:leave,overtime,both'
            ]);

            $type = $request->get('type', 'both');

            $leaveRequests = [];
            $overtimeRecords = [];

            if (in_array($type, ['leave', 'both'])) {
                $leaveQuery = LeaveRequest::with(['employee.user']);

                if ($request->has('start_date')) {
                    $leaveQuery->whereDate('start_date', '>=', $request->input('start_date'));
                }
                if ($request->has('end_date')) {
                    $leaveQuery->whereDate('end_date', '<=', $request->input('end_date'));
                }
                if ($request->has('employee_id')) {
                    $leaveQuery->where('employee_id', $request->input('employee_id'));
                }

                $leaveRequests = $leaveQuery->orderBy('start_date', 'desc')->get();
            }

            // Overtime data from attendance records (calculate overtime as hours > 8)
            if (in_array($type, ['overtime', 'both'])) {
                $overtimeQuery = Attendance::with(['employee.user'])
                    ->whereNotNull('clock_in')
                    ->whereNotNull('clock_out');

                if ($request->has('start_date')) {
                    $overtimeQuery->whereDate('date', '>=', $request->input('start_date'));
                }
                if ($request->has('end_date')) {
                    $overtimeQuery->whereDate('date', '<=', $request->input('end_date'));
                }
                if ($request->has('employee_id')) {
                    $overtimeQuery->where('employee_id', $request->input('employee_id'));
                }

                $attendanceRecords = $overtimeQuery->orderBy('date', 'desc')->get();

                // Filter records with overtime (hours worked > 8)
                $overtimeRecords = $attendanceRecords->filter(function ($attendance) {
                    return $attendance->hours_worked > 8;
                })->map(function ($attendance) {
                    // Add overtime_hours to the attendance object
                    $attendance->overtime_hours = $attendance->hours_worked - 8;
                    return $attendance;
                });
            }

            // Calculate statistics
            $stats = [
                'total_leave_requests' => count($leaveRequests),
                'approved_leaves' => collect($leaveRequests)->where('status', 'approved')->count(),
                'pending_leaves' => collect($leaveRequests)->where('status', 'pending')->count(),
                'rejected_leaves' => collect($leaveRequests)->where('status', 'rejected')->count(),
                'total_overtime_hours' => collect($overtimeRecords)->sum('overtime_hours'),
                'total_overtime_records' => count($overtimeRecords)
            ];

            return $this->sendResponse([
                'leave_requests' => $leaveRequests,
                'overtime_records' => $overtimeRecords,
                'stats' => $stats
            ], 'Leave and OT report retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve leave/OT report', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get Task Completion Report
     */
    public function getTaskCompletionReport(Request $request)
    {
        try {
            $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'assigned_to' => 'nullable|exists:employees,id',
                'status' => 'nullable|in:pending,in_progress,completed,cancelled'
            ]);

            $query = Task::with(['assignedTo.user', 'assignedBy.user']);

            // Date range filter
            if ($request->has('start_date')) {
                $query->whereDate('due_date', '>=', $request->input('start_date'));
            }
            if ($request->has('end_date')) {
                $query->whereDate('due_date', '<=', $request->input('end_date'));
            }

            // Employee filter
            if ($request->has('assigned_to')) {
                $query->where('assigned_to', $request->input('assigned_to'));
            }

            // Status filter
            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            $tasks = $query->orderBy('due_date', 'desc')->get();

            // Calculate statistics
            $stats = [
                'total_tasks' => $tasks->count(),
                'completed_tasks' => $tasks->where('status', 'completed')->count(),
                'in_progress_tasks' => $tasks->where('status', 'in_progress')->count(),
                'pending_tasks' => $tasks->where('status', 'pending')->count(),
                'overdue_tasks' => $tasks->where('status', '!=', 'completed')
                    ->where('due_date', '<', now())->count(),
                'completion_rate' => $tasks->count() > 0 
                    ? round(($tasks->where('status', 'completed')->count() / $tasks->count()) * 100, 2)
                    : 0,
                'on_time_completion' => $tasks->where('status', 'completed')
                    ->filter(function($task) {
                        return $task->completed_at && $task->completed_at <= $task->due_date;
                    })->count()
            ];

            return $this->sendResponse([
                'tasks' => $tasks,
                'stats' => $stats
            ], 'Task completion report retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve task completion report', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get Bean Usage Report
     */
    public function getBeanUsageReport(Request $request)
    {
        try {
            $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'bean_id' => 'nullable|exists:coffee_beans,id'
            ]);

            $startDate = $request->get('start_date', now()->subMonth()->toDateString());
            $endDate = $request->get('end_date', now()->toDateString());

            // Get all coffee beans with featured origin counts
            $beansQuery = CoffeeBean::withCount([
                'dailyFeaturedOrigins as featured_count' => function($query) use ($startDate, $endDate) {
                    $query->whereBetween('feature_date', [$startDate, $endDate]);
                }
            ]);

            if ($request->has('bean_id')) {
                $beansQuery->where('id', $request->input('bean_id'));
            }

            $beans = $beansQuery->get();

            // Calculate stock changes and usage
            $beanUsage = $beans->map(function($bean) use ($startDate, $endDate) {
                // Get featured days
                $featuredDays = $bean->dailyFeaturedOrigins()
                    ->whereBetween('feature_date', [$startDate, $endDate])
                    ->get();

                return [
                    'id' => $bean->id,
                    'name' => $bean->name,
                    'origin_country' => $bean->origin_country,
                    'region' => $bean->region,
                    'current_stock' => $bean->stock_quantity,
                    'times_featured' => $featuredDays->count(),
                    'featured_dates' => $featuredDays->pluck('feature_date'),
                    'is_featured' => $bean->is_featured,
                    'image_url' => $bean->image_url
                ];
            });

            // Calculate statistics
            $stats = [
                'total_beans' => $beans->count(),
                'low_stock_beans' => $beans->where('stock_quantity', '<', 10)->count(),
                'out_of_stock_beans' => $beans->where('stock_quantity', 0)->count(),
                'total_featured_times' => $beans->sum('featured_count'),
                'most_featured_bean' => $beanUsage->sortByDesc('times_featured')->first()
            ];

            return $this->sendResponse([
                'bean_usage' => $beanUsage,
                'stats' => $stats
            ], 'Bean usage report retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve bean usage report', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Export report to CSV
     */
    public function exportReport(Request $request)
    {
        try {
            $request->validate([
                'report_type' => 'required|in:attendance,leave_ot,task_completion,bean_usage',
                'format' => 'required|in:csv,pdf'
            ]);

            $reportType = $request->input('report_type');
            $format = $request->input('format');

            // Get the report data
            $reportData = $this->getReportData($reportType, $request);

            if ($format === 'csv') {
                return $this->exportToCSV($reportData, $reportType);
            } else {
                return $this->sendError('PDF export not yet implemented', 501);
            }

        } catch (\Exception $e) {
            return $this->sendError('Failed to export report', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Helper: Get report data based on type
     */
    private function getReportData($reportType, $request)
    {
        switch ($reportType) {
            case 'attendance':
                return $this->getAttendanceReport($request)->getData()->data;
            case 'leave_ot':
                return $this->getLeaveOTReport($request)->getData()->data;
            case 'task_completion':
                return $this->getTaskCompletionReport($request)->getData()->data;
            case 'bean_usage':
                return $this->getBeanUsageReport($request)->getData()->data;
            default:
                throw new \Exception('Invalid report type');
        }
    }

    /**
     * Helper: Export data to CSV
     */
    private function exportToCSV($data, $reportType)
    {
        $filename = $reportType . '_report_' . now()->format('Y-m-d_His') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($data, $reportType) {
            $file = fopen('php://output', 'w');
            
            // Add CSV headers based on report type
            $this->addCSVHeaders($file, $reportType);
            
            // Add data rows
            $this->addCSVData($file, $data, $reportType);
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Helper: Add CSV headers
     */
    private function addCSVHeaders($file, $reportType)
    {
        switch ($reportType) {
            case 'attendance':
                fputcsv($file, ['Date', 'Employee', 'Status', 'Check In', 'Check Out', 'Hours Worked', 'Overtime Hours']);
                break;
            case 'leave_ot':
                fputcsv($file, ['Type', 'Employee', 'Start Date', 'End Date', 'Days/Hours', 'Status', 'Reason']);
                break;
            case 'task_completion':
                fputcsv($file, ['Task Title', 'Assigned To', 'Status', 'Due Date', 'Completed At', 'Priority']);
                break;
            case 'bean_usage':
                fputcsv($file, ['Bean Name', 'Origin', 'Region', 'Current Stock', 'Times Featured', 'Status']);
                break;
        }
    }

    /**
     * Helper: Add CSV data rows
     */
    private function addCSVData($file, $data, $reportType)
    {
        switch ($reportType) {
            case 'attendance':
                foreach ($data->attendances as $record) {
                    fputcsv($file, [
                        $record->date,
                        $record->employee->user->name ?? 'N/A',
                        $record->status,
                        $record->check_in_time ?? 'N/A',
                        $record->check_out_time ?? 'N/A',
                        $record->hours_worked ?? 0,
                        $record->overtime_hours ?? 0
                    ]);
                }
                break;
            case 'leave_ot':
                foreach ($data->leave_requests as $leave) {
                    fputcsv($file, [
                        'Leave',
                        $leave->employee->user->name ?? 'N/A',
                        $leave->start_date,
                        $leave->end_date,
                        $leave->days_count ?? 0,
                        $leave->status,
                        $leave->reason ?? ''
                    ]);
                }
                foreach ($data->overtime_records as $ot) {
                    fputcsv($file, [
                        'Overtime',
                        $ot->employee->user->name ?? 'N/A',
                        $ot->date,
                        $ot->date,
                        $ot->overtime_hours,
                        'Completed',
                        'Overtime'
                    ]);
                }
                break;
            case 'task_completion':
                foreach ($data->tasks as $task) {
                    fputcsv($file, [
                        $task->title,
                        $task->assignedTo->user->name ?? 'N/A',
                        $task->status,
                        $task->due_date,
                        $task->completed_at ?? 'N/A',
                        $task->priority ?? 'normal'
                    ]);
                }
                break;
            case 'bean_usage':
                foreach ($data->bean_usage as $usage) {
                    fputcsv($file, [
                        $usage['name'],
                        $usage['origin_country'],
                        $usage['region'],
                        $usage['current_stock'],
                        $usage['times_featured'],
                        $usage['is_featured'] ? 'Featured' : 'Regular'
                    ]);
                }
                break;
        }
    }
}
