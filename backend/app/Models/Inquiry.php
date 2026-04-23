<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $type
 * @property string $full_name
 * @property string $email
 * @property string $phone
 * @property array<array-key, mixed> $details
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Inquiry arbiterExpress()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Inquiry baristaTraining()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Inquiry newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Inquiry newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Inquiry pending()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Inquiry query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Inquiry whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Inquiry whereDetails($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Inquiry whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Inquiry whereFullName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Inquiry whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Inquiry wherePhone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Inquiry whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Inquiry whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Inquiry whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Inquiry extends Model
{
    protected $fillable = [
        'type',
        'full_name',
        'email',
        'phone',
        'details',
        'status',
    ];

    protected $casts = [
        'details' => 'array',
    ];

    /**
     * Scope to get pending inquiries.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get barista training inquiries.
     */
    public function scopeBaristaTraining($query)
    {
        return $query->where('type', 'barista_training');
    }

    /**
     * Scope to get arbiter express inquiries.
     */
    public function scopeArbiterExpress($query)
    {
        return $query->where('type', 'arbiter_express');
    }
}
