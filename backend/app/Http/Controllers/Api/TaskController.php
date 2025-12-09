<?php

namespace App\Http\Controllers\Api;

use App\Models\Task;
use App\Models\Employee;
use App\Events\TaskAssigned;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends BaseController
{
    /**
     * Get tasks
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = Task::with(['assignedTo.user', 'assignedBy']);

            // Filter by assigned employee
            if ($request->has('assigned_to')) {
                $query->where('assigned_to', $request->input('assigned_to'));
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            // Filter by priority
            if ($request->has('priority')) {
                $query->where('priority', $request->input('priority'));
            }

            $tasks = $query->orderBy('due_date', 'asc')->paginate(50);

            return $this->sendResponse($tasks, 'Tasks retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve tasks', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get single task
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $task = Task::with(['assignedTo.user', 'assignedBy'])->findOrFail($id);

            return $this->sendResponse($task, 'Task retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Task not found', 404, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Create new task
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'assigned_to' => 'nullable|exists:employees,id',
                'priority' => 'required|in:low,medium,high,urgent',
                'due_date' => 'nullable|date',
            ]);

            $task = Task::create([
                'title' => $request->input('title'),
                'description' => $request->input('description'),
                'assigned_to' => $request->input('assigned_to'),
                'assigned_by' => Auth::id(),
                'priority' => $request->input('priority'),
                'due_date' => $request->input('due_date'),
            ]);

            $task->load(['assignedTo.user', 'assignedBy']);

            // Broadcast TaskAssigned event if task is assigned to an employee
            if ($task->assigned_to) {
                event(new TaskAssigned($task));
            }

            return $this->sendResponse($task, 'Task created successfully', 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to create task', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update task
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'title' => 'string|max:255',
                'description' => 'nullable|string',
                'assigned_to' => 'nullable|exists:employees,id',
                'priority' => 'in:low,medium,high,urgent',
                'status' => 'in:pending,in_progress,completed,cancelled',
                'due_date' => 'nullable|date',
            ]);

            $task = Task::findOrFail($id);

            // Track if assigned_to is being changed
            $previousAssignee = $task->assigned_to;

            // If marking as completed, set completed_at
            if ($request->input('status') === 'completed' && $task->status !== 'completed') {
                $task->completed_at = now();
            }

            $task->update($request->only([
                'title',
                'description',
                'assigned_to',
                'priority',
                'status',
                'due_date',
            ]));

            $task->load(['assignedTo.user', 'assignedBy']);

            // Broadcast TaskAssigned event if task is reassigned to a different employee
            if ($request->has('assigned_to') && $request->input('assigned_to') !== $previousAssignee && $request->input('assigned_to') !== null) {
                event(new TaskAssigned($task));
            }

            return $this->sendResponse($task, 'Task updated successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to update task', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Delete task
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $task = Task::findOrFail($id);
            $task->delete();

            return $this->sendResponse(null, 'Task deleted successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to delete task', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get my tasks (for logged in employee)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMyTasks()
    {
        try {
            $user = Auth::user();
            $employee = Employee::where('user_id', $user->id)->first();

            if (!$employee) {
                return $this->sendError('Employee record not found', 404);
            }

            $tasks = Task::with(['assignedBy'])
                ->where('assigned_to', $employee->id)
                ->whereIn('status', ['pending', 'in_progress'])
                ->orderBy('due_date', 'asc')
                ->get();

            return $this->sendResponse($tasks, 'My tasks retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve tasks', 500, ['error' => $e->getMessage()]);
        }
    }
}
