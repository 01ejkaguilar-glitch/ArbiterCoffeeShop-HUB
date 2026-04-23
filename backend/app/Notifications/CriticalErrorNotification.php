<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\SlackMessage;
use Illuminate\Notifications\Notification;
use Throwable;

class CriticalErrorNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Throwable $exception;
    protected array $context;

    /**
     * Create a new notification instance.
     */
    public function __construct(Throwable $exception, array $context = [])
    {
        $this->exception = $exception;
        $this->context = $context;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['mail'];

        // Add Slack if webhook is configured
        if (config('services.slack.webhook')) {
            $channels[] = 'slack';
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $subject = "🚨 CRITICAL ERROR: " . get_class($this->exception) . " in " . config('app.name');

        return (new MailMessage)
            ->subject($subject)
            ->greeting('🚨 Critical System Error Detected')
            ->line('A critical error has occurred in your application:')
            ->line('**Error:** ' . get_class($this->exception))
            ->line('**Message:** ' . $this->exception->getMessage())
            ->line('**File:** ' . $this->exception->getFile() . ':' . $this->exception->getLine())
            ->when(isset($this->context['request_id']), function ($mail) {
                return $mail->line('**Request ID:** ' . $this->context['request_id']);
            })
            ->when(isset($this->context['user_id']), function ($mail) {
                return $mail->line('**User ID:** ' . $this->context['user_id']);
            })
            ->when(isset($this->context['url']), function ($mail) {
                return $mail->line('**URL:** ' . $this->context['url']);
            })
            ->line('**Environment:** ' . config('app.env'))
            ->line('**Time:** ' . now()->toDateTimeString())
            ->action('View Application Logs', url('/admin/logs'))
            ->line('Please investigate this issue immediately.')
            ->salutation('Arbiter Coffee Hub System Monitor');
    }

    /**
     * Get the Slack representation of the notification.
     */
    public function toSlack(object $notifiable): SlackMessage
    {
        $message = "🚨 *CRITICAL ERROR*\n";
        $message .= "• *Error:* " . get_class($this->exception) . "\n";
        $message .= "• *Message:* " . $this->exception->getMessage() . "\n";
        $message .= "• *File:* " . $this->exception->getFile() . ":" . $this->exception->getLine() . "\n";

        if (isset($this->context['request_id'])) {
            $message .= "• *Request ID:* " . $this->context['request_id'] . "\n";
        }

        if (isset($this->context['url'])) {
            $message .= "• *URL:* " . $this->context['url'] . "\n";
        }

        $message .= "• *Environment:* " . config('app.env') . "\n";
        $message .= "• *Time:* " . now()->toDateTimeString();

        return (new SlackMessage)
            ->error()
            ->content('🚨 Critical System Error Detected')
            ->attachment(function ($attachment) use ($message) {
                $attachment->title('Error Details')
                    ->content($message)
                    ->color('danger');
            });
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'exception_class' => get_class($this->exception),
            'message' => $this->exception->getMessage(),
            'file' => $this->exception->getFile(),
            'line' => $this->exception->getLine(),
            'context' => $this->context,
            'environment' => config('app.env'),
            'timestamp' => now()->toISOString(),
        ];
    }
}
