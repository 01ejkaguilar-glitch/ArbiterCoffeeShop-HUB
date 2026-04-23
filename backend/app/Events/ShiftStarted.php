<?php

namespace App\Events;

use App\Models\Shift;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ShiftStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $shift;
    public $employee;

    /**
     * Create a new event instance.
     */
    public function __construct(Shift $shift)
    {
        $this->shift = $shift;
        $this->employee = $shift->employee;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('employee.' . $this->employee->id),
            new Channel('shifts'),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'employee_id' => $this->employee->id,
            'shift_id' => $this->shift->id,
            'role' => $this->shift->position,
            'position' => $this->shift->position,
            'start_time' => $this->shift->start_time,
            'end_time' => $this->shift->end_time,
            'date' => $this->shift->date,
            'employee_name' => $this->employee->user->name ?? 'Unknown',
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'shift.started';
    }
}
