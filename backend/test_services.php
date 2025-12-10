<?php

// Test Services Registration
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Testing Services Registration...\n";
echo "=================================\n\n";

try {
    $recommendationService = app(\App\Services\RecommendationService::class);
    echo "✅ RecommendationService: REGISTERED\n";
    echo "   Class: " . get_class($recommendationService) . "\n\n";
} catch (\Exception $e) {
    echo "❌ RecommendationService: FAILED\n";
    echo "   Error: " . $e->getMessage() . "\n\n";
}

try {
    $insightsService = app(\App\Services\CustomerInsightsService::class);
    echo "✅ CustomerInsightsService: REGISTERED\n";
    echo "   Class: " . get_class($insightsService) . "\n\n";
} catch (\Exception $e) {
    echo "❌ CustomerInsightsService: FAILED\n";
    echo "   Error: " . $e->getMessage() . "\n\n";
}

echo "=================================\n";
echo "Service Registration Test Complete!\n";
