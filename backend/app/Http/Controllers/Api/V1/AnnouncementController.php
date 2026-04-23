<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AnnouncementController extends BaseController
{
    /**
     * Display a listing of published announcements (public).
     */
    public function index(Request $request)
    {
        $query = Announcement::published()->orderBy('published_at', 'desc');

        // Filter by category
        $category = $request->input('category');
        if ($category !== null) {
            $query->where('category', $category);
        }

        // Search
        $search = $request->input('search');
        if ($search !== null) {
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhere('content', 'like', '%' . $search . '%');
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 10);
        $announcements = $query->paginate($perPage);

        return $this->sendResponse($announcements, 'Announcements retrieved successfully');
    }

    /**
     * Display the specified announcement (public).
     */
    public function show($id)
    {
        $announcement = Announcement::published()->find($id);

        if (!$announcement) {
            return $this->sendNotFound('Announcement not found');
        }

        return $this->sendResponse($announcement, 'Announcement retrieved successfully');
    }

    /**
     * Store a newly created announcement (admin only).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|in:promo,event,news,update',
            'featured_image' => 'nullable|string',
            'is_published' => 'boolean',
            'published_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        $data = $request->all();
        $data['created_by'] = $request->user()->id ?? null;

        $announcement = Announcement::create($data);

        return $this->sendCreated($announcement, 'Announcement created successfully');
    }

    /**
     * Update the specified announcement (admin only).
     */
    public function update(Request $request, $id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return $this->sendNotFound('Announcement not found');
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'category' => 'sometimes|in:promo,event,news,update',
            'featured_image' => 'nullable|string',
            'is_published' => 'boolean',
            'published_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        $announcement->update($request->all());

        return $this->sendResponse($announcement, 'Announcement updated successfully');
    }

    /**
     * Remove the specified announcement (admin only).
     */
    public function destroy($id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return $this->sendNotFound('Announcement not found');
        }

        $announcement->delete();

        return $this->sendResponse(null, 'Announcement deleted successfully');
    }
}
