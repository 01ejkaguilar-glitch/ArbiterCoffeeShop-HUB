<?php

namespace App\Notifications;

use App\Models\Inquiry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewInquirySubmission extends Notification implements ShouldQueue
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
            ->subject('New ' . $inquiryType . ' Inquiry')
            ->greeting('Hello Admin!')
            ->line('You have received a new ' . strtolower($inquiryType) . ' inquiry.')
            ->line('**Name:** ' . $this->inquiry->full_name)
            ->line('**Email:** ' . $this->inquiry->email)
            ->line('**Phone:** ' . $this->inquiry->phone);

        // Add type-specific details
        if ($this->inquiry->type === 'barista_training') {
            $details = $this->inquiry->details;
            $message->line('**Experience Level:** ' . ($details['experience_level'] ?? 'Not specified'))
                    ->line('**Preferred Schedule:** ' . ($details['preferred_schedule'] ?? 'Not specified'))
                    ->line('**Background:** ' . ($details['background'] ?? 'Not provided'))
                    ->line('**Motivation:** ' . ($details['motivation'] ?? 'Not provided'));
        } elseif ($this->inquiry->type === 'arbiter_express') {
            $details = $this->inquiry->details;
            $message->line('**Event Date:** ' . ($details['event_date'] ?? 'Not specified'))
                    ->line('**Event Time:** ' . ($details['event_time'] ?? 'Not specified'))
                    ->line('**Location:** ' . ($details['location'] ?? 'Not specified'))
                    ->line('**Guest Count:** ' . ($details['guest_count'] ?? 'Not specified'))
                    ->line('**Service Type:** ' . ($details['service_type'] ?? 'Not specified'))
                    ->line('**Budget Range:** ' . ($details['budget_range'] ?? 'Not provided'))
                    ->line('**Special Requests:** ' . ($details['special_requests'] ?? 'None'));
        }

        $message->action('View in Dashboard', url('/admin/inquiries/' . $this->inquiry->id))
                ->line('Please review and respond to this inquiry promptly.');

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
            'email' => $this->inquiry->email,
        ];
    }
}
