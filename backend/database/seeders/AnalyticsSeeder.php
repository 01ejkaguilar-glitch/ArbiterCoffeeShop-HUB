<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AnalyticsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding analytics test data...');

        // ── Products ────────────────────────────────────────────────────────
        $this->command->info('Creating products...');

        $products = $this->seedProducts();
        $this->command->info(count($products) . ' products ready.');

        // ── Customers ───────────────────────────────────────────────────────
        $this->command->info('Creating customer accounts...');

        $customers = $this->seedCustomers();
        $this->command->info(count($customers) . ' customers ready.');

        // ── Orders (current month, spread day by day) ────────────────────────
        $this->command->info('Creating orders for the current month...');

        $orderCount = $this->seedOrders($products, $customers);
        $this->command->info("{$orderCount} orders created.");

        $this->command->info('Analytics seed complete!');
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function seedProducts(): array
    {
        $categories = Category::pluck('id', 'name')->toArray();

        // Map our seeder category names to what CategorySeeder creates
        $catMap = [
            'Worldwide Specialty Coffee' => $categories['Worldwide Specialty Coffee']
                ?? Category::where('name', 'like', '%Specialty Coffee%')->value('id'),
            'Global Signature Beverages' => $categories['Global Signature Beverages']
                ?? Category::where('name', 'like', '%Signature%')->value('id'),
            'Japanese Rice Bowls'        => $categories['Japanese Rice Bowls']
                ?? Category::where('name', 'like', '%Rice Bowl%')->value('id'),
            'Japanese Noodles'           => $categories['Japanese Noodles']
                ?? Category::where('name', 'like', '%Noodle%')->value('id'),
            'Japanese Desserts'          => $categories['Japanese Desserts']
                ?? Category::where('name', 'like', '%Dessert%')->value('id'),
        ];

        $catalog = [
            // Specialty Coffee
            ['category' => 'Worldwide Specialty Coffee', 'name' => 'Ethiopian Yirgacheffe Pour Over',  'price' => 195],
            ['category' => 'Worldwide Specialty Coffee', 'name' => 'Colombian Single Origin Espresso', 'price' => 175],
            ['category' => 'Worldwide Specialty Coffee', 'name' => 'Kenyan AA Aeropress',             'price' => 210],
            // Signature Beverages
            ['category' => 'Global Signature Beverages', 'name' => 'Matcha Honey Latte',   'price' => 180],
            ['category' => 'Global Signature Beverages', 'name' => 'Brown Sugar Cold Brew', 'price' => 165],
            ['category' => 'Global Signature Beverages', 'name' => 'Ube Cream Latte',       'price' => 185],
            // Rice Bowls
            ['category' => 'Japanese Rice Bowls', 'name' => 'Gyudon Beef Bowl',    'price' => 295],
            ['category' => 'Japanese Rice Bowls', 'name' => 'Oyakodon Chicken',     'price' => 275],
            ['category' => 'Japanese Rice Bowls', 'name' => 'Salmon Teriyaki Bowl', 'price' => 350],
            // Noodles
            ['category' => 'Japanese Noodles', 'name' => 'Tonkotsu Ramen',    'price' => 320],
            ['category' => 'Japanese Noodles', 'name' => 'Shoyu Chicken Ramen', 'price' => 295],
            // Desserts
            ['category' => 'Japanese Desserts', 'name' => 'Matcha Mochi Ice Cream',  'price' => 145],
            ['category' => 'Japanese Desserts', 'name' => 'Dorayaki with Red Bean',  'price' => 120],
            ['category' => 'Japanese Desserts', 'name' => 'Japanese Cheesecake Slice', 'price' => 160],
        ];

        $products = [];

        foreach ($catalog as $item) {
            $categoryId = $catMap[$item['category']] ?? null;
            if (! $categoryId) {
                continue; // skip if category doesn't exist
            }

            $product = Product::firstOrCreate(
                ['name' => $item['name']],
                [
                    'category_id'    => $categoryId,
                    'description'    => $item['name'] . ' — a customer favourite at Arbiter Coffee Hub.',
                    'price'          => $item['price'],
                    'stock_quantity' => 999,
                    'is_available'   => true,
                ]
            );

            $products[] = [
                'id'          => $product->id,
                'category_id' => $categoryId,
                'price'       => $item['price'],
                'weight'      => $item['price'] > 200 ? 3 : 2, // higher-priced items ordered slightly less
            ];
        }

        return $products;
    }

    private function seedCustomers(): array
    {
        $names = [
            ['name' => 'Maria Santos',    'email' => 'maria.santos@example.com'],
            ['name' => 'Jose Reyes',      'email' => 'jose.reyes@example.com'],
            ['name' => 'Ana Garcia',      'email' => 'ana.garcia@example.com'],
            ['name' => 'Carlos Dela Cruz','email' => 'carlos.delacruz@example.com'],
            ['name' => 'Sofia Ramos',     'email' => 'sofia.ramos@example.com'],
            ['name' => 'Miguel Torres',   'email' => 'miguel.torres@example.com'],
            ['name' => 'Isabella Lim',    'email' => 'isabella.lim@example.com'],
            ['name' => 'Rafael Cruz',     'email' => 'rafael.cruz@example.com'],
        ];

        $customers = [];

        foreach ($names as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'     => $data['name'],
                    'password' => bcrypt('password123'),
                ]
            );
            if (! $user->hasRole('customer')) {
                $user->assignRole('customer');
            }
            $customers[] = $user->id;
        }

        return $customers;
    }

    private function seedOrders(array $products, array $customers): int
    {
        if (empty($products) || empty($customers)) {
            $this->command->warn('No products or customers — skipping order seeding.');
            return 0;
        }

        $now       = Carbon::now();
        $monthStart = Carbon::now()->startOfMonth();
        $totalDays  = $monthStart->diffInDays($now) + 1;

        $orderCount  = 0;
        $orderTypes  = ['dine-in', 'dine-in', 'take-out', 'take-out', 'delivery'];
        $payMethods  = ['cash', 'cash', 'gcash', 'card'];

        // Build a weighted product list for random selection
        $weightedProducts = [];
        foreach ($products as $p) {
            for ($w = 0; $w < $p['weight']; $w++) {
                $weightedProducts[] = $p;
            }
        }

        for ($day = 0; $day < $totalDays; $day++) {
            $date = $monthStart->copy()->addDays($day);

            // Weekends get more orders; simulate busier days near start of month
            $isWeekend  = $date->isWeekend();
            $ordersToday = $isWeekend
                ? rand(6, 12)
                : rand(3, 8);

            for ($o = 0; $o < $ordersToday; $o++) {
                // Random hour weighted toward lunch (11-14) and afternoon (15-18)
                $hour   = $this->randomHour();
                $minute = rand(0, 59);
                $orderDate = $date->copy()->setTime($hour, $minute, rand(0, 59));

                $userId     = $customers[array_rand($customers)];
                $orderType  = $orderTypes[array_rand($orderTypes)];
                $payMethod  = $payMethods[array_rand($payMethods)];
                $itemCount  = rand(1, 4);

                // Pick random items
                $subtotal = 0;
                $items    = [];
                $usedProducts = [];

                for ($i = 0; $i < $itemCount; $i++) {
                    $product = $weightedProducts[array_rand($weightedProducts)];
                    if (in_array($product['id'], $usedProducts)) {
                        continue; // avoid duplicate product in same order
                    }
                    $usedProducts[] = $product['id'];
                    $qty     = rand(1, 3);
                    $price   = $product['price'];
                    $subtotal += $qty * $price;
                    $items[]  = ['product_id' => $product['id'], 'quantity' => $qty, 'unit_price' => $price];
                }

                if (empty($items)) {
                    continue;
                }

                $deliveryFee = $orderType === 'delivery' ? 50 : 0;
                $total       = $subtotal + $deliveryFee;

                $order = Order::create([
                    'user_id'        => $userId,
                    'order_number'   => 'ORD-' . $orderDate->format('Ymd') . '-' . strtoupper(substr(uniqid(), -6)),
                    'status'         => 'completed',
                    'order_type'     => $orderType,
                    'subtotal'       => $subtotal,
                    'delivery_fee'   => $deliveryFee,
                    'total_amount'   => $total,
                    'payment_method' => $payMethod,
                    'payment_status' => 'paid',
                    'delivery_address' => $orderType === 'delivery' ? 'Arbiter Coffee Hub Area, Davao City' : null,
                    'prepared_at'    => $orderDate->copy()->addMinutes(rand(5, 15)),
                    'completed_at'   => $orderDate->copy()->addMinutes(rand(15, 30)),
                    'created_at'     => $orderDate,
                    'updated_at'     => $orderDate->copy()->addMinutes(rand(15, 30)),
                ]);

                foreach ($items as $item) {
                    OrderItem::create([
                        'order_id'   => $order->id,
                        'product_id' => $item['product_id'],
                        'quantity'   => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                    ]);
                }

                $orderCount++;
            }
        }

        return $orderCount;
    }

    /**
     * Returns a random hour weighted toward meal/coffee times.
     */
    private function randomHour(): int
    {
        $slots = [
            7, 8, 8, 9, 9, 9,          // Morning rush
            10, 10, 11, 11, 11,         // Mid-morning
            12, 12, 12, 12, 13, 13, 13, // Lunch peak
            14, 14, 15, 15, 15,         // Afternoon coffee
            16, 16, 17, 17,             // Late afternoon
            18, 18, 19,                 // Early evening
        ];
        return $slots[array_rand($slots)];
    }
}
