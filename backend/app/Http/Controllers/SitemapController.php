<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * Generate XML sitemap for search engines
     * 
     * @return Response
     */
    public function index()
    {
        // Get all active products
        $products = Product::where('is_active', true)
            ->select('id', 'name', 'updated_at')
            ->get();

        // Get all categories
        $categories = Category::select('id', 'name', 'updated_at')->get();

        // Define static pages with priority and change frequency
        $staticPages = [
            [
                'url' => '/',
                'priority' => '1.0',
                'changefreq' => 'daily',
                'lastmod' => now()->toAtomString()
            ],
            [
                'url' => '/products',
                'priority' => '0.9',
                'changefreq' => 'daily',
                'lastmod' => $products->max('updated_at')?->toAtomString() ?? now()->toAtomString()
            ],
            [
                'url' => '/about',
                'priority' => '0.7',
                'changefreq' => 'monthly',
                'lastmod' => now()->toAtomString()
            ],
            [
                'url' => '/contact',
                'priority' => '0.8',
                'changefreq' => 'monthly',
                'lastmod' => now()->toAtomString()
            ],
            [
                'url' => '/announcements',
                'priority' => '0.6',
                'changefreq' => 'weekly',
                'lastmod' => now()->toAtomString()
            ],
            [
                'url' => '/inquiries',
                'priority' => '0.6',
                'changefreq' => 'monthly',
                'lastmod' => now()->toAtomString()
            ],
            [
                'url' => '/login',
                'priority' => '0.5',
                'changefreq' => 'yearly',
                'lastmod' => now()->toAtomString()
            ],
            [
                'url' => '/register',
                'priority' => '0.5',
                'changefreq' => 'yearly',
                'lastmod' => now()->toAtomString()
            ]
        ];

        // Build XML sitemap
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . PHP_EOL;

        // Add static pages
        foreach ($staticPages as $page) {
            $xml .= $this->generateUrlEntry(
                $page['url'],
                $page['lastmod'],
                $page['changefreq'],
                $page['priority']
            );
        }

        // Add product pages
        foreach ($products as $product) {
            $xml .= $this->generateUrlEntry(
                '/products/' . $product->id,
                $product->updated_at->toAtomString(),
                'weekly',
                '0.8'
            );
        }

        // Add category pages (if you have category detail pages)
        foreach ($categories as $category) {
            $xml .= $this->generateUrlEntry(
                '/products?category=' . $category->id,
                $category->updated_at->toAtomString(),
                'weekly',
                '0.7'
            );
        }

        $xml .= '</urlset>';

        // Return XML response with proper headers
        return response($xml, 200)
            ->header('Content-Type', 'application/xml')
            ->header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    }

    /**
     * Generate a single URL entry for the sitemap
     * 
     * @param string $url
     * @param string $lastmod
     * @param string $changefreq
     * @param string $priority
     * @return string
     */
    private function generateUrlEntry($url, $lastmod, $changefreq, $priority)
    {
        $baseUrl = config('app.url', 'http://localhost:3000');
        
        $xml = '  <url>' . PHP_EOL;
        $xml .= '    <loc>' . htmlspecialchars($baseUrl . $url, ENT_XML1) . '</loc>' . PHP_EOL;
        $xml .= '    <lastmod>' . $lastmod . '</lastmod>' . PHP_EOL;
        $xml .= '    <changefreq>' . $changefreq . '</changefreq>' . PHP_EOL;
        $xml .= '    <priority>' . $priority . '</priority>' . PHP_EOL;
        $xml .= '  </url>' . PHP_EOL;

        return $xml;
    }
}
