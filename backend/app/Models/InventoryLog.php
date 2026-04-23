<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property-read \App\Models\InventoryItem|null $inventoryItem
 * @property-read \App\Models\User|null $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryLog newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryLog newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryLog query()
 * @property int $id
 * @property int $inventory_item_id
 * @property string $type
 * @property numeric $quantity
 * @property string|null $notes
 * @property int|null $user_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryLog whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryLog whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryLog whereInventoryItemId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryLog whereNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryLog whereQuantity($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryLog whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryLog whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryLog whereUserId($value)
 * @mixin \Eloquent
 */
class InventoryLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_item_id',
        'type',
        'quantity',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    /**
     * Get the inventory item that owns this log
     */
    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }

    /**
     * Get the user who made this log entry
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
