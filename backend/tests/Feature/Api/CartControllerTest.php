<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Product;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CartControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->product = Product::factory()->create(['is_available' => true]);
        Sanctum::actingAs($this->user);
    }

    public function test_user_can_view_cart()
    {
        $cart = Cart::factory()->create(['user_id' => $this->user->id]);
        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $this->product->id,
            'quantity' => 2
        ]);

        $response = $this->getJson('/api/v1/cart');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'cart_id',
                    'items' => [
                        '*' => [
                            'id',
                            'cart_id',
                            'product_id',
                            'quantity',
                            'product' => [
                                'id',
                                'name',
                                'price'
                            ]
                        ]
                    ],
                    'total_items',
                    'total_amount'
                ]
            ]);
    }

    public function test_user_can_add_item_to_cart()
    {
        $cartData = [
            'product_id' => $this->product->id,
            'quantity' => 3
        ];

        $response = $this->postJson('/api/v1/cart/items', $cartData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'cart_id',
                    'product_id',
                    'quantity',
                    'product' => [
                        'id',
                        'name',
                        'price'
                    ]
                ]
            ]);

        $this->assertDatabaseHas('cart_items', [
            'product_id' => $this->product->id,
            'quantity' => 3
        ]);
    }

    public function test_user_can_update_cart_item_quantity()
    {
        $cart = Cart::factory()->create(['user_id' => $this->user->id]);
        $cartItem = CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $this->product->id,
            'quantity' => 1
        ]);

        $updateData = ['quantity' => 5];

        $response = $this->putJson("/api/v1/cart/items/{$cartItem->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'quantity' => 5
                ]
            ]);

        $this->assertDatabaseHas('cart_items', [
            'id' => $cartItem->id,
            'quantity' => 5
        ]);
    }

    public function test_user_can_remove_item_from_cart()
    {
        $cart = Cart::factory()->create(['user_id' => $this->user->id]);
        $cartItem = CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $this->product->id
        ]);

        $response = $this->deleteJson("/api/v1/cart/items/{$cartItem->id}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('cart_items', ['id' => $cartItem->id]);
    }

    public function test_user_can_clear_cart()
    {
        $cart = Cart::factory()->create(['user_id' => $this->user->id]);
        CartItem::factory()->count(3)->create(['cart_id' => $cart->id]);

        $response = $this->postJson('/api/v1/cart/clear');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Cart cleared successfully'
            ]);

        $this->assertEquals(0, CartItem::where('cart_id', $cart->id)->count());
    }

    public function test_cannot_add_unavailable_product_to_cart()
    {
        $unavailableProduct = Product::factory()->create(['is_available' => false]);

        $response = $this->postJson('/api/v1/cart/items', [
            'product_id' => $unavailableProduct->id,
            'quantity' => 1
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Product is not available'
            ]);
    }

    public function test_cart_quantity_validation()
    {
        $response = $this->postJson('/api/v1/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 0 // Invalid quantity
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);
    }

    public function test_cart_item_belongs_to_user()
    {
        $otherUser = User::factory()->create();
        $otherCart = Cart::factory()->create(['user_id' => $otherUser->id]);
        $otherCartItem = CartItem::factory()->create(['cart_id' => $otherCart->id]);

        $response = $this->deleteJson("/api/v1/cart/items/{$otherCartItem->id}");

        $response->assertStatus(404);
    }

    public function test_cart_total_calculation()
    {
        $cart = Cart::factory()->create(['user_id' => $this->user->id]);

        $product1 = Product::factory()->create(['price' => 10.00]);
        $product2 = Product::factory()->create(['price' => 15.50]);

        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $product1->id,
            'quantity' => 2,
        ]);

        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $product2->id,
            'quantity' => 1,
        ]);

        $response = $this->getJson('/api/v1/cart');

        $response->assertStatus(200);

        $cartData = $response->json('data');
        $this->assertEquals(3, $cartData['total_items']); // 2 + 1
        $this->assertEquals('35.50', $cartData['total_amount']); // (2 * 10.00) + (1 * 15.50)
    }
}
