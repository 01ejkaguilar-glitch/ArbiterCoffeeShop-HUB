<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property int $employee_id
 * @property \Illuminate\Support\Carbon $date
 * @property \Illuminate\Support\Carbon $start_time
 * @property \Illuminate\Support\Carbon $end_time
 * @property string|null $position
 * @property string|null $role
 * @property string $status
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Employee $employee
 * @property-read mixed $duration
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Shift newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Shift newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Shift query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Shift whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Shift whereDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Shift whereEmployeeId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Shift whereEndTime($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Shift whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Shift whereNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Shift wherePosition($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Shift whereStartTime($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Shift whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Shift whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'date',
        'start_time',
        'end_time',
        'position',
        'status',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    /**
     * Get the employee for this shift
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Calculate shift duration in hours
     */
    public function getDurationAttribute()
    {
        if ($this->start_time && $this->end_time) {
            return $this->start_time->diffInHours($this->end_time, true);
        }
        return 0;
    }
}
