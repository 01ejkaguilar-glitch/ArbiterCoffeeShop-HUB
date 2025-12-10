<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Checking Roles:\n";
$roles = \Spatie\Permission\Models\Role::all();
foreach ($roles as $role) {
    echo "- {$role->name}\n";
}

echo "\nChecking Users:\n";
$users = \App\Models\User::with('roles')->take(3)->get();
foreach ($users as $user) {
    echo "User: {$user->name} ({$user->email})\n";
    echo "  Roles: " . $user->roles->pluck('name')->implode(', ') . "\n";
}
