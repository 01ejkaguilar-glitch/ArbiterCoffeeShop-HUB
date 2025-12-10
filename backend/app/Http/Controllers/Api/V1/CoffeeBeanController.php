<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Models\CoffeeBean;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CoffeeBeanController extends BaseController
{
    /**
     * Display a listing of coffee beans.
     */
    public function index(Request $request)
    {
        $query = CoffeeBean::query();

        // Filter by featured status
        if ($request->has('is_featured')) {
            $query->where('is_featured', $request->boolean('is_featured'));
        }

        // Filter by origin country
        if ($request->has('origin_country')) {
            $query->where('origin_country', $request->input('origin_country'));
        }

        // Search
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('origin_country', 'like', "%{$search}%")
                  ->orWhere('region', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $beans = $query->paginate($perPage);

        return $this->sendResponse($beans, 'Coffee beans retrieved successfully');
    }

    /**
     * Get today's featured coffee beans (public).
     */
    public function featured()
    {
        $featuredBeans = CoffeeBean::featured()
            ->take(2)
            ->get();

        return $this->sendResponse($featuredBeans, 'Featured coffee beans retrieved successfully');
    }

    /**
     * Store a newly created coffee bean.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'origin_country' => 'required|string|max:255',
            'region' => 'nullable|string|max:255',
            'elevation' => 'nullable|string|max:255',
            'processing_method' => 'nullable|string|max:255',
            'variety' => 'nullable|string|max:255',
            'tasting_notes' => 'nullable|string',
            'producer' => 'nullable|string|max:255',
            'stock_quantity' => 'required|integer|min:0',
            'is_featured' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'image_url' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        $data = $request->except('image');
        
        // Handle file upload
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move(public_path('storage/coffee-beans'), $imageName);
            $data['image_url'] = '/storage/coffee-beans/' . $imageName;
        }

        $bean = CoffeeBean::create($data);

        return $this->sendCreated($bean, 'Coffee bean created successfully');
    }

    /**
     * Display the specified coffee bean.
     */
    public function show($id)
    {
        $bean = CoffeeBean::find($id);

        if (!$bean) {
            return $this->sendNotFound('Coffee bean not found');
        }

        return $this->sendResponse($bean, 'Coffee bean retrieved successfully');
    }

    /**
     * Update the specified coffee bean.
     */
    public function update(Request $request, $id)
    {
        $bean = CoffeeBean::find($id);

        if (!$bean) {
            return $this->sendNotFound('Coffee bean not found');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'origin_country' => 'sometimes|string|max:255',
            'region' => 'nullable|string|max:255',
            'elevation' => 'nullable|string|max:255',
            'processing_method' => 'nullable|string|max:255',
            'variety' => 'nullable|string|max:255',
            'tasting_notes' => 'nullable|string',
            'producer' => 'nullable|string|max:255',
            'stock_quantity' => 'sometimes|integer|min:0',
            'is_featured' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'image_url' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        $data = $request->except('image');
        
        // Handle file upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($bean->image_url && file_exists(public_path($bean->image_url))) {
                unlink(public_path($bean->image_url));
            }
            
            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move(public_path('storage/coffee-beans'), $imageName);
            $data['image_url'] = '/storage/coffee-beans/' . $imageName;
        }

        $bean->update($data);

        return $this->sendResponse($bean, 'Coffee bean updated successfully');
    }

    /**
     * Remove the specified coffee bean.
     */
    public function destroy($id)
    {
        $bean = CoffeeBean::find($id);

        if (!$bean) {
            return $this->sendNotFound('Coffee bean not found');
        }

        $bean->delete();

        return $this->sendResponse(null, 'Coffee bean deleted successfully');
    }
}
