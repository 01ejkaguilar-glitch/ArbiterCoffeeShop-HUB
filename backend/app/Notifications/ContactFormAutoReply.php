<?php

namespace App\Notifications;

use App\Models\Contact;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ContactFormAutoReply extends Notification implements ShouldQueue
{
    use Queueable;

    protected $contact;

    /**
     * Create a new notification instance.
     */
    public function __construct(Contact $contact)
    {
        $this->contact = $contact;
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
        return (new MailMessage)
            ->subject('Thank you for contacting Arbiter Coffee - We received your message')
            ->greeting('Hello ' . $this->contact->name . '!')
            ->line('Thank you for reaching out to Arbiter Coffee.')
            ->line('We have received your message regarding: **' . $this->contact->subject . '**')
            ->line('Our team will review your inquiry and get back to you within 24-48 hours.')
            ->line('**Your Message:**')
            ->line($this->contact->message)
            ->line('If you need immediate assistance, please call us at:')
            ->line('📞 0977 278 8903')
            ->line('Or visit us at:')
            ->line('📍 Behind House, 146 Bagong Bayan 2, Bongabong, Oriental Mindoro')
            ->salutation('Best regards, The Arbiter Coffee Team');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'contact_id' => $this->contact->id,
            'name' => $this->contact->name,
            'subject' => $this->contact->subject,
        ];
    }
}
