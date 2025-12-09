<?php

namespace Tests\Unit\Services;

use App\Services\ImageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_can_create_image_service_instance()
    {
        $service = new ImageService();
        $this->assertInstanceOf(ImageService::class, $service);
    }

    public function test_service_has_required_methods()
    {
        $service = new ImageService();
        $this->assertTrue(method_exists($service, 'uploadAndResize'));
        $this->assertTrue(method_exists($service, 'uploadOptimized'));
        $this->assertTrue(method_exists($service, 'createSquareThumbnail'));
        $this->assertTrue(method_exists($service, 'cropImage'));
        $this->assertTrue(method_exists($service, 'deleteImage'));
        $this->assertTrue(method_exists($service, 'validateImage'));
    }

    public function test_validate_image_returns_false_for_invalid_file()
    {
        $service = new ImageService();
        $invalidFile = UploadedFile::fake()->create('test.txt', 100);

        $result = $service->validateImage($invalidFile);
        $this->assertFalse($result);
    }

    public function test_validate_image_file_size()
    {
        $service = new ImageService();

        // Create a large file (over 5MB default limit)
        $largeFile = UploadedFile::fake()->create('large.jpg', 6000); // 6MB

        $result = $service->validateImage($largeFile);
        $this->assertFalse($result);
    }
}
