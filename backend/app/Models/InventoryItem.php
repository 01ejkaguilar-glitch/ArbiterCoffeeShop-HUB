<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string $type
 * @property float $quantity
 * @property string $unit
 * @property float $reorder_level
 * @property float|null $cost_per_unit
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\InventoryLog> $logs
 * @property-read int|null $logs_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryItem newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryItem newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryItem query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryItem whereCostPerUnit($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryItem whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryItem whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryItem whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryItem whereQuantity($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryItem whereReorderLevel($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryItem whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryItem whereUnit($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|InventoryItem whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class InventoryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'quantity',
        'unit',
        'reorder_level',
        'cost_per_unit',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'reorder_level' => 'decimal:2',
        'cost_per_unit' => 'decimal:2',
    ];

    /**
     * Get the inventory logs for this item
     */
    public function logs()
    {
        return $this->hasMany(InventoryLog::class);
    }

    /**
     * Check if item is low on stock
     */
    public function isLowStock()
    {
        return $this->quantity <= $this->reorder_level;
    }
}
