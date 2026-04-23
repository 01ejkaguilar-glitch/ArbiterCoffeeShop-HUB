<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AnnouncementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::role('admin')->first();

        $announcements = [
            [
                'title' => 'Grand Opening Special - 20% Off All Specialty Coffee!',
                'content' => 'Join us in celebrating our grand opening! Enjoy 20% off all specialty coffee drinks throughout this week. Experience our carefully sourced Ethiopian Yirgacheffe and Colombian Supremo beans, expertly brewed by our skilled baristas. Limited time offer!',
                'category' => 'promo',
                'featured_image' => '/assets/announcements/grand-opening.jpg',
                'is_published' => true,
                'published_at' => now()->subDays(5),
                'created_by' => $admin->id ?? null,
            ],
            [
                'title' => 'New Japanese Menu Launch',
                'content' => 'We are excited to announce the launch of our authentic Japanese menu! From traditional Tonkotsu Ramen to Teriyaki Donburi, experience the perfect pairing of third-wave coffee and Japanese cuisine. Available now!',
                'category' => 'news',
                'featured_image' => '/assets/announcements/japanese-menu.jpg',
                'is_published' => true,
                'published_at' => now()->subDays(3),
                'created_by' => $admin->id ?? null,
            ],
            [
                'title' => 'Barista Training Workshop - December 2025',
                'content' => 'Want to become a certified barista? Join our intensive 2-week training program starting December 1, 2025. Learn espresso extraction, milk steaming, latte art, and coffee cupping. Limited slots available. Register now through our inquiry form!',
                'category' => 'event',
                'featured_image' => '/assets/announcements/barista-training.jpg',
                'is_published' => true,
                'published_at' => now()->subDays(1),
                'created_by' => $admin->id ?? null,
            ],
            [
                'title' => 'Holiday Hours Update',
                'content' => 'Please note our special operating hours during the holiday season. We will be open from 8 AM to 8 PM on weekdays and 9 AM to 9 PM on weekends. Closed on December 25 and January 1. Happy holidays from the Arbiter Coffee family!',
                'category' => 'update',
                'featured_image' => '/assets/announcements/holiday-hours.jpg',
                'is_published' => true,
                'published_at' => now(),
                'created_by' => $admin->id ?? null,
            ],
        ];

        foreach ($announcements as $announcement) {
            Announcement::create($announcement);
            $this->command->info("Announcement '{$announcement['title']}' created.");
        }

        $this->command->info('All announcements created successfully!');
    }
}
