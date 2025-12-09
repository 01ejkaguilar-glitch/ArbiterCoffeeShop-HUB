<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    /**
     * Get VAPID public key for push notifications
     */
    public function getVapidKey(): JsonResponse
    {
        try {
            // Get VAPID public key from config or environment
            $vapidPublicKey = config('services.vapid.public_key') ?? env('VAPID_PUBLIC_KEY');

            if (!$vapidPublicKey) {
                return response()->json([
                    'error' => 'VAPID public key not configured'
                ], 500);
            }

            return response()->json([
                'publicKey' => $vapidPublicKey
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to retrieve VAPID key'
            ], 500);
        }
    }
}