<?php

require_once __DIR__ . '/../../vendor/autoload.php';

use Illuminate\Http\Request;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Testing Customer Favorites API\n";
echo "================================\n\n";

// Get first user
$user = User::first();
if (!$user) {
    echo "❌ No users found in database\n";
    exit(1);
}

echo "✅ Found user: {$user->email} (ID: {$user->id})\n";

// Authenticate user
Auth::login($user);
echo "✅ User authenticated\n";

// Create controller instance
$controller = new CustomerController();

// Test toggle favorite
echo "\nTesting toggle favorite...\n";

try {
    // Create a fake request
    $request = new Request();
    $request->merge(['product_id' => 1]); // Assuming product ID 1 exists

    // Call the method
    $response = $controller->toggleFavorite($request);

    $data = json_decode($response->getContent(), true);

    if ($data['success']) {
        echo "✅ Toggle favorite successful\n";
        echo "   Product ID: {$data['data']['product_id']}\n";
        echo "   Is favorited: " . ($data['data']['is_favorited'] ? 'YES' : 'NO') . "\n";
    } else {
        echo "❌ Toggle favorite failed: {$data['message']}\n";
        if (isset($data['error'])) {
            echo "   Error: {$data['error']}\n";
        }
    }

} catch (Exception $e) {
    echo "❌ Exception occurred: {$e->getMessage()}\n";
}

echo "\nTesting get favorites...\n";

try {
    $request = new Request();
    $response = $controller->getFavorites($request);

    $data = json_decode($response->getContent(), true);

    if ($data['success']) {
        echo "✅ Get favorites successful\n";
        echo "   Total favorites: {$data['count']}\n";
    } else {
        echo "❌ Get favorites failed: {$data['message']}\n";
    }

} catch (Exception $e) {
    echo "❌ Exception occurred: {$e->getMessage()}\n";
}

echo "\n🎉 Test completed!\n";