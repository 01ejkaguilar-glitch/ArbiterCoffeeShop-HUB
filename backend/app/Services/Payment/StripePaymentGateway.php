<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;
use Stripe\StripeClient;
use Stripe\Exception\ApiErrorException;
use Stripe\Webhook;
use Illuminate\Support\Facades\Log;

class StripePaymentGateway implements PaymentGatewayInterface
{
    protected ?StripeClient $stripe;
    protected ?string $webhookSecret;

    public function __construct()
    {
        $secretKey = config('services.stripe.secret_key');
        $this->stripe = $secretKey ? new StripeClient($secretKey) : null;
        $this->webhookSecret = config('services.stripe.webhook_secret');
    }

    /**
     * Create a payment intent
     */
    public function createPayment(array $data): array
    {
        try {
            // Convert PHP to cents (Stripe uses smallest currency unit)
            $amount = (int) ($data['amount'] * 100);
            $currency = strtolower($data['currency'] ?? 'php');

            $paymentIntent = $this->stripe->paymentIntents->create([
                'amount' => $amount,
                'currency' => $currency,
                'description' => $data['description'] ?? 'Order Payment',
                'receipt_email' => $data['customer_email'] ?? null,
                'metadata' => array_merge(
                    ['order_id' => $data['order_id']],
                    $data['metadata'] ?? []
                ),
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
            ]);

            return [
                'success' => true,
                'transaction_id' => $paymentIntent->id,
                'status' => $this->mapStripeStatus($paymentIntent->status),
                'payment_url' => null, // Stripe uses client-side confirmation
                'client_secret' => $paymentIntent->client_secret,
                'message' => 'Payment intent created successfully',
                'amount' => $data['amount'],
                'currency' => $currency,
            ];
        } catch (ApiErrorException $e) {
            Log::error('Stripe payment creation failed', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);

            return [
                'success' => false,
                'transaction_id' => null,
                'status' => 'failed',
                'payment_url' => null,
                'client_secret' => null,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify payment status
     */
    public function verifyPayment(string $transactionId): array
    {
        try {
            $paymentIntent = $this->stripe->paymentIntents->retrieve($transactionId);

            return [
                'success' => true,
                'status' => $this->mapStripeStatus($paymentIntent->status),
                'amount' => $paymentIntent->amount / 100,
                'currency' => strtoupper($paymentIntent->currency),
                'transaction_id' => $paymentIntent->id,
                'paid_at' => $paymentIntent->status === 'succeeded'
                    ? date('Y-m-d H:i:s', $paymentIntent->created)
                    : null,
                'metadata' => $paymentIntent->metadata->toArray(),
            ];
        } catch (ApiErrorException $e) {
            Log::error('Stripe payment verification failed', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'status' => 'failed',
                'amount' => 0,
                'currency' => '',
                'transaction_id' => $transactionId,
                'paid_at' => null,
            ];
        }
    }

    /**
     * Process refund
     */
    public function refundPayment(string $transactionId, ?float $amount = null, ?string $reason = null): array
    {
        try {
            $refundData = [
                'payment_intent' => $transactionId,
                'reason' => $reason ?? 'requested_by_customer',
            ];

            if ($amount !== null) {
                $refundData['amount'] = (int) ($amount * 100);
            }

            $refund = $this->stripe->refunds->create($refundData);

            return [
                'success' => true,
                'refund_id' => $refund->id,
                'status' => $refund->status,
                'amount' => $refund->amount / 100,
                'message' => 'Refund processed successfully',
            ];
        } catch (ApiErrorException $e) {
            Log::error('Stripe refund failed', [
                'transaction_id' => $transactionId,
                'amount' => $amount,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'refund_id' => null,
                'status' => 'failed',
                'amount' => 0,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Cancel pending payment
     */
    public function cancelPayment(string $transactionId): array
    {
        try {
            $paymentIntent = $this->stripe->paymentIntents->cancel($transactionId);

            return [
                'success' => true,
                'status' => 'cancelled',
                'message' => 'Payment cancelled successfully',
            ];
        } catch (ApiErrorException $e) {
            Log::error('Stripe payment cancellation failed', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'status' => 'failed',
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify webhook signature
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        try {
            Webhook::constructEvent($payload, $signature, $this->webhookSecret);
            return true;
        } catch (\Exception $e) {
            Log::warning('Stripe webhook signature verification failed', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Parse webhook payload
     */
    public function parseWebhook(string $payload): array
    {
        try {
            $event = json_decode($payload, true);
            $eventType = $event['type'] ?? 'unknown';
            $data = $event['data']['object'] ?? [];

            $parsedData = [
                'event_type' => $this->mapWebhookEvent($eventType),
                'transaction_id' => $data['id'] ?? null,
                'status' => $this->mapStripeStatus($data['status'] ?? 'unknown'),
                'amount' => isset($data['amount']) ? $data['amount'] / 100 : 0,
                'metadata' => $data['metadata'] ?? [],
                'raw_event_type' => $eventType,
            ];

            return $parsedData;
        } catch (\Exception $e) {
            Log::error('Stripe webhook parsing failed', [
                'error' => $e->getMessage(),
            ]);

            return [
                'event_type' => 'unknown',
                'transaction_id' => null,
                'status' => 'failed',
                'amount' => 0,
                'metadata' => [],
            ];
        }
    }

    /**
     * Get gateway name
     */
    public function getGatewayName(): string
    {
        return 'stripe';
    }

    /**
     * Get supported currencies
     */
    public function getSupportedCurrencies(): array
    {
        return ['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'HKD', 'AUD', 'CAD'];
    }

    /**
     * Check if gateway supports given currency
     */
    public function supportsCurrency(string $currency): bool
    {
        return in_array(strtoupper($currency), $this->getSupportedCurrencies());
    }

    /**
     * Get minimum transaction amount
     */
    public function getMinimumAmount(string $currency): float
    {
        // Stripe minimum amounts by currency
        $minimums = [
            'PHP' => 50.00,    // 50 PHP
            'USD' => 0.50,     // 50 cents
            'EUR' => 0.50,
            'GBP' => 0.30,
            'JPY' => 50,
            'SGD' => 0.50,
            'HKD' => 4.00,
            'AUD' => 0.50,
            'CAD' => 0.50,
        ];

        return $minimums[strtoupper($currency)] ?? 1.00;
    }

    /**
     * Map Stripe payment status to standard status
     */
    protected function mapStripeStatus(string $stripeStatus): string
    {
        $statusMap = [
            'requires_payment_method' => 'pending',
            'requires_confirmation' => 'pending',
            'requires_action' => 'pending',
            'processing' => 'pending',
            'requires_capture' => 'pending',
            'succeeded' => 'completed',
            'canceled' => 'cancelled',
            'failed' => 'failed',
        ];

        return $statusMap[$stripeStatus] ?? 'pending';
    }

    /**
     * Map Stripe webhook events to standard event types
     */
    protected function mapWebhookEvent(string $stripeEvent): string
    {
        $eventMap = [
            'payment_intent.succeeded' => 'payment.completed',
            'payment_intent.payment_failed' => 'payment.failed',
            'payment_intent.canceled' => 'payment.cancelled',
            'charge.refunded' => 'refund.completed',
            'charge.refund.updated' => 'refund.updated',
        ];

        return $eventMap[$stripeEvent] ?? 'unknown';
    }
}
