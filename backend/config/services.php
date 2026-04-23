<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment Gateway Services
    |--------------------------------------------------------------------------
    */

    'gcash' => [
        'api_url' => env('GCASH_API_URL', 'https://api.gcash.com/v1'),
        'api_key' => env('GCASH_API_KEY'),
        'merchant_id' => env('GCASH_MERCHANT_ID'),
        'webhook_secret' => env('GCASH_WEBHOOK_SECRET'),
    ],

    'maya' => [
        'api_url' => env('MAYA_API_URL', 'https://pg-sandbox.paymaya.com'),
        'public_key' => env('MAYA_PUBLIC_KEY'),
        'secret_key' => env('MAYA_SECRET_KEY'),
        'webhook_secret' => env('MAYA_WEBHOOK_SECRET'),
    ],

    'paypal' => [
        'client_id' => env('PAYPAL_CLIENT_ID'),
        'client_secret' => env('PAYPAL_CLIENT_SECRET'),
        'mode' => env('PAYPAL_MODE', 'sandbox'), // sandbox or live
    ],

    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],

    'payment' => [
        'default_gateway' => env('PAYMENT_DEFAULT_GATEWAY', 'maya'),
        'supported_gateways' => ['gcash', 'maya', 'stripe', 'paypal'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Push Notification Services
    |--------------------------------------------------------------------------
    */

    'vapid' => [
        'public_key' => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
        'subject' => env('VAPID_SUBJECT', 'mailto:admin@arbitercoffee.com'),
    ],

];
