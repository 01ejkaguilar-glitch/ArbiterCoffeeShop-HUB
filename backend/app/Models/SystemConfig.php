<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $key
 * @property array<array-key, mixed> $value
 * @property string $type
 * @property string|null $description
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemConfig newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemConfig newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemConfig query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemConfig whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemConfig whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemConfig whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemConfig whereKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemConfig whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemConfig whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemConfig whereValue($value)
 * @mixin \Eloquent
 */
class SystemConfig extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'key',
        'value',
        'type',
        'description',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'value' => 'array',
    ];

    /**
     * Get a config value by key
     * 
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function getValue($key, $default = null)
    {
        $config = self::where('key', $key)->first();
        return $config ? $config->value : $default;
    }

    /**
     * Set a config value
     * 
     * @param string $key
     * @param mixed $value
     * @param string $type
     * @param string $description
     * @return SystemConfig
     */
    public static function setValue($key, $value, $type = 'json', $description = '')
    {
        return self::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'type' => $type,
                'description' => $description,
            ]
        );
    }
}
