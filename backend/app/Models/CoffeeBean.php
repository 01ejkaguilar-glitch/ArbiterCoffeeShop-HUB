<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $name
 * @property string $origin_country
 * @property string|null $region
 * @property string|null $elevation
 * @property string|null $processing_method
 * @property string|null $variety
 * @property string|null $tasting_notes
 * @property string|null $producer
 * @property int $stock_quantity
 * @property bool $is_featured
 * @property string|null $image_url
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean featured()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean onlyTrashed()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean whereElevation($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean whereImageUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean whereIsFeatured($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean whereOriginCountry($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean whereProcessingMethod($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean whereProducer($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean whereRegion($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean whereStockQuantity($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean whereTastingNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean whereVariety($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean withTrashed(bool $withTrashed = true)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CoffeeBean withoutTrashed()
 * @mixin \Eloquent
 */
class CoffeeBean extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'origin_country',
        'region',
        'elevation',
        'processing_method',
        'variety',
        'tasting_notes',
        'producer',
        'stock_quantity',
        'is_featured',
        'image_url',
    ];

    protected $casts = [
        'stock_quantity' => 'integer',
        'is_featured' => 'boolean',
    ];

    /**
     * Scope to get featured beans.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }
}
