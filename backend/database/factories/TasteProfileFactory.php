<?php

namespace Database\Factories;

use App\Models\TasteProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TasteProfileFactory extends Factory
{
    protected $model = TasteProfile::class;

    public function definition()
    {
        return [
            'customer_id' => User::factory(),
            'favorite_roast' => $this->faker->randomElement(['light', 'medium', 'dark']),
            'flavor_preferences' => json_encode($this->faker->randomElements(['chocolate', 'fruity', 'nutty', 'floral'], 2)),
        ];
    }
}
