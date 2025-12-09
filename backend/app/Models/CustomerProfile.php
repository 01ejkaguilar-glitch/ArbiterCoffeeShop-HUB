<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $user_id
 * @property string|null $phone
 * @property \Illuminate\Support\Carbon|null $birthday
 * @property string|null $address
 * @property array<array-key, mixed>|null $taste_preferences
 * @property string|null $profile_picture
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CustomerProfile newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CustomerProfile newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CustomerProfile query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CustomerProfile whereAddress($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CustomerProfile whereBirthday($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CustomerProfile whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CustomerProfile whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CustomerProfile wherePhone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CustomerProfile whereProfilePicture($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CustomerProfile whereTastePreferences($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CustomerProfile whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CustomerProfile whereUserId($value)
 * @mixin \Eloquent
 */
class CustomerProfile extends Model
{
    protected $fillable = [
        'user_id',
        'phone',
        'birthday',
        'address',
        'taste_preferences',
        'profile_picture',
    ];

    protected $casts = [
        'birthday' => 'date',
        'taste_preferences' => 'array',
    ];

    /**
     * Get the user that owns the profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
