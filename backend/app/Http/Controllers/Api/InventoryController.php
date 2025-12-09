<?php

namespace App\Http\Controllers\Api;

use App\Models\InventoryItem;
use App\Models\InventoryLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InventoryController extends BaseController
{
    /**
     * Get all inventory items
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = InventoryItem::query();

            // Filter by type
            $type = $request->input('type');
            if ($type !== null) {
                $query->where('type', $type);
            }

            // Filter by low stock
            if ($request->boolean('low_stock')) {
                $query->whereRaw('quantity <= reorder_level');
            }

            $items = $query->orderBy('name', 'asc')->paginate(50);

            return $this->sendResponse($items, 'Inventory items retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve inventory items', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get single inventory item
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $item = InventoryItem::with(['logs' => function($query) {
                $query->orderBy('created_at', 'desc')->limit(10);
            }])->findOrFail($id);

            return $this->sendResponse($item, 'Inventory item retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Inventory item not found', 404, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Create new inventory item
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'type' => 'required|in:beans,syrup,milk,supplies,other',
                'quantity' => 'required|numeric|min:0',
                'unit' => 'required|string|max:50',
                'reorder_level' => 'required|numeric|min:0',
                'cost_per_unit' => 'nullable|numeric|min:0',
            ]);

            $item = InventoryItem::create($request->all());

            // Log initial stock
            InventoryLog::create([
                'inventory_item_id' => $item->id,
                'type' => 'restock',
                'quantity' => $item->quantity,
                'notes' => 'Initial stock',
                'user_id' => Auth::id(),
            ]);

            return $this->sendResponse($item, 'Inventory item created successfully', 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to create inventory item', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update inventory item
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'name' => 'string|max:255',
                'type' => 'in:beans,syrup,milk,supplies,other',
                'reorder_level' => 'numeric|min:0',
                'cost_per_unit' => 'nullable|numeric|min:0',
            ]);

            $item = InventoryItem::findOrFail($id);
            $item->update($request->except(['quantity', 'unit'])); // Quantity changes through logs only

            return $this->sendResponse($item, 'Inventory item updated successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to update inventory item', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Delete inventory item
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $item = InventoryItem::findOrFail($id);
            $item->delete();

            return $this->sendResponse(null, 'Inventory item deleted successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to delete inventory item', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Adjust inventory quantity (restock or usage)
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function adjustStock(Request $request, $id)
    {
        try {
            $request->validate([
                'type' => 'required|in:restock,usage,wastage,adjustment',
                'quantity' => 'required|numeric',
                'notes' => 'nullable|string|max:500',
            ]);

            DB::beginTransaction();

            $item = InventoryItem::findOrFail($id);
            $oldQuantity = $item->quantity;

            $type = $request->input('type');
            $quantity = $request->input('quantity');

            // Calculate new quantity based on type
            if ($type === 'restock' || $type === 'adjustment') {
                $newQuantity = $oldQuantity + abs($quantity);
            } else {
                $newQuantity = $oldQuantity - abs($quantity);
            }

            if ($newQuantity < 0) {
                DB::rollBack();
                return $this->sendError('Insufficient stock', 400);
            }

            $item->quantity = $newQuantity;
            $item->save();

            // Create log
            InventoryLog::create([
                'inventory_item_id' => $item->id,
                'type' => $type,
                'quantity' => abs($quantity),
                'notes' => $request->input('notes'),
                'user_id' => Auth::id(),
            ]);

            DB::commit();

            $item->load(['logs' => function($query) {
                $query->orderBy('created_at', 'desc')->limit(10);
            }]);

            return $this->sendResponse($item, 'Stock adjusted successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to adjust stock', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get low stock items
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getLowStock()
    {
        try {
            $items = InventoryItem::whereRaw('quantity <= reorder_level')
                ->orderBy('quantity', 'asc')
                ->get();

            return $this->sendResponse($items, 'Low stock items retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve low stock items', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get inventory logs
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getLogs(Request $request)
    {
        try {
            $query = InventoryLog::with(['inventoryItem', 'user']);

            // Filter by item
            $itemId = $request->input('item_id');
            if ($itemId !== null) {
                $query->where('inventory_item_id', $itemId);
            }

            // Filter by type
            $type = $request->input('type');
            if ($type !== null) {
                $query->where('type', $type);
            }

            // Filter by date range
            $startDate = $request->input('start_date');
            if ($startDate !== null) {
                $query->whereDate('created_at', '>=', $startDate);
            }
            $endDate = $request->input('end_date');
            if ($endDate !== null) {
                $query->whereDate('created_at', '<=', $endDate);
            }

            $logs = $query->orderBy('created_at', 'desc')->paginate(50);

            return $this->sendResponse($logs, 'Inventory logs retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve inventory logs', 500, ['error' => $e->getMessage()]);
        }
    }
}
