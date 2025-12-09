<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Models\Inquiry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InquiryController extends BaseController
{
    /**
     * Store a barista training inquiry (public).
     */
    public function storeBaristaTraining(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'experience_level' => 'required|string',
            'preferred_schedule' => 'required|string',
            'background' => 'nullable|string',
            'motivation' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        $inquiry = Inquiry::create([
            'type' => 'barista_training',
            'full_name' => $request->input('full_name'),
            'email' => $request->input('email'),
            'phone' => $request->input('phone'),
            'details' => $request->only('experience_level', 'preferred_schedule', 'background', 'motivation'),
        ]);

        return $this->sendCreated($inquiry, 'Your training inquiry has been submitted successfully. We will contact you soon.');
    }

    /**
     * Store an Arbiter Express inquiry (public).
     */
    public function storeArbiterExpress(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'event_date' => 'required|date',
            'event_time' => 'required|string',
            'location' => 'required|string',
            'guest_count' => 'required|integer|min:1',
            'service_type' => 'required|string',
            'menu_preferences' => 'nullable|string',
            'budget_range' => 'nullable|string',
            'special_requests' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        $inquiry = Inquiry::create([
            'type' => 'arbiter_express',
            'full_name' => $request->input('full_name'),
            'email' => $request->input('email'),
            'phone' => $request->input('phone'),
            'details' => $request->only('event_date', 'event_time', 'location', 'guest_count', 'service_type', 'menu_preferences', 'budget_range', 'special_requests'),
        ]);

        return $this->sendCreated($inquiry, 'Your mobile coffee service inquiry has been submitted successfully. We will contact you soon.');
    }

    /**
     * Display a listing of inquiries (admin only).
     */
    public function index(Request $request)
    {
        $query = Inquiry::query();

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        // Sorting
        $query->orderBy('created_at', 'desc');

        // Pagination
        $perPage = $request->get('per_page', 15);
        $inquiries = $query->paginate($perPage);

        return $this->sendResponse($inquiries, 'Inquiries retrieved successfully');
    }

    /**
     * Display the specified inquiry (admin only).
     */
    public function show($id)
    {
        $inquiry = Inquiry::find($id);

        if (!$inquiry) {
            return $this->sendNotFound('Inquiry not found');
        }

        return $this->sendResponse($inquiry, 'Inquiry retrieved successfully');
    }

    /**
     * Update inquiry status (admin only).
     */
    public function update(Request $request, $id)
    {
        $inquiry = Inquiry::find($id);

        if (!$inquiry) {
            return $this->sendNotFound('Inquiry not found');
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,reviewed,approved,rejected',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        $inquiry->update($request->only('status'));

        return $this->sendResponse($inquiry, 'Inquiry status updated successfully');
    }

    /**
     * Remove the specified inquiry (admin only).
     */
    public function destroy($id)
    {
        $inquiry = Inquiry::find($id);

        if (!$inquiry) {
            return $this->sendNotFound('Inquiry not found');
        }

        $inquiry->delete();

        return $this->sendResponse(null, 'Inquiry deleted successfully');
    }
}
