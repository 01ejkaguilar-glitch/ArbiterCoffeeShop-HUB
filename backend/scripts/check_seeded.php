<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$checks = [
    'roles' => Illuminate\Support\Facades\DB::table('roles')->count(),
    'permissions' => Illuminate\Support\Facades\DB::table('permissions')->count(),
    'categories' => Illuminate\Support\Facades\DB::table('categories')->count(),
    'coffee_beans' => Illuminate\Support\Facades\DB::table('coffee_beans')->count(),
    'inventory_items' => Illuminate\Support\Facades\DB::table('inventory_items')->count(),
    'announcements' => Illuminate\Support\Facades\DB::table('announcements')->count(),
    'users_admin' => Illuminate\Support\Facades\DB::table('users')->where('email', 'admin@arbiter.com')->count(),
    'users_barista' => Illuminate\Support\Facades\DB::table('users')->where('email', 'barista@arbiter.com')->count(),
    'users_customer' => Illuminate\Support\Facades\DB::table('users')->where('email', 'customer@arbiter.com')->count(),
    'users_kitchen' => Illuminate\Support\Facades\DB::table('users')->where('email', 'kitchen@arbiter.com')->count(),
    'employees_barista' => Illuminate\Support\Facades\DB::table('employees')->where('employee_number', 'EMP-001')->count(),
    'employees_kitchen' => Illuminate\Support\Facades\DB::table('employees')->where('employee_number', 'EMP-002')->count(),
    'analytics_orders' => Illuminate\Support\Facades\DB::table('orders')->count(),
    'analytics_order_items' => Illuminate\Support\Facades\DB::table('order_items')->count(),
    'analytics_products_match' => Illuminate\Support\Facades\DB::table('products')->whereIn('name', [
        'Ethiopian Yirgacheffe Pour Over',
        'Colombian Single Origin Espresso',
        'Kenyan AA Aeropress',
        'Matcha Honey Latte',
        'Brown Sugar Cold Brew',
        'Ube Cream Latte',
        'Gyudon Beef Bowl',
        'Oyakodon Chicken',
        'Salmon Teriyaki Bowl',
        'Tonkotsu Ramen',
        'Shoyu Chicken Ramen',
        'Matcha Mochi Ice Cream',
        'Dorayaki with Red Bean',
        'Japanese Cheesecake Slice',
    ])->count(),
];

echo json_encode($checks, JSON_PRETTY_PRINT);
