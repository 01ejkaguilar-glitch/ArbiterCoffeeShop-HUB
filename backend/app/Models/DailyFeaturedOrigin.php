<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DailyFeaturedOrigin extends Model
{
    use HasFactory;

    protected $fillable = [
        'coffee_bean_id',
        'feature_date',
        'start_time',
        'end_time',
        'special_notes',
        'promotion_text',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'feature_date' => 'date',
        'is_active' => 'boolean',
    ];

    // Note: start_time and end_time are TIME fields, not DATETIME
    // They will be returned as strings in 'H:i:s' format

    /**
     * Get the coffee bean for this featured origin
     */
    public function coffeeBean()
    {
        return $this->belongsTo(CoffeeBean::class);
    }

    /**
     * Get the user who created this featured origin
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope to get active featured origins for today (time-filtered)
     * Only returns origins that are active at the current time
     */
    public function scopeActiveToday($query)
    {
        $currentTime = now()->format('H:i:s');
        
        return $query->where('feature_date', today())
                    ->where('is_active', true)
                    ->where(function ($q) use ($currentTime) {
                        $q->whereNull('start_time')
                          ->orWhereRaw('start_time <= ?', [$currentTime]);
                    })
                    ->where(function ($q) use ($currentTime) {
                        $q->whereNull('end_time')
                          ->orWhereRaw('end_time >= ?', [$currentTime]);
                    });
    }

    /**
     * Scope to get all featured origins scheduled for today (ignores time)
     * Returns all origins for today regardless of start/end time
     */
    public function scopeScheduledToday($query)
    {
        return $query->where('feature_date', today())
                    ->where('is_active', true);
    }

    /**
     * Scope to get featured origins by date
     */
    public function scopeByDate($query, $date)
    {
        return $query->where('feature_date', $date);
    }
}
