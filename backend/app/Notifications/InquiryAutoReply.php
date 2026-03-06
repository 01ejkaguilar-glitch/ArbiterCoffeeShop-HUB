<?php

namespace App\Notifications;

use App\Models\Inquiry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InquiryAutoReply extends Notification implements ShouldQueue
{
    use Queueable;

    protected $inquiry;

    /**
     * Create a new notification instance.
     */
    public function __construct(Inquiry $inquiry)
    {
        $this->inquiry = $inquiry;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $inquiryType = ucfirst(str_replace('_', ' ', $this->inquiry->type));
        
        $message = (new MailMessage)
            ->subject('Thank you for your interest in ' . $inquiryType)
            ->greeting('Hello ' . $this->inquiry->full_name . '!')
            ->line('Thank you for your interest in Arbiter Coffee\'s ' . strtolower($inquiryType) . ' service.');

        if ($this->inquiry->type === 'barista_training') {
            $message->line('We appreciate your enthusiasm about becoming a barista!')
                    ->line('Our training program offers:')
                    ->line('• Professional barista certification')
                    ->line('• Hands-on experience with specialty coffee')
                    ->line('• Expert instruction from certified trainers')
                    ->line('• Career placement assistance');
        } elseif ($this->inquiry->type === 'arbiter_express') {
            $message->line('Arbiter Express brings the coffee shop experience to your event!')
                    ->line('Our mobile coffee service includes:')
                    ->line('• Professional baristas and equipment')
                    ->line('• Premium specialty coffee selection')
                    ->line('• Customizable menu options')
                    ->line('• Complete setup and cleanup');
        }

        $message->line('Our team will review your inquiry and contact you within 24-48 hours to discuss the details.')
                ->line('If you have any urgent questions, please reach out to us:')
                ->line('📞 0977 278 8903')
                ->line('📧 arbitercoffee.ph@gmail.com')
                ->salutation('Best regards, The Arbiter Coffee Team');

        return $message;
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'inquiry_id' => $this->inquiry->id,
            'type' => $this->inquiry->type,
            'name' => $this->inquiry->full_name,
        ];
    }
}
