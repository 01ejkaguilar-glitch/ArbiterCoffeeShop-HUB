<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Test customer insights endpoint
echo ""Testing Customer Insights Authentication:\n"";
echo ""==========================================\n\n"";

$customer = \App\Models\User::where('email', 'customer@arbiter.com')->first();
if (!$customer) {
    echo ""Error: Customer user not found\n"";
    exit(1);
}

echo ""Customer: {$customer->name} ({$customer->email})\n"";
echo ""Customer ID: {$customer->id}\n"";
echo ""Roles: "" . $customer->roles->pluck('name')->implode(', ') . ""\n"";
echo ""Has 'customer' role: "" . ($customer->hasRole('customer') ? 'YES' : 'NO') . ""\n"";
echo ""Has 'admin' role: "" . ($customer->hasRole('admin') ? 'YES' : 'NO') . ""\n\n"";

// Check authorization logic
$isAdmin = $customer->hasRole(['admin', 'super-admin']);
echo ""Authorization Check:\n"";
echo ""- Is admin: "" . ($isAdmin ? 'YES' : 'NO') . ""\n"";
echo ""- Can view own insights: YES (always allowed)\n"";
echo ""- Can view other customer insights: "" . ($isAdmin ? 'YES' : 'NO') . ""\n\n"";

// Test insights generation
echo ""Testing Insights Generation:\n"";
try {
    $insightsService = app(\App\Services\CustomerInsightsService::class);
    $insights = $insightsService->generateCustomerInsights($customer->id);
    
    echo ""- Insights generated successfully\n"";
    echo ""- Keys present: "" . implode(', ', array_keys($insights)) . ""\n"";
    echo ""- Customer summary: {$insights['customer_summary']['name']} - {$insights['customer_summary']['email']}\n"";
} catch (\Exception $e) {
    echo ""- Error: "" . $e->getMessage() . ""\n"";
}
