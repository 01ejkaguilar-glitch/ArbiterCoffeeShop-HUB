<?php

namespace Tests\Unit\Models;

use App\Models\Product;
use App\Models\Category;
use App\Models\OrderItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_has_fillable_attributes()
    {
        $product = new Product();
        $fillable = [
            'category_id',
            'name',
            'description',
            'price',
            'image_url',
            'stock_quantity',
            'is_available',
            'customization_options'
        ];

        foreach ($fillable as $attribute) {
            $this->assertContains($attribute, $product->getFillable());
        }
    }

    public function test_product_has_correct_casts()
    {
        $product = new Product();
        $casts = [
            'price' => 'decimal:2',
            'stock_quantity' => 'integer',
            'is_available' => 'boolean',
            'customization_options' => 'array',
        ];

        foreach ($casts as $attribute => $cast) {
            $this->assertEquals($cast, $product->getCasts()[$attribute]);
        }
    }

    public function test_product_belongs_to_category()
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);

        $this->assertInstanceOf(Category::class, $product->category);
        $this->assertEquals($category->id, $product->category->id);
    }

    public function test_product_has_many_order_items()
    {
        $product = Product::factory()->create();
        $orderItem = OrderItem::factory()->create(['product_id' => $product->id]);

        $this->assertInstanceOf(OrderItem::class, $product->orderItems->first());
        $this->assertEquals($orderItem->id, $product->orderItems->first()->id);
    }
}
