<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreContactRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Public contact form
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|min:2',
            'email' => 'required|string|email|max:255',
            'phone' => 'nullable|string|regex:/^(\+63|0)[0-9]{10}$/',
            'subject' => 'nullable|string|max:255|min:5',
            'message' => 'required|string|max:2000|min:10',
            'inquiry_type' => 'required|in:general,catering,training,feedback',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Your name is required.',
            'name.min' => 'Name must be at least 2 characters.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'phone.regex' => 'Please enter a valid Philippine phone number.',
            'subject.required' => 'Subject is required.',
            'subject.min' => 'Subject must be at least 5 characters.',
            'message.required' => 'Message is required.',
            'message.min' => 'Message must be at least 10 characters.',
            'message.max' => 'Message cannot exceed 2000 characters.',
            'inquiry_type.required' => 'Please select an inquiry type.',
            'inquiry_type.in' => 'Invalid inquiry type selected.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'inquiry_type' => 'inquiry type',
        ];
    }
}
