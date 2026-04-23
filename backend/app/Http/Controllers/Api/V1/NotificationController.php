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

    /**
     * Get all notifications for the authenticated user.
     * Uses Laravel's built-in database notifications.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->take(100)
            ->get()
            ->map(fn($n) => [
                'id'        => $n->id,
                'title'     => $n->data['title'] ?? 'Notification',
                'message'   => $n->data['message'] ?? '',
                'type'      => $n->data['type'] ?? 'info',
                'data'      => $n->data['data'] ?? [],
                'action'    => $n->data['action'] ?? null,
                'read'      => !is_null($n->read_at),
                'createdAt' => $n->created_at->toIso8601String(),
            ]);

        return response()->json([
            'success' => true,
            'data'    => $notifications,
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->first();

        if (!$notification) {
            return response()->json(['success' => false, 'message' => 'Notification not found'], 404);
        }

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['success' => true]);
    }

    /**
     * Delete a single notification.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $deleted = $request->user()
            ->notifications()
            ->where('id', $id)
            ->delete();

        if (!$deleted) {
            return response()->json(['success' => false, 'message' => 'Notification not found'], 404);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Clear all notifications.
     */
    public function clearAll(Request $request): JsonResponse
    {
        $request->user()->notifications()->delete();

        return response()->json(['success' => true]);
    }
}