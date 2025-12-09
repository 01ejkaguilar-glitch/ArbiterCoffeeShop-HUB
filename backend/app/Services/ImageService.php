<?php

namespace App\Services;

use Intervention\Image\ImageManager;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ImageService
{
    protected ImageManager $imageManager;

    public function __construct()
    {
        $this->imageManager = ImageManager::gd();
    }
    /**
     * Upload and process an image with automatic resizing and optimization
     *
     * @param UploadedFile $file
     * @param string $directory
     * @param array $sizes ['thumbnail' => [150, 150], 'medium' => [500, 500], 'large' => [1200, 1200]]
     * @return array ['original' => 'path', 'thumbnail' => 'path', 'medium' => 'path', 'large' => 'path']
     */
    public function uploadAndResize(UploadedFile $file, string $directory = 'images', array $sizes = []): array
    {
        // Default sizes if not provided
        $defaultSizes = [
            'thumbnail' => [150, 150],
            'medium' => [500, 500],
            'large' => [1200, 1200],
        ];

        $sizes = empty($sizes) ? $defaultSizes : $sizes;

        // Generate unique filename
        $filename = $this->generateUniqueFilename($file);
        $paths = [];

        // Process original image (optimized)
        $image = $this->imageManager->read($file);
        $originalPath = "{$directory}/original/{$filename}";

        // Save original with optimization
        $encoded = $image->encodeByMediaType(quality: 90);
        Storage::disk('public')->put($originalPath, $encoded);
        $paths['original'] = Storage::url($originalPath);

        // Create resized versions
        foreach ($sizes as $sizeName => $dimensions) {
            $resizedPath = "{$directory}/{$sizeName}/{$filename}";

            // Create resized image maintaining aspect ratio
            $resizedImage = $this->imageManager->read($file)->cover($dimensions[0], $dimensions[1]);
            $encoded = $resizedImage->encodeByMediaType(quality: 85);

            Storage::disk('public')->put($resizedPath, $encoded);
            $paths[$sizeName] = Storage::url($resizedPath);
        }

        return $paths;
    }

    /**
     * Upload a single optimized image without creating multiple sizes
     *
     * @param UploadedFile $file
     * @param string $directory
     * @param int|null $maxWidth
     * @param int|null $maxHeight
     * @param int $quality
     * @return string Image URL
     */
    public function uploadOptimized(
        UploadedFile $file,
        string $directory = 'images',
        ?int $maxWidth = 1200,
        ?int $maxHeight = 1200,
        int $quality = 85
    ): string {
        $filename = $this->generateUniqueFilename($file);
        $path = "{$directory}/{$filename}";

        $image = $this->imageManager->read($file);

        // Resize if dimensions are specified
        if ($maxWidth && $maxHeight) {
            $image->scale(width: $maxWidth, height: $maxHeight);
        }

        // Encode with specified quality
        $encoded = $image->encodeByMediaType(quality: $quality);
        Storage::disk('public')->put($path, $encoded);

        return Storage::url($path);
    }

    /**
     * Create a square thumbnail from an image
     *
     * @param UploadedFile $file
     * @param int $size
     * @param string $directory
     * @return string Thumbnail URL
     */
    public function createSquareThumbnail(UploadedFile $file, int $size = 200, string $directory = 'thumbnails'): string
    {
        $filename = $this->generateUniqueFilename($file);
        $path = "{$directory}/{$filename}";

        $image = $this->imageManager->read($file)->cover($size, $size);
        $encoded = $image->encodeByMediaType(quality: 80);

        Storage::disk('public')->put($path, $encoded);

        return Storage::url($path);
    }

    /**
     * Crop an image to specific dimensions
     *
     * @param UploadedFile $file
     * @param int $width
     * @param int $height
     * @param string $directory
     * @return string Image URL
     */
    public function cropImage(UploadedFile $file, int $width, int $height, string $directory = 'images'): string
    {
        $filename = $this->generateUniqueFilename($file);
        $path = "{$directory}/{$filename}";

        $image = $this->imageManager->read($file)->cover($width, $height);
        $encoded = $image->encodeByMediaType(quality: 85);

        Storage::disk('public')->put($path, $encoded);

        return Storage::url($path);
    }

    /**
     * Delete image and all its variants
     *
     * @param string $imageUrl Original image URL from database
     * @param array $sizes Size names to delete (e.g., ['thumbnail', 'medium', 'large'])
     * @return bool
     */
    public function deleteImage(string $imageUrl, array $sizes = []): bool
    {
        try {
            // Extract path from URL
            $path = str_replace('/storage/', '', parse_url($imageUrl, PHP_URL_PATH));

            // Delete original
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }

            // Delete variants
            if (!empty($sizes)) {
                $directory = dirname($path);
                $filename = basename($path);

                foreach ($sizes as $sizeName) {
                    $variantPath = str_replace('/original/', "/{$sizeName}/", $path);
                    if (Storage::disk('public')->exists($variantPath)) {
                        Storage::disk('public')->delete($variantPath);
                    }
                }
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Image deletion failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate a unique filename for the uploaded file
     *
     * @param UploadedFile $file
     * @return string
     */
    protected function generateUniqueFilename(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $baseName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $uniqueId = Str::random(8);
        $timestamp = time();

        return "{$baseName}-{$timestamp}-{$uniqueId}.{$extension}";
    }

    /**
     * Get image dimensions
     *
     * @param UploadedFile $file
     * @return array ['width' => int, 'height' => int]
     */
    public function getImageDimensions(UploadedFile $file): array
    {
        $image = $this->imageManager->read($file);

        return [
            'width' => $image->width(),
            'height' => $image->height(),
        ];
    }

    /**
     * Validate image file
     *
     * @param UploadedFile $file
     * @param int $maxSizeKB Maximum file size in KB
     * @param array $allowedTypes Allowed MIME types
     * @return bool
     */
    public function validateImage(UploadedFile $file, int $maxSizeKB = 5120, array $allowedTypes = []): bool
    {
        $defaultTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $allowedTypes = empty($allowedTypes) ? $defaultTypes : $allowedTypes;

        // Check file size
        if ($file->getSize() > ($maxSizeKB * 1024)) {
            return false;
        }

        // Check MIME type
        if (!in_array($file->getMimeType(), $allowedTypes)) {
            return false;
        }

        return true;
    }

    /**
     * Convert image to WebP format for better compression
     *
     * @param UploadedFile $file
     * @param string $directory
     * @param int $quality
     * @return string WebP image URL
     */
    public function convertToWebP(UploadedFile $file, string $directory = 'images', int $quality = 85): string
    {
        $filename = pathinfo($this->generateUniqueFilename($file), PATHINFO_FILENAME) . '.webp';
        $path = "{$directory}/{$filename}";

        $image = $this->imageManager->read($file);
        $encoded = $image->toWebp(quality: $quality);

        Storage::disk('public')->put($path, $encoded);

        return Storage::url($path);
    }
}
