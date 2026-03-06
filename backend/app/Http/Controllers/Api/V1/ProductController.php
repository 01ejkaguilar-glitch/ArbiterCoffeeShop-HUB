<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class ProductController extends BaseController
{
    // Cache TTL in seconds
    const CACHE_TTL = 300; // 5 minutes
    const CACHE_TAG = 'products';
    
    /**
     * Clear the products cache (without tags for database cache compatibility).
     * Tracks cache keys in a registry so we can forget them specifically
     * instead of flushing the entire application cache.
     */
    private function clearProductsCache()
    {
        // Forget all tracked product list cache keys
        $registeredKeys = Cache::get('products_cache_keys', []);
        foreach ($registeredKeys as $key) {
            Cache::forget($key);
        }
        Cache::forget('products_cache_keys');

        // Forget individual product caches — use withTrashed() so soft-deleted
        // product IDs are included and their cache entries are also busted.
        $productIds = Product::withTrashed()->pluck('id');
        foreach ($productIds as $id) {
            Cache::forget('product_' . $id);
        }
    }

    /**
     * Cache with key tracking — remembers which keys were used.
     */
    private function rememberProduct($cacheKey, $ttl, $callback)
    {
        // Register this cache key
        $registeredKeys = Cache::get('products_cache_keys', []);
        if (!in_array($cacheKey, $registeredKeys)) {
            $registeredKeys[] = $cacheKey;
            Cache::put('products_cache_keys', $registeredKeys, $ttl * 2);
        }
        return Cache::remember($cacheKey, $ttl, $callback);
    }

    /**
     * Display a listing of products.
     */
    public function index(Request $request)
    {
        // Create cache key based on request parameters
        $cacheKey = 'products_list_' . md5(json_encode($request->all()));
        
        // Try to get from cache (without tags for database cache driver compatibility)
        $products = $this->rememberProduct($cacheKey, self::CACHE_TTL, function () use ($request) {
            $query = Product::with('category');

            // Filter by category
            $categoryId = $request->input('category_id');
            if ($categoryId !== null) {
                $query->where('category_id', $categoryId);
            }

            // Filter by availability
            $isAvailable = $request->input('is_available');
            if ($isAvailable !== null) {
                $query->where('is_available', $isAvailable);
            }

            // Search by name
            $search = $request->input('search');
            if ($search !== null) {
                $query->where('name', 'like', '%' . $search . '%');
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 15);
            return $query->paginate($perPage);
        });

        return $this->sendResponse($products, 'Products retrieved successfully');
    }

    /**
     * Admin product listing — bypasses cache, returns all products (no pagination
     * limit by default so the admin sees every record).
     */
    public function adminIndex(Request $request)
    {
        $query = Product::with('category');

        // Optional filters (same as public index)
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }
        if ($request->filled('is_available')) {
            $query->where('is_available', $request->input('is_available'));
        }
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->input('search') . '%');
        }

        $sortBy    = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginate with a larger default so the admin sees all products
        $perPage  = $request->get('per_page', 100);
        $products = $query->paginate($perPage);

        return $this->sendResponse($products, 'Products retrieved successfully');
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request)
    {
        \Log::info('Product store request data:', $request->all());

        // Prepare data for validation
        $data = $request->all();
        $data['category_id'] = (int) $data['category_id'];
        $data['stock_quantity'] = (int) $data['stock_quantity'];
        $data['price'] = (float) $data['price'];
        $data['is_available'] = $request->boolean('is_available', true);

        $validator = Validator::make($data, [
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'image_url' => 'nullable|string',
            'stock_quantity' => 'required|integer|min:0',
            'is_available' => 'boolean',
            'customization_options' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            \Log::error('Product validation failed:', $validator->errors()->toArray());
            return $this->sendValidationError($validator->errors()->toArray());
        }

        $productData = $request->except('image');

        // Handle image upload
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            $imagePath = $image->storeAs('products', $imageName, 'public');
            $productData['image_url'] = '/storage/' . $imagePath;
        }

        $product = Product::create($productData);
        $product->load('category');

        // Clear the products cache since we added a new product
        $this->clearProductsCache();

        return $this->sendCreated($product, 'Product created successfully');
    }

    /**
     * Display the specified product.
     */
    public function show($id)
    {
        $cacheKey = 'product_' . $id;
        
        $product = $this->rememberProduct($cacheKey, self::CACHE_TTL, function () use ($id) {
            return Product::with('category')->find($id);
        });

        if (!$product) {
            return $this->sendNotFound('Product not found');
        }

        return $this->sendResponse($product, 'Product retrieved successfully');
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return $this->sendNotFound('Product not found');
        }

        $validator = Validator::make($request->all(), [
            'category_id' => 'sometimes|exists:categories,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'image_url' => 'nullable|string',
            'stock_quantity' => 'sometimes|integer|min:0',
            'is_available' => 'boolean',
            'customization_options' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        $productData = $request->except('image');

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image_url && file_exists(public_path($product->image_url))) {
                unlink(public_path($product->image_url));
            }

            $image = $request->file('image');
            $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            $imagePath = $image->storeAs('products', $imageName, 'public');
            $productData['image_url'] = '/storage/' . $imagePath;
        }

        $product->update($productData);
        $product->load('category');

        // Clear the products cache since we updated a product
        $this->clearProductsCache();

        return $this->sendResponse($product, 'Product updated successfully');
    }

    /**
     * Remove the specified product.
     */
    public function destroy($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return $this->sendNotFound('Product not found');
        }

        $product->delete();

        // Clear the products cache since we deleted a product
        $this->clearProductsCache();

        return $this->sendResponse(null, 'Product deleted successfully');
    }

    /**
     * Get recipe instructions for a product
     */
    public function getRecipe($id)
    {
        try {
            $product = Product::find($id);

            if (!$product) {
                return $this->sendNotFound('Product not found');
            }

            $recipe = [
                'product_id' => $product->id,
                'name' => $product->name,
                'brewing_method' => $product->brewing_method,
                'recommended_water_temp' => $product->recommended_water_temp,
                'recommended_brew_time' => $product->recommended_brew_time,
                'coffee_to_water_ratio' => $product->coffee_to_water_ratio,
                'grind_size' => $product->grind_size,
                'steps' => $product->recipe_instructions ?? [],
            ];

            return $this->sendResponse($recipe, 'Recipe retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve recipe', 500, ['error' => $e->getMessage()]);
        }
    }
}
