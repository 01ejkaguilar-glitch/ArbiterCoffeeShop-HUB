<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class BaseController extends Controller
{
    /**
     * Success response
     *
     * @param mixed $data
     * @param string $message
     * @param int $statusCode
     * @return JsonResponse
     */
    protected function sendResponse($data, string $message = 'Success', int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
        ], $statusCode);
    }

    /**
     * Error response
     *
     * @param string $message
     * @param int $statusCode
     * @param array $errors
     * @return JsonResponse
     */
    protected function sendError(string $message, int $statusCode = 400, array $errors = []): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Validation error response
     *
     * @param array $errors
     * @param string $message
     * @return JsonResponse
     */
    protected function sendValidationError(array $errors, string $message = 'Validation failed'): JsonResponse
    {
        return $this->sendError($message, 422, $errors);
    }

    /**
     * Unauthorized response
     *
     * @param string $message
     * @return JsonResponse
     */
    protected function sendUnauthorized(string $message = 'Unauthorized'): JsonResponse
    {
        return $this->sendError($message, 401);
    }

    /**
     * Forbidden response
     *
     * @param string $message
     * @return JsonResponse
     */
    protected function sendForbidden(string $message = 'Forbidden'): JsonResponse
    {
        return $this->sendError($message, 403);
    }

    /**
     * Not found response
     *
     * @param string $message
     * @return JsonResponse
     */
    protected function sendNotFound(string $message = 'Resource not found'): JsonResponse
    {
        return $this->sendError($message, 404);
    }

    /**
     * Created response
     *
     * @param mixed $data
     * @param string $message
     * @return JsonResponse
     */
    protected function sendCreated($data, string $message = 'Resource created successfully'): JsonResponse
    {
        return $this->sendResponse($data, $message, 201);
    }

    /**
     * No content response
     *
     * @return JsonResponse
     */
    protected function sendNoContent(): JsonResponse
    {
        return response()->json(null, 204);
    }
}
