<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ProcessOrderNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $order;
    public $notificationType;

    /**
     * Create a new job instance.
     */
    public function __construct(Order $order, $notificationType = 'created')
    {
        $this->order = $order;
        $this->notificationType = $notificationType;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $order = $this->order->load(['user', 'orderItems.product']);
            
            // Log the notification
            Log::channel('orders')->info("Order notification sent", [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'type' => $this->notificationType,
                'customer' => $order->user->email,
            ]);

            // In production, send actual email
            // Mail::to($order->user->email)->send(new OrderNotificationMail($order, $this->notificationType));
            
        } catch (\Exception $e) {
            Log::error("Failed to process order notification", [
                'order_id' => $this->order->id,
                'error' => $e->getMessage(),
            ]);
            
            // Optionally retry
            if ($this->attempts() < 3) {
                $this->release(60); // Retry after 60 seconds
            }
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Order notification job failed permanently", [
            'order_id' => $this->order->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
