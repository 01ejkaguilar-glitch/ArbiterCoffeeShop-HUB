<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Default user channel (Laravel convention)
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Customer order updates — OrderStatusUpdated broadcasts here
Broadcast::channel('user-orders-{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Customer notifications — real-time notification delivery
Broadcast::channel('user-notifications-{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Employee-specific channel — TaskAssigned, ShiftStarted broadcast here
Broadcast::channel('employee-{employeeId}', function ($user, $employeeId) {
    return (int) $user->id === (int) $employeeId
        || $user->hasRole('admin');
});