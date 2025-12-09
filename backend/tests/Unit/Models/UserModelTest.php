<?php

namespace Tests\Unit\Models;

use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_has_fillable_attributes()
    {
        $user = new User();
        $fillable = ['name', 'email', 'password'];

        foreach ($fillable as $attribute) {
            $this->assertContains($attribute, $user->getFillable());
        }
    }

    public function test_user_has_hidden_attributes()
    {
        $user = new User();
        $hidden = ['password', 'remember_token'];

        foreach ($hidden as $attribute) {
            $this->assertContains($attribute, $user->getHidden());
        }
    }

    public function test_user_has_correct_casts()
    {
        $user = new User();
        $casts = [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];

        foreach ($casts as $attribute => $cast) {
            $this->assertEquals($cast, $user->getCasts()[$attribute]);
        }
    }

    public function test_user_can_have_orders_relationship()
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(Order::class, $user->orders->first());
        $this->assertEquals($order->id, $user->orders->first()->id);
    }
}
