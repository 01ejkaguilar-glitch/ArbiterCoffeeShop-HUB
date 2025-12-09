<?php

namespace App\Http\Controllers\Api;

use App\Models\LeaveRequest;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class LeaveRequestController extends BaseController
{
    /**
     * Submit a leave request
     * POST /api/v1/workforce/leave-requests
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'type' => 'required|in:sick,vacation,personal,emergency,bereavement',
                'start_date' => 'required|date|after_or_equal:today',
                'end_date' => 'required|date|after_or_equal:start_date',
                'reason' => 'required|string|max:1000',
            ]);

            $user = Auth::user();

            // Check if the employee belongs to the authenticated user (for employees)
            $employee = Employee::findOrFail($validated['employee_id']);

            if (!$user->hasAnyRole(['manager', 'workforce-manager', 'admin', 'super-admin'])) {
                if ($employee->user_id !== $user->id) {
                    return $this->sendError('Unauthorized', 403);
                }
            }

            // Calculate days requested
            $startDate = Carbon::parse($validated['start_date']);
            $endDate = Carbon::parse($validated['end_date']);
            $daysRequested = $startDate->diffInDays($endDate) + 1;

            // Check for overlapping leave requests
            $overlapping = LeaveRequest::where('employee_id', $validated['employee_id'])
                ->where('status', '!=', 'rejected')
                ->where(function($query) use ($startDate, $endDate) {
                    $query->whereBetween('start_date', [$startDate, $endDate])
                        ->orWhereBetween('end_date', [$startDate, $endDate])
                        ->orWhere(function($q) use ($startDate, $endDate) {
                            $q->where('start_date', '<=', $startDate)
                              ->where('end_date', '>=', $endDate);
                        });
                })
                ->exists();

            if ($overlapping) {
                return $this->sendError('Leave request overlaps with existing request', 422);
            }

            $leaveRequest = LeaveRequest::create([
                'employee_id' => $validated['employee_id'],
                'type' => $validated['type'],
                'start_date' => $startDate,
                'end_date' => $endDate,
                'days_requested' => $daysRequested,
                'reason' => $validated['reason'],
                'status' => 'pending',
            ]);

            $leaveRequest->load(['employee.user', 'reviewer']);

            return $this->sendResponse($leaveRequest, 'Leave request submitted successfully', 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to submit leave request', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * List leave requests
     * GET /api/v1/workforce/leave-requests
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $query = LeaveRequest::with(['employee.user', 'reviewer']);

            // Managers can see all leave requests
            // Employees can only see their own
            if (!$user->hasAnyRole(['manager', 'workforce-manager', 'admin', 'super-admin'])) {
                $employee = Employee::where('user_id', $user->id)->first();
                if (!$employee) {
                    return $this->sendError('Employee profile not found', 404);
                }
                $query->where('employee_id', $employee->id);
            }

            // Filter by status
            $status = $request->input('status');
            if ($status !== null) {
                $query->where('status', $status);
            }

            // Filter by employee
            $employeeId = $request->input('employee_id');
            if ($employeeId !== null) {
                $query->where('employee_id', $employeeId);
            }

            // Filter by type
            $type = $request->input('type');
            if ($type !== null) {
                $query->where('type', $type);
            }

            // Filter by date range
            $startDate = $request->input('start_date');
            if ($startDate !== null) {
                $query->where('start_date', '>=', $startDate);
            }
            $endDate = $request->input('end_date');
            if ($endDate !== null) {
                $query->where('end_date', '<=', $endDate);
            }

            $leaveRequests = $query->orderBy('created_at', 'desc')
                ->paginate($request->input('per_page') ?? 15);

            return $this->sendResponse($leaveRequests, 'Leave requests retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve leave requests', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get a specific leave request
     * GET /api/v1/workforce/leave-requests/{id}
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            $leaveRequest = LeaveRequest::with(['employee.user', 'reviewer'])->findOrFail($id);

            // Check authorization
            if (!$user->hasAnyRole(['manager', 'workforce-manager', 'admin', 'super-admin'])) {
                if ($leaveRequest->employee->user_id !== $user->id) {
                    return $this->sendError('Unauthorized', 403);
                }
            }

            return $this->sendResponse($leaveRequest, 'Leave request retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve leave request', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Approve or reject a leave request
     * PUT /api/v1/workforce/leave-requests/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:approved,rejected',
                'review_notes' => 'nullable|string|max:1000',
            ]);

            $user = Auth::user();

            // Only managers can approve/reject leave requests
            if (!$user->hasAnyRole(['manager', 'workforce-manager', 'admin', 'super-admin'])) {
                return $this->sendError('Unauthorized', 403);
            }

            $leaveRequest = LeaveRequest::findOrFail($id);

            if ($leaveRequest->status !== 'pending') {
                return $this->sendError('Leave request has already been reviewed', 422);
            }

            $leaveRequest->update([
                'status' => $validated['status'],
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
                'review_notes' => $validated['review_notes'] ?? null,
            ]);

            $leaveRequest->load(['employee.user', 'reviewer']);

            return $this->sendResponse($leaveRequest, 'Leave request updated successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to update leave request', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Delete a leave request (only pending requests)
     * DELETE /api/v1/workforce/leave-requests/{id}
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            $leaveRequest = LeaveRequest::findOrFail($id);

            // Check authorization
            if (!$user->hasAnyRole(['manager', 'workforce-manager', 'admin', 'super-admin'])) {
                if ($leaveRequest->employee->user_id !== $user->id) {
                    return $this->sendError('Unauthorized', 403);
                }
            }

            if ($leaveRequest->status !== 'pending') {
                return $this->sendError('Only pending leave requests can be deleted', 422);
            }

            $leaveRequest->delete();

            return $this->sendResponse(null, 'Leave request deleted successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to delete leave request', 500, ['error' => $e->getMessage()]);
        }
    }
}
