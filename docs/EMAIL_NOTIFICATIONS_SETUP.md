# Email Notification Setup Guide

## Overview
The Arbiter Coffee Shop application now includes automated email notifications for contact form and inquiry submissions.

## Implemented Notifications

### 1. Contact Form Notifications
When a customer submits the contact form, two emails are automatically sent:

#### Admin Notification
- **Recipient**: All users with 'admin' or 'super-admin' roles
- **Notification Class**: `App\Notifications\NewContactFormSubmission`
- **Content**: Customer details, inquiry type, subject, and message
- **Action Button**: Link to view the contact in admin dashboard

#### Customer Auto-Reply
- **Recipient**: The customer who submitted the form
- **Notification Class**: `App\Notifications\ContactFormAutoReply`
- **Content**: Thank you message with confirmation of receipt
- **Information**: Company contact details and expected response time (24-48 hours)

### 2. Barista Training Inquiry Notifications
When someone submits a barista training inquiry:

#### Admin Notification
- **Recipient**: All admins
- **Notification Class**: `App\Notifications\NewInquirySubmission`
- **Content**: Training inquiry details including experience level, schedule preferences, background, and motivation
- **Action Button**: Link to view inquiry in admin dashboard

#### Applicant Auto-Reply
- **Recipient**: The training applicant
- **Notification Class**: `App\Notifications\InquiryAutoReply`
- **Content**: Confirmation and information about the training program
- **Details**: Program benefits, certification, and contact information

### 3. Arbiter Express (Mobile Service) Inquiry Notifications
When someone requests the mobile coffee service:

#### Admin Notification
- **Recipient**: All admins
- **Notification Class**: `App\Notifications\NewInquirySubmission`
- **Content**: Event details, service type, guest count, budget, and special requests
- **Action Button**: Link to view inquiry in admin dashboard

#### Customer Auto-Reply
- **Recipient**: The event organizer
- **Notification Class**: `App\Notifications\InquiryAutoReply`
- **Content**: Confirmation and service information
- **Details**: Mobile service features and contact information

## Email Configuration

### Environment Variables
Add these to your `.env` file:

```env
# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@arbitercoffee.com
MAIL_FROM_NAME="${APP_NAME}"
```

### For Gmail:
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password as `MAIL_PASSWORD`

### For Testing (Development):
Use the log driver to save emails as log files instead of sending them:

```env
MAIL_MAILER=log
```

Emails will be saved to `storage/logs/laravel.log`

## Queue Configuration

All notifications implement `ShouldQueue` for asynchronous processing.

### Run Queue Worker:
```bash
php artisan queue:work
```

### For Development:
```bash
php artisan queue:work --tries=3
```

### Configure Queue in .env:
```env
QUEUE_CONNECTION=database
```

### Run Migrations for Queue:
```bash
php artisan queue:table
php artisan migrate
```

## Error Handling

All email notifications are wrapped in try-catch blocks:
- If email sending fails, the error is logged
- The form submission still succeeds (user experience is not affected)
- Admins can check logs for email delivery issues

## Testing Notifications

### Test Contact Form Notification:
```php
php artisan tinker

$contact = App\Models\Contact::first();
$admin = App\Models\User::whereHas('roles', function($q) { 
    $q->where('name', 'admin'); 
})->first();

// Test admin notification
$admin->notify(new App\Notifications\NewContactFormSubmission($contact));

// Test customer auto-reply
Notification::route('mail', $contact->email)
    ->notify(new App\Notifications\ContactFormAutoReply($contact));
```

### Test Inquiry Notification:
```php
$inquiry = App\Models\Inquiry::first();
$admin = App\Models\User::whereHas('roles', function($q) { 
    $q->where('name', 'admin'); 
})->first();

$admin->notify(new App\Notifications\NewInquirySubmission($inquiry));
Notification::route('mail', $inquiry->email)
    ->notify(new App\Notifications\InquiryAutoReply($inquiry));
```

## Customization

### Email Templates
Notification classes are located in `app/Notifications/`:
- `NewContactFormSubmission.php`
- `ContactFormAutoReply.php`
- `NewInquirySubmission.php`
- `InquiryAutoReply.php`

### Modify Email Content:
Edit the `toMail()` method in each notification class.

### Add Recipients:
Modify the query in the controllers to change who receives notifications:

```php
// ContactController.php & InquiryController.php
$admins = User::whereHas('roles', function ($query) {
    $query->whereIn('name', ['admin', 'super-admin', 'manager']); // Add more roles
})->get();
```

## Troubleshooting

### Emails Not Sending:
1. Check `.env` configuration
2. Verify SMTP credentials
3. Check `storage/logs/laravel.log` for errors
4. Ensure queue worker is running
5. Test with MAIL_MAILER=log first

### Queue Not Processing:
```bash
# Clear failed jobs
php artisan queue:clear

# Retry failed jobs
php artisan queue:retry all

# Check queue status
php artisan queue:work --once
```

### Gmail Issues:
- Enable "Less secure app access" (not recommended)
- Use App Passwords (recommended)
- Check if IP is blocked by Google

## Production Recommendations

1. Use a dedicated email service (Mailgun, SendGrid, Amazon SES)
2. Set up proper SPF and DKIM records
3. Use queue workers with supervisor for reliability
4. Monitor email delivery rates
5. Implement retry logic for failed emails
6. Set up email delivery webhooks for tracking

## Contact Information in Emails

The auto-reply emails include:
- Phone: 0977 278 8903
- Email: arbitercoffee.ph@gmail.com
- Address: Behind House, 146 Bagong Bayan 2, Bongabong, Oriental Mindoro

Update these in the notification classes if they change.
