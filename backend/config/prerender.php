<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Prerender Configuration
    |--------------------------------------------------------------------------
    |
    | Enable or disable Prerender.io integration
    |
    */

    'enable' => env('PRERENDER_ENABLE', false),

    /*
    |--------------------------------------------------------------------------
    | Prerender Token
    |--------------------------------------------------------------------------
    |
    | Your Prerender.io API token. Sign up at https://prerender.io
    |
    */

    'token' => env('PRERENDER_TOKEN', ''),

    /*
    |--------------------------------------------------------------------------
    | Prerender Service URL
    |--------------------------------------------------------------------------
    |
    | The Prerender.io service URL
    |
    */

    'url' => env('PRERENDER_URL', 'https://service.prerender.io'),
];
