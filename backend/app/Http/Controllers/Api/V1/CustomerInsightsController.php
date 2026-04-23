<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Services\CustomerInsightsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Customer Insights Controller
 * 
 * Provides API endpoints for customer behavior analysis and insights
 */
class CustomerInsightsController extends BaseController
{
    protected $insightsService;

    public function __construct(CustomerInsightsService $insightsService)
    {
        $this->insightsService = $insightsService;
    }

    /**
     * Get comprehensive customer insights
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getCustomerInsights(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->sendUnauthorized('Authentication required');
            }

            // Admin can view any customer, regular users can only view themselves
            $customerId = $request->input('customer_id', $user->id);
            
            if (!$user->hasRole(['admin', 'super-admin']) && $customerId != $user->id) {
                return $this->sendError('Unauthorized', 403, ['error' => 'You can only view your own insights']);
            }

            $insights = $this->insightsService->generateCustomerInsights($customerId);

            return $this->sendResponse($insights, 'Customer insights retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Error retrieving insights', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get purchase behavior analysis
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getPurchaseBehavior(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->sendUnauthorized('Authentication required');
            }

            $customerId = $request->input('customer_id', $user->id);

            if (!$user->hasRole(['admin', 'super-admin']) && $customerId != $user->id) {
                return $this->sendError('Unauthorized', 403, ['error' => 'You can only view your own data']);
            }

            $insights = $this->insightsService->generateCustomerInsights($customerId);

            return $this->sendResponse(
                $insights['purchase_behavior'] ?? [],
                'Purchase behavior retrieved successfully'
            );
        } catch (\Exception $e) {
            return $this->sendError('Error retrieving purchase behavior', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get product affinity analysis
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getProductAffinity(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->sendUnauthorized('Authentication required');
            }

            $customerId = $request->input('customer_id', $user->id);

            if (!$user->hasRole(['admin', 'super-admin']) && $customerId != $user->id) {
                return $this->sendError('Unauthorized', 403, ['error' => 'You can only view your own data']);
            }

            $insights = $this->insightsService->generateCustomerInsights($customerId);

            return $this->sendResponse(
                $insights['product_affinity'] ?? [],
                'Product affinity retrieved successfully'
            );
        } catch (\Exception $e) {
            return $this->sendError('Error retrieving product affinity', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get engagement score
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getEngagementScore(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->sendUnauthorized('Authentication required');
            }

            $customerId = $request->input('customer_id', $user->id);

            if (!$user->hasRole(['admin', 'super-admin']) && $customerId != $user->id) {
                return $this->sendError('Unauthorized', 403, ['error' => 'You can only view your own data']);
            }

            $insights = $this->insightsService->generateCustomerInsights($customerId);

            return $this->sendResponse(
                $insights['engagement_score'] ?? [],
                'Engagement score retrieved successfully'
            );
        } catch (\Exception $e) {
            return $this->sendError('Error retrieving engagement score', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get lifecycle stage
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getLifecycleStage(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->sendUnauthorized('Authentication required');
            }

            $customerId = $request->input('customer_id', $user->id);

            if (!$user->hasRole(['admin', 'super-admin']) && $customerId != $user->id) {
                return $this->sendError('Unauthorized', 403, ['error' => 'You can only view your own data']);
            }

            $insights = $this->insightsService->generateCustomerInsights($customerId);

            return $this->sendResponse(
                $insights['lifecycle_stage'] ?? [],
                'Lifecycle stage retrieved successfully'
            );
        } catch (\Exception $e) {
            return $this->sendError('Error retrieving lifecycle stage', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get actionable recommendations
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getRecommendations(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->sendUnauthorized('Authentication required');
            }

            $customerId = $request->input('customer_id', $user->id);

            if (!$user->hasRole(['admin', 'super-admin']) && $customerId != $user->id) {
                return $this->sendError('Unauthorized', 403, ['error' => 'You can only view your own data']);
            }

            $insights = $this->insightsService->generateCustomerInsights($customerId);

            return $this->sendResponse(
                $insights['recommendations'] ?? [],
                'Recommendations retrieved successfully'
            );
        } catch (\Exception $e) {
            return $this->sendError('Unauthorized', 403, ['error' => 'You can only view your own data']);
        }
    }

    /**
     * Get predictive insights
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getPredictions(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->sendUnauthorized('Authentication required');
            }

            $customerId = $request->input('customer_id', $user->id);

            if (!$user->hasRole(['admin', 'super-admin']) && $customerId != $user->id) {
                return $this->sendError('Unauthorized', 403, ['error' => 'You can only view your own data']);
            }

            $insights = $this->insightsService->generateCustomerInsights($customerId);

            return $this->sendResponse(
                $insights['predictions'] ?? [],
                'Predictions retrieved successfully'
            );
        } catch (\Exception $e) {
            return $this->sendError('Unauthorized', 403, ['error' => 'You can only view your own data']);
        }
    }

    /**
     * Get satisfaction indicators
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getSatisfactionIndicators(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->sendUnauthorized('Authentication required');
            }

            $customerId = $request->input('customer_id', $user->id);

            if (!$user->hasRole(['admin', 'super-admin']) && $customerId != $user->id) {
                return $this->sendError('Unauthorized', 403, ['error' => 'You can only view your own data']);
            }

            $insights = $this->insightsService->generateCustomerInsights($customerId);

            return $this->sendResponse(
                $insights['satisfaction_indicators'] ?? [],
                'Satisfaction indicators retrieved successfully'
            );
        } catch (\Exception $e) {
            return $this->sendError('Unauthorized', 403, ['error' => 'You can only view your own data']);
        }
    }

    /**
     * Clear customer insights cache
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function clearCache(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->sendUnauthorized('Authentication required');
            }

            $customerId = $request->input('customer_id', $user->id);

            if (!$user->hasRole(['admin', 'super-admin']) && $customerId != $user->id) {
                return $this->sendError('Unauthorized', 403, ['error' => 'You can only view your own data']);
            }

            $this->insightsService->clearCustomerInsightsCache($customerId);

            return $this->sendResponse([], 'Customer insights cache cleared successfully');
        } catch (\Exception $e) {
            return $this->sendError('Unauthorized', 403, ['error' => 'You can only view your own data']);
        }
    }

    /**
     * Get insights for multiple customers (Admin only)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getBulkInsights(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->sendUnauthorized('Authentication required');
            }

            if (!$user->hasRole(['admin', 'super-admin'])) {
                return $this->sendError('Unauthorized', 403, ['error' => 'You can only view your own data']);
            }

            $validator = Validator::make($request->all(), [
                'customer_ids' => 'required|array',
                'customer_ids.*' => 'integer|exists:users,id',
            ]);

            if ($validator->fails()) {
                return $this->sendValidationError($validator->errors()->toArray());
            }

            $customerIds = $request->input('customer_ids');
            $bulkInsights = [];

            foreach ($customerIds as $customerId) {
                $bulkInsights[$customerId] = $this->insightsService->generateCustomerInsights($customerId);
            }

            return $this->sendResponse($bulkInsights, 'Bulk insights retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Unauthorized', 403, ['error' => 'You can only view your own data']);
        }
    }
}
