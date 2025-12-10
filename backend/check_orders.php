<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$customer = \App\Models\User::find(3);
echo ""Customer: {$customer->name}\n"";
echo ""Orders count: "" . $customer->orders()->count() . ""\n"";
echo ""Total spent: $"" . $customer->orders()->sum('total_amount') . ""\n"";
