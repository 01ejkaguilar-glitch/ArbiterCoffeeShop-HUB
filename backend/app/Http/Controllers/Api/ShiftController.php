<?php

namespace App\Http\Controllers\Api;

use App\Models\Shift;
use App\Models\Employee;
use App\Events\ShiftStarted;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ShiftController extends BaseController
{
    /**
     * Get shifts
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = Shift::with(['employee.user']);

            // Filter by employee
            if ($request->has('employee_id')) {
                $query->where('employee_id', $request->input('employee_id'));
            }

            // Filter by date range
            if ($request->has('start_date')) {
                $query->whereDate('date', '>=', $request->input('start_date'));
            }
            if ($request->has('end_date')) {
                $query->whereDate('date', '<=', $request->input('end_date'));
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            $shifts = $query->orderBy('date', 'asc')->orderBy('start_time', 'asc')->paginate(50);

            return $this->sendResponse($shifts, 'Shifts retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve shifts', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get single shift
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $shift = Shift::with(['employee.user'])->findOrFail($id);

            return $this->sendResponse($shift, 'Shift retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Shift not found', 404, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Create new shift
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'date' => 'required|date',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i|after:start_time',
                'position' => 'nullable|string|max:100',
                'notes' => 'nullable|string|max:500',
            ]);

            // Check for overlapping shifts
            $startDateTime = Carbon::parse($request->input('date') . ' ' . $request->input('start_time'));
            $endDateTime = Carbon::parse($request->input('date') . ' ' . $request->input('end_time'));

            $overlap = Shift::where('employee_id', $request->input('employee_id'))
                ->where('date', $request->input('date'))
                ->where('status', '!=', 'cancelled')
                ->where(function($query) use ($startDateTime, $endDateTime) {
                    $query->whereBetween('start_time', [$startDateTime, $endDateTime])
                        ->orWhereBetween('end_time', [$startDateTime, $endDateTime])
                        ->orWhere(function($q) use ($startDateTime, $endDateTime) {
                            $q->where('start_time', '<=', $startDateTime)
                              ->where('end_time', '>=', $endDateTime);
                        });
                })
                ->exists();

            if ($overlap) {
                return $this->sendError('Shift overlaps with existing shift for this employee', 400);
            }

            $shift = Shift::create([
                'employee_id' => $request->input('employee_id'),
                'date' => $request->input('date'),
                'start_time' => $startDateTime,
                'end_time' => $endDateTime,
                'position' => $request->input('position'),
                'notes' => $request->input('notes'),
            ]);

            $shift->load('employee.user');

            return $this->sendResponse($shift, 'Shift created successfully', 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to create shift', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update shift
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'start_time' => 'date_format:H:i',
                'end_time' => 'date_format:H:i|after:start_time',
                'position' => 'nullable|string|max:100',
                'status' => 'in:scheduled,confirmed,completed,cancelled',
                'notes' => 'nullable|string|max:500',
            ]);

            $shift = Shift::findOrFail($id);

            if ($request->has('start_time') || $request->has('end_time')) {
                $startTime = $request->input('start_time') ?? $shift->start_time->format('H:i');
                $endTime = $request->input('end_time') ?? $shift->end_time->format('H:i');

                $shift->start_time = Carbon::parse($shift->date . ' ' . $startTime);
                $shift->end_time = Carbon::parse($shift->date . ' ' . $endTime);
            }

            $shift->update($request->only(['position', 'status', 'notes']));

            // Broadcast ShiftStarted event when status changes to 'confirmed'
            if ($request->has('status') && $request->input('status') === 'confirmed') {
                event(new ShiftStarted($shift));
            }

            $shift->load('employee.user');

            return $this->sendResponse($shift, 'Shift updated successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to update shift', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Delete shift
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $shift = Shift::findOrFail($id);
            $shift->delete();

            return $this->sendResponse(null, 'Shift deleted successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to delete shift', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get weekly schedule
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getWeeklySchedule(Request $request)
    {
        try {
            $request->validate([
                'week_start' => 'required|date',
            ]);

            $startDate = Carbon::parse($request->input('week_start'))->startOfWeek();
            $endDate = $startDate->copy()->endOfWeek();

            $shifts = Shift::with(['employee.user'])
                ->whereBetween('date', [$startDate, $endDate])
                ->where('status', '!=', 'cancelled')
                ->orderBy('date', 'asc')
                ->orderBy('start_time', 'asc')
                ->get();

            // Group by date
            $schedule = $shifts->groupBy(function($shift) {
                return $shift->date;
            });

            return $this->sendResponse($schedule, 'Weekly schedule retrieved successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve weekly schedule', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get employee upcoming shifts
     *
     * @param int $employeeId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEmployeeShifts($employeeId)
    {
        try {
            $shifts = Shift::where('employee_id', $employeeId)
                ->where('date', '>=', now())
                ->where('status', '!=', 'cancelled')
                ->orderBy('date', 'asc')
                ->orderBy('start_time', 'asc')
                ->get();

            return $this->sendResponse($shifts, 'Employee shifts retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve employee shifts', 500, ['error' => $e->getMessage()]);
        }
    }
}
