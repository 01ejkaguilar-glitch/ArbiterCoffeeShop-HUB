<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TasteProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'favorite_roast',
        'flavor_preferences',
    ];

    protected $casts = [
        'flavor_preferences' => 'array',
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }
}
