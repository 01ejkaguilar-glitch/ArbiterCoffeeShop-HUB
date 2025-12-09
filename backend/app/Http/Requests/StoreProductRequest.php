<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->hasRole(['admin', 'super-admin']);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|min:2',
            'description' => 'required|string|max:2000',
            'price' => 'required|numeric|min:0|max:99999.99',
            'category_id' => 'required|exists:categories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
            'stock_quantity' => 'nullable|integer|min:0',
            'preparation_time' => 'nullable|integer|min:1|max:120', // minutes
            'ingredients' => 'nullable|array',
            'ingredients.*' => 'string|max:100',
            'allergens' => 'nullable|array',
            'allergens.*' => 'string|max:100',
            'calories' => 'nullable|integer|min:0|max:5000',
            'caffeine_content' => 'nullable|integer|min:0|max:1000', // mg
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Product name is required.',
            'name.min' => 'Product name must be at least 2 characters.',
            'description.required' => 'Product description is required.',
            'price.required' => 'Product price is required.',
            'price.min' => 'Price cannot be negative.',
            'price.max' => 'Price cannot exceed ₱99,999.99.',
            'category_id.required' => 'Product category is required.',
            'category_id.exists' => 'Selected category does not exist.',
            'image.image' => 'File must be an image.',
            'image.mimes' => 'Image must be in JPEG, PNG, JPG, GIF, or WebP format.',
            'image.max' => 'Image size cannot exceed 2MB.',
            'preparation_time.max' => 'Preparation time cannot exceed 120 minutes.',
        ];
    }
}
