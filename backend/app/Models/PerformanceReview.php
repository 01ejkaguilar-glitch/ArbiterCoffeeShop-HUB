<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property int $employee_id
 * @property int $reviewer_id
 * @property \Illuminate\Support\Carbon $review_period_start
 * @property \Illuminate\Support\Carbon $review_period_end
 * @property numeric $speed_score
 * @property numeric $quality_score
 * @property numeric $attendance_score
 * @property numeric $teamwork_score
 * @property numeric $customer_service_score
 * @property numeric $overall_score
 * @property string|null $strengths
 * @property string|null $areas_for_improvement
 * @property string|null $goals
 * @property string|null $comments
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Employee $employee
 * @property-read \App\Models\User $reviewer
 * @method static \Database\Factories\PerformanceReviewFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereAreasForImprovement($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereAttendanceScore($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereComments($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereCustomerServiceScore($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereEmployeeId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereGoals($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereOverallScore($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereQualityScore($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereReviewPeriodEnd($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereReviewPeriodStart($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereReviewerId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereSpeedScore($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereStrengths($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereTeamworkScore($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PerformanceReview whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class PerformanceReview extends Model
{
    use HasFactory;
    protected $fillable = [
        'employee_id',
        'reviewer_id',
        'review_period_start',
        'review_period_end',
        'speed_score',
        'quality_score',
        'attendance_score',
        'teamwork_score',
        'customer_service_score',
        'overall_score',
        'strengths',
        'areas_for_improvement',
        'goals',
        'comments',
    ];

    protected $casts = [
        'review_period_start' => 'date',
        'review_period_end' => 'date',
        'speed_score' => 'decimal:2',
        'quality_score' => 'decimal:2',
        'attendance_score' => 'decimal:2',
        'teamwork_score' => 'decimal:2',
        'customer_service_score' => 'decimal:2',
        'overall_score' => 'decimal:2',
    ];

    /**
     * Get the employee being reviewed
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the user who conducted the review
     */
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
