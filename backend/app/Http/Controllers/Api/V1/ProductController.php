<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductController extends BaseController
{
    /**
     * Clear the products API cache
     */
    private function clearProductsCache()
    {
        // Generate the same cache key as the CacheResponse middleware
        $url = 'http://localhost:8000/api/v1/products';
        $queryParams = [];
        ksort($queryParams);
        $cacheKey = 'api_cache:' . md5($url . serialize($queryParams));
        
        \Cache::forget($cacheKey);
    }

    /**
     * Display a listing of products.
     */
    public function index(Request $request)
    {
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
        $product = Product::with('category')->find($id);

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
}
