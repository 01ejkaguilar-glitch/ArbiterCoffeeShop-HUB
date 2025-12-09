<?php

namespace Tests\Feature;

use App\Services\ImageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ImageService $imageService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->imageService = new ImageService();
        Storage::fake('public');
    }

    /** @test */
    public function it_can_upload_and_resize_image_with_multiple_sizes()
    {
        // Skip test if GD JPEG support is not available
        if (!function_exists('imagejpeg')) {
            $this->markTestSkipped('GD JPEG support not available');
        }

        $file = UploadedFile::fake()->image('product.jpg', 2000, 2000);

        $paths = $this->imageService->uploadAndResize($file, 'products', [
            'thumbnail' => [150, 150],
            'medium' => [500, 500],
            'large' => [1200, 1200],
        ]);

        $this->assertArrayHasKey('original', $paths);
        $this->assertArrayHasKey('thumbnail', $paths);
        $this->assertArrayHasKey('medium', $paths);
        $this->assertArrayHasKey('large', $paths);

        // Verify files exist in storage
        $this->assertTrue(Storage::disk('public')->exists('products/original/' . basename(parse_url($paths['original'], PHP_URL_PATH))));
        $this->assertTrue(Storage::disk('public')->exists('products/thumbnail/' . basename(parse_url($paths['thumbnail'], PHP_URL_PATH))));
    }

    /** @test */
    public function it_can_upload_optimized_single_image()
    {
        // Skip test if GD JPEG support is not available
        if (!function_exists('imagejpeg')) {
            $this->markTestSkipped('GD JPEG support not available');
        }

        $file = UploadedFile::fake()->image('coffee-bean.jpg', 1500, 1500);

        $url = $this->imageService->uploadOptimized($file, 'beans', 800, 800, 90);

        $this->assertNotEmpty($url);
        $this->assertStringContainsString('/storage/beans/', $url);

        // Verify file exists
        $path = str_replace('/storage/', '', parse_url($url, PHP_URL_PATH));
        $this->assertTrue(Storage::disk('public')->exists($path));
    }

    /** @test */
    public function it_can_create_square_thumbnail()
    {
        // Skip test if GD JPEG support is not available
        if (!function_exists('imagejpeg')) {
            $this->markTestSkipped('GD JPEG support not available');
        }

        $file = UploadedFile::fake()->image('avatar.jpg', 800, 600);

        $url = $this->imageService->createSquareThumbnail($file, 200, 'avatars');

        $this->assertNotEmpty($url);
        $this->assertStringContainsString('/storage/avatars/', $url);
    }

    /** @test */
    public function it_can_crop_image_to_specific_dimensions()
    {
        // Skip test if GD JPEG support is not available
        if (!function_exists('imagejpeg')) {
            $this->markTestSkipped('GD JPEG support not available');
        }

        $file = UploadedFile::fake()->image('banner.jpg', 2000, 1000);

        $url = $this->imageService->cropImage($file, 1200, 400, 'banners');

        $this->assertNotEmpty($url);
        $this->assertStringContainsString('/storage/banners/', $url);
    }

    /** @test */
    public function it_can_validate_image_file()
    {
        $validFile = UploadedFile::fake()->image('valid.jpg', 800, 600)->size(1024); // 1MB
        $tooLargeFile = UploadedFile::fake()->image('large.jpg', 4000, 4000)->size(10240); // 10MB
        $invalidType = UploadedFile::fake()->create('document.pdf', 100);

        $this->assertTrue($this->imageService->validateImage($validFile, 5120));
        $this->assertFalse($this->imageService->validateImage($tooLargeFile, 5120));
        $this->assertFalse($this->imageService->validateImage($invalidType, 5120));
    }

    /** @test */
    public function it_can_get_image_dimensions()
    {
        // Skip test if GD JPEG support is not available
        if (!function_exists('imagejpeg')) {
            $this->markTestSkipped('GD JPEG support not available');
        }

        $file = UploadedFile::fake()->image('test.jpg', 1920, 1080);

        $dimensions = $this->imageService->getImageDimensions($file);

        $this->assertEquals(1920, $dimensions['width']);
        $this->assertEquals(1080, $dimensions['height']);
    }

    /** @test */
    public function it_can_convert_image_to_webp()
    {
        // Skip test if GD JPEG support is not available
        if (!function_exists('imagejpeg')) {
            $this->markTestSkipped('GD JPEG support not available');
        }

        $file = UploadedFile::fake()->image('original.jpg', 1000, 1000);

        $url = $this->imageService->convertToWebP($file, 'products', 85);

        $this->assertNotEmpty($url);
        $this->assertStringContainsString('.webp', $url);

        $path = str_replace('/storage/', '', parse_url($url, PHP_URL_PATH));
        $this->assertTrue(Storage::disk('public')->exists($path));
    }

    /** @test */
    public function it_can_delete_image_and_variants()
    {
        // Skip test if GD JPEG support is not available
        if (!function_exists('imagejpeg')) {
            $this->markTestSkipped('GD JPEG support not available');
        }

        // Upload image with multiple sizes
        $file = UploadedFile::fake()->image('product.jpg', 1000, 1000);
        $paths = $this->imageService->uploadAndResize($file, 'products');

        // Verify files exist
        $originalPath = str_replace('/storage/', '', parse_url($paths['original'], PHP_URL_PATH));
        $this->assertTrue(Storage::disk('public')->exists($originalPath));

        // Delete image
        $result = $this->imageService->deleteImage($paths['original'], ['thumbnail', 'medium', 'large']);

        $this->assertTrue($result);
        $this->assertFalse(Storage::disk('public')->exists($originalPath));
    }

    /** @test */
    public function it_generates_unique_filenames()
    {
        // Skip test if GD JPEG support is not available
        if (!function_exists('imagejpeg')) {
            $this->markTestSkipped('GD JPEG support not available');
        }

        $file1 = UploadedFile::fake()->image('test.jpg');
        $file2 = UploadedFile::fake()->image('test.jpg');

        $url1 = $this->imageService->uploadOptimized($file1, 'images');
        $url2 = $this->imageService->uploadOptimized($file2, 'images');

        $this->assertNotEquals($url1, $url2);
    }

    /** @test */
    public function it_handles_different_image_formats()
    {
        // Skip test if GD JPEG support is not available
        if (!function_exists('imagejpeg')) {
            $this->markTestSkipped('GD JPEG support not available');
        }

        $jpegFile = UploadedFile::fake()->image('test.jpg');
        $pngFile = UploadedFile::fake()->image('test.png');
        $gifFile = UploadedFile::fake()->image('test.gif');

        $jpegUrl = $this->imageService->uploadOptimized($jpegFile, 'images');
        $pngUrl = $this->imageService->uploadOptimized($pngFile, 'images');
        $gifUrl = $this->imageService->uploadOptimized($gifFile, 'images');

        $this->assertNotEmpty($jpegUrl);
        $this->assertNotEmpty($pngUrl);
        $this->assertNotEmpty($gifUrl);
    }
}
