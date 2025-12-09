<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Models\Contact;
use App\Http\Requests\StoreContactRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ContactController extends BaseController
{
    /**
     * Store a contact form submission (public).
     */
    public function store(StoreContactRequest $request)
    {
        $contact = Contact::create($request->validated());

        // TODO: Send email notification to admin
        // TODO: Send auto-reply email to customer

        return $this->sendCreated($contact, 'Your message has been sent successfully. We will get back to you soon.');
    }

    /**
     * Display a listing of contacts (admin only).
     */
    public function index(Request $request)
    {
        $query = Contact::query();

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by inquiry type
        if ($request->has('inquiry_type')) {
            $query->where('inquiry_type', $request->input('inquiry_type'));
        }

        // Sorting
        $query->orderBy('created_at', 'desc');

        // Pagination
        $perPage = $request->get('per_page', 15);
        $contacts = $query->paginate($perPage);

        return $this->sendResponse($contacts, 'Contacts retrieved successfully');
    }

    /**
     * Display the specified contact (admin only).
     */
    public function show($id)
    {
        $contact = Contact::find($id);

        if (!$contact) {
            return $this->sendNotFound('Contact not found');
        }

        // Mark as read
        if ($contact->status === 'pending') {
            $contact->update(['status' => 'read']);
        }

        return $this->sendResponse($contact, 'Contact retrieved successfully');
    }

    /**
     * Update contact status (admin only).
     */
    public function update(Request $request, $id)
    {
        $contact = Contact::find($id);

        if (!$contact) {
            return $this->sendNotFound('Contact not found');
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,read,responded',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        $contact->update($request->only('status'));

        return $this->sendResponse($contact, 'Contact status updated successfully');
    }

    /**
     * Remove the specified contact (admin only).
     */
    public function destroy($id)
    {
        $contact = Contact::find($id);

        if (!$contact) {
            return $this->sendNotFound('Contact not found');
        }

        $contact->delete();

        return $this->sendResponse(null, 'Contact deleted successfully');
    }
}
