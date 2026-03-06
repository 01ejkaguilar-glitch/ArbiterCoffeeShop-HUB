<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InventoryItem;
use Illuminate\Support\Facades\DB;

class InventoryItemSeeder extends Seeder
{
    /**
     * Map CSV category → inventory type key used by the app.
     */
    private function mapType(string $category): string
    {
        return match ($category) {
            'Bar Supplies'           => 'bar',
            'Cleaning Supplies'      => 'cleaning',
            'Stationery Supplies'    => 'stationery',
            'Packaging Supplies'     => 'packaging',
            default                  => 'kitchen',   // Kitchen Supplies, Baking Items, Deli Frozen Products
        };
    }

    public function run(): void
    {
        // Disable FK checks, truncate both tables, re-enable
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('inventory_logs')->truncate();
        InventoryItem::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $items = [
            // ── KITCHEN SUPPLIES – Wet Market ──────────────────────────────
            ['name' => 'Rice (Dinorado)',                   'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 5],
            ['name' => 'Beef Sukiyaki',                     'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 2],
            ['name' => 'Minced Pork',                       'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 2],
            ['name' => 'Chicken Breast or Thigh',           'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 3],
            ['name' => 'Tendon Shrimp',                     'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 1],
            ['name' => 'Pork Liempo',                       'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 2],
            ['name' => 'Hotatoes Fries',                    'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Ham (Chicken)',                     'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 2],
            ['name' => 'Bacon Strips',                      'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Pop Corn Chicken',                  'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 2],
            ['name' => 'Tailed On Panko Shrimp',            'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 1],
            ['name' => 'Fried Chicken',                     'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 2],
            ['name' => 'Fish Tofu (Kamaboko)',               'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Mega Sardines Red',                 'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'can',    'reorder_level' => 3],
            ['name' => 'Green Eggplant',                    'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 1],
            ['name' => 'Eggs',                              'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'piece',  'reorder_level' => 24],
            ['name' => 'Cabbage',                           'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 2],
            ['name' => 'Lettuce',                           'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 1],
            ['name' => 'Petchay',                           'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 1],
            ['name' => 'Onion Leek / Chives',               'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 1],
            ['name' => 'White Onion',                       'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 2],
            ['name' => 'Red Onion',                         'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 2],
            ['name' => 'Carrots',                           'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 1],
            ['name' => 'Cucumber',                          'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 1],
            ['name' => 'Garlic',                            'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 2],
            ['name' => 'Ginger',                            'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 1],
            ['name' => 'Potato',                            'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 2],
            ['name' => 'Red Tomato',                        'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 1],
            ['name' => 'Lemon',                             'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 1],
            ['name' => 'Green Chili',                       'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 1],
            ['name' => 'Black Olives',                      'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'can',    'reorder_level' => 2],
            ['name' => 'Mayonaise',                         'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'jar',    'reorder_level' => 2],
            ['name' => "Oyster Sauce (Mama Sita's)",        'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 2],
            ['name' => 'Ketchup',                           'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 2],
            ['name' => 'Hot Sauce',                         'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 2],
            ['name' => 'Worcestershire Sauce',              'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 1],
            ['name' => 'All Purpose Flour',                 'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 3],
            ['name' => 'Cornstarch',                        'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Pepper Powder',                     'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Iodized Salt',                      'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Rock Salt',                         'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'White Sugar',                       'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 3],
            ['name' => 'Brown Sugar',                       'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 2],
            ['name' => 'Knorr Cubes (Chicken)',              'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Knorr Cubes (Pork)',                 'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Magic Sarap',                       'category' => 'Kitchen Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],

            // ── KITCHEN SUPPLIES – Online ───────────────────────────────────
            ['name' => 'Udon Noodles',                      'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 5],
            ['name' => 'Ramen Noodles',                     'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 5],
            ['name' => 'Soba Noodles',                      'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 5],
            ['name' => 'Cheddar Cheese',                    'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Peanut Sauce (Haidilao Sauce)',      'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 2],
            ['name' => 'Kikkoman Soy Sauce',                 'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 2],
            ['name' => 'Sake',                              'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 1],
            ['name' => 'Mirin',                             'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 1],
            ['name' => 'Gravy Powder',                      'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Tonkotsu Sauce',                    'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Pickles',                           'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'jar',    'reorder_level' => 2],
            ['name' => 'Shitake Mushroom',                  'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Chili Oil (Rayu Oil)',               'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 2],
            ['name' => 'Benishoga (Red Pickled Ginger)',     'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Hondashi',                          'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Miso Soup Powder',                  'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Curry Sauce Mix (Golden Curry)',     'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Nori Seaweed',                      'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Aonori Seaweed',                    'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Bonito Flakes (Katsuobushi)',        'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Kikurage (Mushroom Shred)',          'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Sesame Seed Black',                  'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Jalapeño',                          'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 1],
            ['name' => 'Togarashi (Chili Powder)',           'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Shredded Chili (Tantanmen)',         'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Chili Flakes (Chili Gyudon)',        'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Burger Bamboo Sticks',               'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Black Rubber Gloves',                'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pair',   'reorder_level' => 5],
            ['name' => 'BBQ Sticks',                        'category' => 'Kitchen Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],

            // ── BAKING ITEMS – Wet Market ──────────────────────────────────
            ['name' => 'Sugo Peanuts',                      'category' => 'Baking Items', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'bag',    'reorder_level' => 2],
            ['name' => 'Crushed Graham Cracker',            'category' => 'Baking Items', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Sesame Seed White',                  'category' => 'Baking Items', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Powdered Gelatin White',             'category' => 'Baking Items', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Cooking Oil',                       'category' => 'Baking Items', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'liter',  'reorder_level' => 2],
            ['name' => 'All Purpose Cream',                  'category' => 'Baking Items', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Canola Oil',                        'category' => 'Baking Items', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'liter',  'reorder_level' => 2],
            ['name' => 'Dari Crème Butter',                  'category' => 'Baking Items', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Vinegar',                           'category' => 'Baking Items', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 2],
            ['name' => 'Cream Cheese',                      'category' => 'Baking Items', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Classic Evaporated Milk (Small)',    'category' => 'Baking Items', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'can',    'reorder_level' => 5],
            ['name' => 'Vanilla Extract',                   'category' => 'Baking Items', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 1],
            ['name' => 'Bread Crumbs',                      'category' => 'Baking Items', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Goya Hazelnut Spread',               'category' => 'Baking Items', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'jar',    'reorder_level' => 2],
            ['name' => 'Kimchi',                            'category' => 'Baking Items', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],

            // ── BAKING ITEMS – Online ──────────────────────────────────────
            ['name' => 'Chocolate Chips',                   'category' => 'Baking Items', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Walnut',                            'category' => 'Baking Items', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Blueberry Sauce',                   'category' => 'Baking Items', 'source' => 'Online', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 2],
            ['name' => 'Lady Finger Biscuit (Tiramisu)',     'category' => 'Baking Items', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Biscoff Biscuits',                  'category' => 'Baking Items', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Biscoff Spread',                    'category' => 'Baking Items', 'source' => 'Online', 'quantity' => 0, 'unit' => 'jar',    'reorder_level' => 2],
            ['name' => 'Croissants',                        'category' => 'Baking Items', 'source' => 'Online', 'quantity' => 0, 'unit' => 'piece',  'reorder_level' => 10],

            // ── DELI FROZEN PRODUCTS – Online ──────────────────────────────
            ['name' => 'Gyoza',                             'category' => 'Deli Frozen Products', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Karaage',                           'category' => 'Deli Frozen Products', 'source' => 'Online', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 2],
            ['name' => 'Edamame',                           'category' => 'Deli Frozen Products', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Salmon Patty',                      'category' => 'Deli Frozen Products', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Naruto Maki (Fish Cake)',            'category' => 'Deli Frozen Products', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Burger Patty',                      'category' => 'Deli Frozen Products', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],
            ['name' => 'Sausage',                           'category' => 'Deli Frozen Products', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],

            // ── CLEANING SUPPLIES – Wet Market ────────────────────────────
            ['name' => 'Dishwashing Liquid (Joy)',           'category' => 'Cleaning Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 2],
            ['name' => 'Dishwashing (Smart Green)',          'category' => 'Cleaning Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 2],
            ['name' => 'Trash Bags (60x80)',                 'category' => 'Cleaning Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'roll',   'reorder_level' => 2],
            ['name' => 'Lysol (Disinfectant Spray)',         'category' => 'Cleaning Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'can',    'reorder_level' => 2],
            ['name' => 'Zonrox',                            'category' => 'Cleaning Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 2],
            ['name' => 'Sponge',                            'category' => 'Cleaning Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'piece',  'reorder_level' => 5],

            // ── CLEANING SUPPLIES – Online ─────────────────────────────────
            ['name' => 'Alcohol',                           'category' => 'Cleaning Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 3],
            ['name' => 'Caffeto (Machine Cleaner)',          'category' => 'Cleaning Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 1],
            ['name' => 'Table Napkin (Green)',               'category' => 'Cleaning Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 5],
            ['name' => 'Toilet Tissue',                     'category' => 'Cleaning Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'roll',   'reorder_level' => 5],
            ['name' => 'Kitchen Towels',                    'category' => 'Cleaning Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'roll',   'reorder_level' => 3],
            ['name' => 'Incense Sticks',                    'category' => 'Cleaning Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],

            // ── BAR SUPPLIES – Wet Market ──────────────────────────────────
            ['name' => 'Full Cream Milk',                   'category' => 'Bar Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'liter',  'reorder_level' => 5],
            ['name' => 'Condensed Milk',                    'category' => 'Bar Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'can',    'reorder_level' => 5],
            ['name' => 'Fresh Milk',                        'category' => 'Bar Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'liter',  'reorder_level' => 5],
            ['name' => 'Milo Powder',                       'category' => 'Bar Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Minute Maid (Orange)',               'category' => 'Bar Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 5],
            ['name' => 'Minute Maid (Pineapple)',            'category' => 'Bar Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 5],
            ['name' => 'Grass Jelly',                       'category' => 'Bar Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 3],

            // ── BAR SUPPLIES – Online ──────────────────────────────────────
            ['name' => 'Coffee Beans',                      'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'kg',     'reorder_level' => 2],
            ['name' => 'Matcha Powder',                     'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Cascara',                           'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Blue Matcha Powder',                 'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Hibiscus Tea Flower',                'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Butterfly Pea Flower',               'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Thai Tea Powder',                   'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => "Hershey's Dark Choco",               'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Red Velvet Powder',                  'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Kinako Powder',                     'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Charcoal Powder',                   'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Caramel Syrups',                    'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 2],
            ['name' => 'Grenadine',                         'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 2],
            ['name' => 'Gas Bomb (CO2 sparkling)',           'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'piece',  'reorder_level' => 5],
            ['name' => 'Dried Orange Slice',                 'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'V60 Paper Filter',                   'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',   'reorder_level' => 2],
            ['name' => 'Cold Drip Round Filter',             'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'piece',  'reorder_level' => 3],
            ['name' => 'Lemonade Soda (Sprite)',             'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 5],
            ['name' => 'Peach Soda',                        'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 5],
            ['name' => 'Tonic Water',                       'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 5],
            ['name' => 'Kombucha',                          'category' => 'Bar Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'bottle', 'reorder_level' => 5],

            // ── STATIONERY SUPPLIES – Wet Market ──────────────────────────
            ['name' => 'Note Pad (Square)',                  'category' => 'Stationery Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'piece', 'reorder_level' => 3],
            ['name' => 'Pencil',                            'category' => 'Stationery Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'piece', 'reorder_level' => 5],
            ['name' => 'Whiteboard Marker',                  'category' => 'Stationery Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'piece', 'reorder_level' => 3],

            // ── STATIONERY SUPPLIES – Online ───────────────────────────────
            ['name' => 'Order Slip',                        'category' => 'Stationery Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Pens',                              'category' => 'Stationery Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'piece', 'reorder_level' => 5],

            // ── PACKAGING SUPPLIES – Wet Market ───────────────────────────
            ['name' => 'Sauce Container Togo (2oz)',         'category' => 'Packaging Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'piece', 'reorder_level' => 50],
            ['name' => 'Cling Wrap',                        'category' => 'Packaging Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'roll',  'reorder_level' => 2],
            ['name' => 'Hand Gloves (Plastic)',              'category' => 'Packaging Supplies', 'source' => 'Wet Market', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],

            // ── PACKAGING SUPPLIES – Online ────────────────────────────────
            ['name' => 'Chopstick Set',                     'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Long Neck Bottle (350ml)',           'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'piece', 'reorder_level' => 20],
            ['name' => 'Togo Spoon-Fork',                   'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Plastic Clamshell (No Lock)',        'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Kamaboko Hotdog Box',                'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Hamburger Box',                     'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 20],
            ['name' => 'Dabba Cups 12oz',                   'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Printed Burger Box',                 'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 20],
            ['name' => 'Dabba Cups 16oz',                   'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Cake Slice Container',               'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 10],
            ['name' => 'Dabba Cup Lids',                    'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Dabba Dessert Cups & Lids (6oz)',    'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Double Wall Paper Cups (8oz)',       'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Plastic for Cookies',                'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Double Wall Cups Lids (8oz)',        'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Togo Underliner (Newspaper)',        'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Single Bag for Drinks',              'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 10],
            ['name' => 'Tulip Paper Cups (Air Fries)',       'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Double Bag for Drinks',              'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 10],
            ['name' => 'Aluminum Foil Cupcake (Air Fries)',  'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Bento Bowl 700ml',                  'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Bento Bowl Lids 700ml',             'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Bento Bowl 500ml',                  'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Bento Bowl Lids 500ml',             'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Take Out Plastic Small',             'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 10],
            ['name' => 'Take Out Plastic Big',               'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 10],
            ['name' => 'Straw (Green)',                     'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
            ['name' => 'Hand Sanitizer Napkin (Slider)',     'category' => 'Packaging Supplies', 'source' => 'Online', 'quantity' => 0, 'unit' => 'pack',  'reorder_level' => 5],
        ];

        foreach ($items as $item) {
            InventoryItem::create([
                'name'          => $item['name'],
                'category'      => $item['category'],
                'source'        => $item['source'],
                'type'          => $this->mapType($item['category']),
                'quantity'      => $item['quantity'],
                'unit'          => $item['unit'],
                'reorder_level' => $item['reorder_level'],
                'cost_per_unit' => null,
            ]);
        }

        $this->command->info('Seeded ' . count($items) . ' inventory items from UPDATED-KITCHEN-SUPPLIES.pdf');
    }
}
