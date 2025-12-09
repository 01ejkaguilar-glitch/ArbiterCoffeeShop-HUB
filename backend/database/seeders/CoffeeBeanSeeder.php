<?php

namespace Database\Seeders;

use App\Models\CoffeeBean;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CoffeeBeanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $coffeeBeans = [
            [
                'name' => 'Ethiopian Yirgacheffe',
                'origin_country' => 'Ethiopia',
                'region' => 'Yirgacheffe, Gedeo Zone',
                'elevation' => '1,800-2,200m',
                'processing_method' => 'Washed',
                'variety' => 'Heirloom',
                'tasting_notes' => 'Floral, citrus, bergamot, jasmine, bright acidity',
                'producer' => 'Yirgacheffe Coffee Farmers Cooperative Union',
                'stock_quantity' => 50,
                'is_featured' => true,
                'image_url' => '/assets/beans/ethiopian-yirgacheffe.jpg',
            ],
            [
                'name' => 'Colombian Supremo',
                'origin_country' => 'Colombia',
                'region' => 'Huila',
                'elevation' => '1,500-1,800m',
                'processing_method' => 'Washed',
                'variety' => 'Caturra, Castillo',
                'tasting_notes' => 'Caramel, nutty, chocolate, medium body, balanced',
                'producer' => 'Huila Coffee Growers Association',
                'stock_quantity' => 60,
                'is_featured' => true,
                'image_url' => '/assets/beans/colombian-supremo.jpg',
            ],
            [
                'name' => 'Brazilian Santos',
                'origin_country' => 'Brazil',
                'region' => 'Minas Gerais',
                'elevation' => '800-1,200m',
                'processing_method' => 'Natural',
                'variety' => 'Bourbon, Mundo Novo',
                'tasting_notes' => 'Sweet, low acidity, chocolate, nutty, full body',
                'producer' => 'Cerrado Mineiro Cooperative',
                'stock_quantity' => 40,
                'is_featured' => false,
                'image_url' => '/assets/beans/brazilian-santos.jpg',
            ],
            [
                'name' => 'Kenyan AA',
                'origin_country' => 'Kenya',
                'region' => 'Nyeri',
                'elevation' => '1,500-2,100m',
                'processing_method' => 'Washed',
                'variety' => 'SL28, SL34',
                'tasting_notes' => 'Blackcurrant, wine-like, bright acidity, complex',
                'producer' => 'Nyeri Coffee Cooperative',
                'stock_quantity' => 35,
                'is_featured' => false,
                'image_url' => '/assets/beans/kenyan-aa.jpg',
            ],
            [
                'name' => 'Guatemalan Antigua',
                'origin_country' => 'Guatemala',
                'region' => 'Antigua',
                'elevation' => '1,500-1,700m',
                'processing_method' => 'Washed',
                'variety' => 'Bourbon, Catuai',
                'tasting_notes' => 'Cocoa, spice, smoky, full body',
                'producer' => 'Antigua Coffee Producers',
                'stock_quantity' => 45,
                'is_featured' => false,
                'image_url' => '/assets/beans/guatemalan-antigua.jpg',
            ],
        ];

        foreach ($coffeeBeans as $bean) {
            CoffeeBean::create($bean);
            $this->command->info("Coffee bean '{$bean['name']}' created.");
        }

        $this->command->info('All coffee beans created successfully!');
    }
}
