<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'order_type' => 'required|in:dine-in,take-out,delivery',
            'items' => 'required|array|min:1|max:50',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:99',
            'items.*.special_instructions' => 'nullable|string|max:500',
            'payment_method' => 'required|in:cash,gcash,maya,card',
            'delivery_address_id' => 'nullable|exists:addresses,id',
            'scheduled_time' => 'nullable|date|after:now',
            'notes' => 'nullable|string|max:1000',
            // 'coupon_code' => 'nullable|string|exists:coupons,code',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'items.required' => 'At least one item is required for the order.',
            'items.*.product_id.required' => 'Product ID is required for each item.',
            'items.*.product_id.exists' => 'Selected product does not exist.',
            'items.*.quantity.min' => 'Quantity must be at least 1.',
            'items.*.quantity.max' => 'Quantity cannot exceed 99.',
            'delivery_address_id.required_if' => 'Delivery address is required for delivery orders.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'order_type' => 'order type',
            'delivery_address_id' => 'delivery address',
            'scheduled_time' => 'scheduled time',
            'coupon_code' => 'coupon code',
        ];
    }
}
