<?php

namespace App\Http\Controllers\Api;

use App\Models\PerformanceReview;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class PerformanceReviewController extends BaseController
{
    /**
     * Get employee performance data
     * GET /api/v1/workforce/performance/{employee_id}
     */
    public function show($employeeId)
    {
        try {
            $user = Auth::user();
            $employee = Employee::with('user')->findOrFail($employeeId);

            // Check authorization
            if (!$user->hasAnyRole(['manager', 'workforce-manager', 'admin', 'super-admin'])) {
                if ($employee->user_id !== $user->id) {
                    return $this->sendError('Unauthorized', 403);
                }
            }

            // Get all performance reviews for this employee
            $reviews = PerformanceReview::where('employee_id', $employeeId)
                ->with('reviewer')
                ->orderBy('review_period_end', 'desc')
                ->get();

            // Calculate average scores
            $averageScores = [
                'speed_score' => $reviews->avg('speed_score'),
                'quality_score' => $reviews->avg('quality_score'),
                'attendance_score' => $reviews->avg('attendance_score'),
                'teamwork_score' => $reviews->avg('teamwork_score'),
                'customer_service_score' => $reviews->avg('customer_service_score'),
                'overall_score' => $reviews->avg('overall_score'),
            ];

            // Get latest review
            $latestReview = $reviews->first();

            // Performance trend (last 6 reviews)
            $trend = $reviews->take(6)->map(function($review) {
                return [
                    'period' => $review->review_period_start->format('M Y') . ' - ' . $review->review_period_end->format('M Y'),
                    'overall_score' => $review->overall_score,
                ];
            });

            $data = [
                'employee' => $employee,
                'total_reviews' => $reviews->count(),
                'average_scores' => $averageScores,
                'latest_review' => $latestReview,
                'performance_trend' => $trend,
                'all_reviews' => $reviews,
            ];

            return $this->sendResponse($data, 'Performance data retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve performance data', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Submit a performance review
     * POST /api/v1/workforce/performance/reviews
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'review_period_start' => 'required|date',
                'review_period_end' => 'required|date|after_or_equal:review_period_start',
                'speed_score' => 'required|numeric|min:0|max:5',
                'quality_score' => 'required|numeric|min:0|max:5',
                'attendance_score' => 'required|numeric|min:0|max:5',
                'teamwork_score' => 'required|numeric|min:0|max:5',
                'customer_service_score' => 'required|numeric|min:0|max:5',
                'strengths' => 'nullable|string|max:2000',
                'areas_for_improvement' => 'nullable|string|max:2000',
                'goals' => 'nullable|string|max:2000',
                'comments' => 'nullable|string|max:2000',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        }

        try {
            $user = Auth::user();

            // Only managers can submit performance reviews
            if (!$user->hasAnyRole(['manager', 'workforce-manager', 'admin', 'super-admin'])) {
                return $this->sendError('Unauthorized', 403);
            }

            // Calculate overall score (average of all scores)
            $overallScore = (
                $validated['speed_score'] +
                $validated['quality_score'] +
                $validated['attendance_score'] +
                $validated['teamwork_score'] +
                $validated['customer_service_score']
            ) / 5;

            // Check for overlapping review periods
            $overlapping = PerformanceReview::where('employee_id', $validated['employee_id'])
                ->where(function($query) use ($validated) {
                    $query->whereBetween('review_period_start', [$validated['review_period_start'], $validated['review_period_end']])
                        ->orWhereBetween('review_period_end', [$validated['review_period_start'], $validated['review_period_end']])
                        ->orWhere(function($q) use ($validated) {
                            $q->where('review_period_start', '<=', $validated['review_period_start'])
                              ->where('review_period_end', '>=', $validated['review_period_end']);
                        });
                })
                ->exists();

            if ($overlapping) {
                return $this->sendError('Performance review period overlaps with existing review', 422);
            }

            $review = PerformanceReview::create([
                'employee_id' => $validated['employee_id'],
                'reviewer_id' => $user->id,
                'review_period_start' => $validated['review_period_start'],
                'review_period_end' => $validated['review_period_end'],
                'speed_score' => $validated['speed_score'],
                'quality_score' => $validated['quality_score'],
                'attendance_score' => $validated['attendance_score'],
                'teamwork_score' => $validated['teamwork_score'],
                'customer_service_score' => $validated['customer_service_score'],
                'overall_score' => round($overallScore, 2),
                'strengths' => $validated['strengths'] ?? null,
                'areas_for_improvement' => $validated['areas_for_improvement'] ?? null,
                'goals' => $validated['goals'] ?? null,
                'comments' => $validated['comments'] ?? null,
            ]);

            $review->load(['employee.user', 'reviewer']);

            return $this->sendResponse($review, 'Performance review submitted successfully', 201);

        } catch (\Exception $e) {
            return $this->sendError('Failed to submit performance review', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * List all performance reviews
     * GET /api/v1/workforce/performance/reviews
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $query = PerformanceReview::with(['employee.user', 'reviewer']);

            // Employees can only see their own reviews
            if (!$user->hasAnyRole(['manager', 'workforce-manager', 'admin', 'super-admin'])) {
                $employee = Employee::where('user_id', $user->id)->first();
                if (!$employee) {
                    return $this->sendError('Employee profile not found', 404);
                }
                $query->where('employee_id', $employee->id);
            }

            // Filter by employee
            if ($request->has('employee_id')) {
                $query->where('employee_id', $request->input('employee_id'));
            }

            // Filter by reviewer
            if ($request->has('reviewer_id')) {
                $query->where('reviewer_id', $request->input('reviewer_id'));
            }

            // Filter by date range
            if ($request->has('start_date')) {
                $query->where('review_period_start', '>=', $request->input('start_date'));
            }
            if ($request->has('end_date')) {
                $query->where('review_period_end', '<=', $request->input('end_date'));
            }

            // Filter by minimum overall score
            if ($request->has('min_score')) {
                $query->where('overall_score', '>=', $request->input('min_score'));
            }

            $reviews = $query->orderBy('review_period_end', 'desc')
                ->paginate($request->input('per_page', 15));

            return $this->sendResponse($reviews, 'Performance reviews retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve performance reviews', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update a performance review
     * PUT /api/v1/workforce/performance/reviews/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'speed_score' => 'nullable|numeric|min:0|max:5',
                'quality_score' => 'nullable|numeric|min:0|max:5',
                'attendance_score' => 'nullable|numeric|min:0|max:5',
                'teamwork_score' => 'nullable|numeric|min:0|max:5',
                'customer_service_score' => 'nullable|numeric|min:0|max:5',
                'strengths' => 'nullable|string|max:2000',
                'areas_for_improvement' => 'nullable|string|max:2000',
                'goals' => 'nullable|string|max:2000',
                'comments' => 'nullable|string|max:2000',
            ]);

            $user = Auth::user();

            // Only managers can update performance reviews
            if (!$user->hasAnyRole(['manager', 'workforce-manager', 'admin', 'super-admin'])) {
                return $this->sendError('Unauthorized', 403);
            }

            $review = PerformanceReview::findOrFail($id);

            // Update scores if provided
            if (isset($validated['speed_score'])) {
                $review->speed_score = $validated['speed_score'];
            }
            if (isset($validated['quality_score'])) {
                $review->quality_score = $validated['quality_score'];
            }
            if (isset($validated['attendance_score'])) {
                $review->attendance_score = $validated['attendance_score'];
            }
            if (isset($validated['teamwork_score'])) {
                $review->teamwork_score = $validated['teamwork_score'];
            }
            if (isset($validated['customer_service_score'])) {
                $review->customer_service_score = $validated['customer_service_score'];
            }

            // Recalculate overall score
            $review->overall_score = round((
                $review->speed_score +
                $review->quality_score +
                $review->attendance_score +
                $review->teamwork_score +
                $review->customer_service_score
            ) / 5, 2);

            // Update text fields if provided
            if (isset($validated['strengths'])) {
                $review->strengths = $validated['strengths'];
            }
            if (isset($validated['areas_for_improvement'])) {
                $review->areas_for_improvement = $validated['areas_for_improvement'];
            }
            if (isset($validated['goals'])) {
                $review->goals = $validated['goals'];
            }
            if (isset($validated['comments'])) {
                $review->comments = $validated['comments'];
            }

            $review->save();
            $review->load(['employee.user', 'reviewer']);

            return $this->sendResponse($review, 'Performance review updated successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to update performance review', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Delete a performance review
     * DELETE /api/v1/workforce/performance/reviews/{id}
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();

            // Only admins can delete performance reviews
            if (!$user->hasAnyRole(['admin', 'super-admin'])) {
                return $this->sendError('Unauthorized', 403);
            }

            $review = PerformanceReview::findOrFail($id);
            $review->delete();

            return $this->sendResponse(null, 'Performance review deleted successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to delete performance review', 500, ['error' => $e->getMessage()]);
        }
    }
}
