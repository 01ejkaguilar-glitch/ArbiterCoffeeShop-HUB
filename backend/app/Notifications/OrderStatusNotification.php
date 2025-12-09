<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The order instance.
     *
     * @var Order
     */
    public $order;

    /**
     * The notification type.
     *
     * @var string
     */
    public $notificationType;

    /**
     * Create a new notification instance.
     */
    public function __construct(Order $order, string $notificationType = 'status_update')
    {
        $this->order = $order;
        $this->notificationType = $notificationType;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $orderUrl = env('FRONTEND_URL', 'http://localhost:3000') . '/customer/orders/' . $this->order->id;

        $message = (new MailMessage)
            ->subject($this->getSubject())
            ->greeting('Hello ' . $notifiable->name . '!');

        switch ($this->notificationType) {
            case 'order_created':
                $message->line('Thank you for your order!')
                    ->line('Your order #' . $this->order->order_number . ' has been successfully placed.')
                    ->line('Order Details:')
                    ->line('- Order Type: ' . ucfirst($this->order->order_type))
                    ->line('- Total Amount: ₱' . number_format((float)$this->order->total_amount, 2))
                    ->line('- Payment Method: ' . strtoupper($this->order->payment_method))
                    ->line('We will notify you once your order is being prepared.');
                break;

            case 'status_update':
                $message->line('Your order status has been updated.')
                    ->line('Order #' . $this->order->order_number . ' is now: ' . strtoupper($this->order->status))
                    ->line($this->getStatusMessage());
                break;

            case 'order_ready':
                $message->line('Great news! Your order is ready!')
                    ->line('Order #' . $this->order->order_number . ' is now ready for pickup.')
                    ->line('Please proceed to the counter to collect your order.');
                break;

            case 'order_completed':
                $message->line('Your order has been completed!')
                    ->line('Thank you for choosing Arbiter Coffee Hub.')
                    ->line('We hope you enjoyed your coffee experience.')
                    ->line('Order #' . $this->order->order_number)
                    ->line('Total: ₱' . number_format((float)$this->order->total_amount, 2));
                break;

            case 'order_cancelled':
                $message->line('Your order has been cancelled.')
                    ->line('Order #' . $this->order->order_number . ' has been cancelled.')
                    ->line('If you did not request this cancellation, please contact us immediately.');
                break;

            default:
                $message->line('Your order #' . $this->order->order_number . ' has been updated.');
        }

        $message->action('View Order Details', $orderUrl)
            ->salutation('Best regards, Arbiter Coffee Hub Team');

        return $message;
    }

    /**
     * Get the subject line for the notification.
     *
     * @return string
     */
    protected function getSubject(): string
    {
        switch ($this->notificationType) {
            case 'order_created':
                return 'Order Confirmation - ' . $this->order->order_number;
            case 'order_ready':
                return 'Order Ready - ' . $this->order->order_number;
            case 'order_completed':
                return 'Order Completed - ' . $this->order->order_number;
            case 'order_cancelled':
                return 'Order Cancelled - ' . $this->order->order_number;
            default:
                return 'Order Status Update - ' . $this->order->order_number;
        }
    }

    /**
     * Get the status-specific message.
     *
     * @return string
     */
    protected function getStatusMessage(): string
    {
        switch ($this->order->status) {
            case 'pending':
                return 'Your order is waiting to be processed.';
            case 'preparing':
                return 'Our baristas are preparing your order with care.';
            case 'ready':
                return 'Your order is ready for pickup!';
            case 'completed':
                return 'Your order has been completed. Thank you!';
            case 'cancelled':
                return 'Your order has been cancelled.';
            default:
                return 'Your order status has changed.';
        }
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'status' => $this->order->status,
            'type' => $this->notificationType,
            'total_amount' => $this->order->total_amount,
        ];
    }
}
