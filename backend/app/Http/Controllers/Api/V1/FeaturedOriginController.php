<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Models\DailyFeaturedOrigin;
use App\Models\CoffeeBean;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class FeaturedOriginController extends BaseController
{
    /**
     * Get today's active featured origins (time-filtered)
     * Returns only origins active at current time
     */
    public function getToday()
    {
        try {
            $featuredOrigins = DailyFeaturedOrigin::with('coffeeBean')
                ->activeToday()
                ->orderBy('start_time')
                ->get();

            return $this->sendResponse($featuredOrigins, 'Today\'s featured origins retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve today\'s featured origins', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get all featured origins scheduled for today (ignores time)
     * Returns all origins scheduled for today regardless of start/end time
     */
    public function getTodayScheduled()
    {
        try {
            $featuredOrigins = DailyFeaturedOrigin::with('coffeeBean')
                ->scheduledToday()
                ->orderBy('start_time')
                ->get();

            return $this->sendResponse($featuredOrigins, 'Today\'s scheduled featured origins retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve today\'s scheduled featured origins', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get featured origins by date
     */
    public function getByDate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'date' => 'required|date',
            ]);

            if ($validator->fails()) {
                return $this->sendValidationError($validator->errors()->toArray());
            }

            $featuredOrigins = DailyFeaturedOrigin::with('coffeeBean')
                ->byDate($request->input('date'))
                ->orderBy('start_time')
                ->get();

            return $this->sendResponse($featuredOrigins, 'Featured origins retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve featured origins', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get all featured origins with pagination
     */
    public function index(Request $request)
    {
        try {
            $query = DailyFeaturedOrigin::with(['coffeeBean', 'creator']);

            // Filter by date range
            if ($request->has('start_date')) {
                $query->where('feature_date', '>=', $request->input('start_date'));
            }

            if ($request->has('end_date')) {
                $query->where('feature_date', '<=', $request->input('end_date'));
            }

            // Filter by active status
            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $featuredOrigins = $query->orderBy('feature_date', 'desc')
                ->orderBy('start_time')
                ->paginate(20);

            return $this->sendResponse($featuredOrigins, 'Featured origins retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve featured origins', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Create a new featured origin
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'coffee_bean_id' => 'required|exists:coffee_beans,id',
                'feature_date' => 'required|date|after_or_equal:today',
                'start_time' => 'nullable|date_format:H:i',
                'end_time' => 'nullable|date_format:H:i|after:start_time',
                'special_notes' => 'nullable|string|max:1000',
                'promotion_text' => 'nullable|string|max:500',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return $this->sendValidationError($validator->errors()->toArray());
            }

            // Check if this bean is already featured on this date
            $existing = DailyFeaturedOrigin::where('coffee_bean_id', $request->input('coffee_bean_id'))
                ->where('feature_date', $request->input('feature_date'))
                ->first();

            if ($existing) {
                return $this->sendError('This coffee bean is already featured on this date', 422);
            }

            $featuredOrigin = DailyFeaturedOrigin::create([
                'coffee_bean_id' => $request->input('coffee_bean_id'),
                'feature_date' => $request->input('feature_date'),
                'start_time' => $request->input('start_time'),
                'end_time' => $request->input('end_time'),
                'special_notes' => $request->input('special_notes'),
                'promotion_text' => $request->input('promotion_text'),
                'is_active' => $request->input('is_active', true),
                'created_by' => Auth::id(),
            ]);

            $featuredOrigin->load('coffeeBean');

            return $this->sendCreated($featuredOrigin, 'Featured origin created successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to create featured origin', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get a specific featured origin
     */
    public function show($id)
    {
        try {
            $featuredOrigin = DailyFeaturedOrigin::with(['coffeeBean', 'creator'])->find($id);

            if (!$featuredOrigin) {
                return $this->sendNotFound('Featured origin not found');
            }

            return $this->sendResponse($featuredOrigin, 'Featured origin retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve featured origin', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update a featured origin
     */
    public function update(Request $request, $id)
    {
        try {
            $featuredOrigin = DailyFeaturedOrigin::find($id);

            if (!$featuredOrigin) {
                return $this->sendNotFound('Featured origin not found');
            }

            $validator = Validator::make($request->all(), [
                'coffee_bean_id' => 'sometimes|exists:coffee_beans,id',
                'feature_date' => 'sometimes|date|after_or_equal:today',
                'start_time' => 'nullable|date_format:H:i',
                'end_time' => 'nullable|date_format:H:i|after:start_time',
                'special_notes' => 'nullable|string|max:1000',
                'promotion_text' => 'nullable|string|max:500',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return $this->sendValidationError($validator->errors()->toArray());
            }

            // Check for conflicts if changing bean or date
            if ($request->has('coffee_bean_id') || $request->has('feature_date')) {
                $beanId = $request->input('coffee_bean_id', $featuredOrigin->coffee_bean_id);
                $date = $request->input('feature_date', $featuredOrigin->feature_date);

                $existing = DailyFeaturedOrigin::where('coffee_bean_id', $beanId)
                    ->where('feature_date', $date)
                    ->where('id', '!=', $id)
                    ->first();

                if ($existing) {
                    return $this->sendError('This coffee bean is already featured on this date', 422);
                }
            }

            $featuredOrigin->update($request->only([
                'coffee_bean_id',
                'feature_date',
                'start_time',
                'end_time',
                'special_notes',
                'promotion_text',
                'is_active',
            ]));

            $featuredOrigin->load('coffeeBean');

            return $this->sendResponse($featuredOrigin, 'Featured origin updated successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to update featured origin', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Delete a featured origin
     */
    public function destroy($id)
    {
        try {
            $featuredOrigin = DailyFeaturedOrigin::find($id);

            if (!$featuredOrigin) {
                return $this->sendNotFound('Featured origin not found');
            }

            $featuredOrigin->delete();

            return $this->sendResponse(null, 'Featured origin deleted successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to delete featured origin', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get available coffee beans for featuring
     */
    public function getAvailableBeans()
    {
        try {
            $beans = CoffeeBean::where('is_featured', true)
                ->orderBy('name')
                ->get(['id', 'name', 'origin_country', 'region']);

            return $this->sendResponse($beans, 'Available coffee beans retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve available beans', 500, ['error' => $e->getMessage()]);
        }
    }
}
