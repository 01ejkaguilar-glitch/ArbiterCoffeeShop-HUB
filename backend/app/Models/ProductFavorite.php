<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductFavorite extends Model
{
    protected $fillable = [
        'user_id',
        'product_id',
    ];

    /**
     * Get the user that owns the favorite.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the product that is favorited.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
