<?php

namespace App\Notifications;

use App\Models\Contact;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewContactFormSubmission extends Notification implements ShouldQueue
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
            ->subject('New Contact Form Submission - ' . $this->contact->subject)
            ->greeting('Hello Admin!')
            ->line('You have received a new contact form submission.')
            ->line('**Name:** ' . $this->contact->name)
            ->line('**Email:** ' . $this->contact->email)
            ->line('**Phone:** ' . ($this->contact->phone ?? 'Not provided'))
            ->line('**Inquiry Type:** ' . ucfirst(str_replace('_', ' ', $this->contact->inquiry_type)))
            ->line('**Subject:** ' . $this->contact->subject)
            ->line('**Message:**')
            ->line($this->contact->message)
            ->action('View in Dashboard', url('/admin/contacts/' . $this->contact->id))
            ->line('Please respond to this inquiry as soon as possible.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'contact_id' => $this->contact->id,
            'name' => $this->contact->name,
            'email' => $this->contact->email,
            'subject' => $this->contact->subject,
        ];
    }
}
