<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CategoryController extends BaseController
{
    /**
     * Display a listing of categories.
     */
    public function index(Request $request)
    {
        $query = Category::query();

        // Filter by active status
        $isActive = $request->input('is_active');
        if ($isActive !== null) {
            $query->where('is_active', $isActive);
        }

        // Include product count
        if ($request->get('with_products_count', false)) {
            $query->withCount('products');
        }

        // Sorting
        $query->orderBy('sort_order', 'asc');

        $categories = $query->get();

        return $this->sendResponse($categories, 'Categories retrieved successfully');
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        $category = Category::create($request->all());

        return $this->sendCreated($category, 'Category created successfully');
    }

    /**
     * Display the specified category.
     */
    public function show($id)
    {
        $category = Category::withCount('products')->find($id);

        if (!$category) {
            return $this->sendNotFound('Category not found');
        }

        return $this->sendResponse($category, 'Category retrieved successfully');
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return $this->sendNotFound('Category not found');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        $category->update($request->all());

        return $this->sendResponse($category, 'Category updated successfully');
    }

    /**
     * Remove the specified category.
     */
    public function destroy($id)
    {
        $category = Category::find($id);

        if (!$category) {
            return $this->sendNotFound('Category not found');
        }

        $category->delete();

        return $this->sendResponse(null, 'Category deleted successfully');
    }
}
