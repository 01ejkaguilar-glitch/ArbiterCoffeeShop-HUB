<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\CoffeeBean;

class CoffeeBeanFactory extends Factory
{
    protected $model = CoffeeBean::class;

    public function definition()
    {
        return [
            'name' => $this->faker->words(3, true),
            'origin_country' => $this->faker->country(),
            'region' => $this->faker->city(),
            'elevation' => (string) $this->faker->numberBetween(500, 2000),
            'processing_method' => $this->faker->randomElement(['washed', 'natural', 'honey']),
            'variety' => $this->faker->word(),
            'tasting_notes' => $this->faker->sentence(),
            'producer' => $this->faker->company(),
            'stock_quantity' => $this->faker->numberBetween(0, 100),
            'is_featured' => $this->faker->boolean(10),
            'image_url' => null,
        ];
    }
}
