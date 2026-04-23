<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GCashPaymentGateway implements PaymentGatewayInterface
{
    protected string $apiUrl;
    protected ?string $apiKey;
    protected ?string $merchantId;
    protected ?string $webhookSecret;

    public function __construct()
    {
        $this->apiUrl = config('services.gcash.api_url', 'https://api.gcash.com/v1');
        $this->apiKey = config('services.gcash.api_key');
        $this->merchantId = config('services.gcash.merchant_id');
        $this->webhookSecret = config('services.gcash.webhook_secret');
    }

    /**
     * Create a payment transaction
     */
    public function createPayment(array $data): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl . '/payments', [
                'merchant_id' => $this->merchantId,
                'amount' => $data['amount'],
                'currency' => $data['currency'] ?? 'PHP',
                'description' => $data['description'] ?? 'Order Payment',
                'customer_email' => $data['customer_email'] ?? null,
                'reference_number' => 'ORD-' . $data['order_id'],
                'redirect_url' => config('app.frontend_url') . '/payment/callback',
                'webhook_url' => config('app.url') . '/api/v1/webhooks/gcash',
                'metadata' => array_merge(
                    ['order_id' => $data['order_id']],
                    $data['metadata'] ?? []
                ),
            ]);

            if ($response->successful()) {
                $result = $response->json();

                return [
                    'success' => true,
                    'transaction_id' => $result['transaction_id'] ?? $result['id'],
                    'status' => $this->mapGCashStatus($result['status'] ?? 'pending'),
                    'payment_url' => $result['payment_url'] ?? $result['checkout_url'],
                    'client_secret' => null, // GCash uses redirect flow
                    'message' => 'Payment created successfully',
                    'amount' => $data['amount'],
                    'currency' => $data['currency'] ?? 'PHP',
                ];
            }

            return [
                'success' => false,
                'transaction_id' => null,
                'status' => 'failed',
                'payment_url' => null,
                'client_secret' => null,
                'message' => $response->json()['message'] ?? 'Payment creation failed',
            ];
        } catch (\Exception $e) {
            Log::error('GCash payment creation failed', [
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
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
            ])->get($this->apiUrl . '/payments/' . $transactionId);

            if ($response->successful()) {
                $result = $response->json();

                return [
                    'success' => true,
                    'status' => $this->mapGCashStatus($result['status'] ?? 'pending'),
                    'amount' => $result['amount'] ?? 0,
                    'currency' => $result['currency'] ?? 'PHP',
                    'transaction_id' => $result['transaction_id'] ?? $result['id'],
                    'paid_at' => $result['paid_at'] ?? null,
                    'metadata' => $result['metadata'] ?? [],
                ];
            }

            return [
                'success' => false,
                'status' => 'failed',
                'amount' => 0,
                'currency' => 'PHP',
                'transaction_id' => $transactionId,
                'paid_at' => null,
            ];
        } catch (\Exception $e) {
            Log::error('GCash payment verification failed', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'status' => 'failed',
                'amount' => 0,
                'currency' => 'PHP',
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
                'transaction_id' => $transactionId,
                'reason' => $reason ?? 'Customer request',
            ];

            if ($amount !== null) {
                $refundData['amount'] = $amount;
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl . '/refunds', $refundData);

            if ($response->successful()) {
                $result = $response->json();

                return [
                    'success' => true,
                    'refund_id' => $result['refund_id'] ?? $result['id'],
                    'status' => $result['status'] ?? 'pending',
                    'amount' => $result['amount'] ?? $amount,
                    'message' => 'Refund initiated successfully',
                ];
            }

            return [
                'success' => false,
                'refund_id' => null,
                'status' => 'failed',
                'amount' => 0,
                'message' => $response->json()['message'] ?? 'Refund failed',
            ];
        } catch (\Exception $e) {
            Log::error('GCash refund failed', [
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
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
            ])->post($this->apiUrl . '/payments/' . $transactionId . '/cancel');

            if ($response->successful()) {
                return [
                    'success' => true,
                    'status' => 'cancelled',
                    'message' => 'Payment cancelled successfully',
                ];
            }

            return [
                'success' => false,
                'status' => 'failed',
                'message' => $response->json()['message'] ?? 'Cancellation failed',
            ];
        } catch (\Exception $e) {
            Log::error('GCash payment cancellation failed', [
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
        $computedSignature = hash_hmac('sha256', $payload, $this->webhookSecret);
        return hash_equals($computedSignature, $signature);
    }

    /**
     * Parse webhook payload
     */
    public function parseWebhook(string $payload): array
    {
        try {
            $data = json_decode($payload, true);

            return [
                'event_type' => $this->mapWebhookEvent($data['event_type'] ?? 'unknown'),
                'transaction_id' => $data['transaction_id'] ?? $data['payment']['id'] ?? null,
                'status' => $this->mapGCashStatus($data['status'] ?? $data['payment']['status'] ?? 'unknown'),
                'amount' => $data['amount'] ?? $data['payment']['amount'] ?? 0,
                'metadata' => $data['metadata'] ?? $data['payment']['metadata'] ?? [],
                'raw_event_type' => $data['event_type'] ?? 'unknown',
            ];
        } catch (\Exception $e) {
            Log::error('GCash webhook parsing failed', [
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
        return 'gcash';
    }

    /**
     * Get supported currencies
     */
    public function getSupportedCurrencies(): array
    {
        return ['PHP']; // GCash primarily supports PHP
    }

    /**
     * Check if gateway supports given currency
     */
    public function supportsCurrency(string $currency): bool
    {
        return strtoupper($currency) === 'PHP';
    }

    /**
     * Get minimum transaction amount
     */
    public function getMinimumAmount(string $currency): float
    {
        return 1.00; // 1 PHP minimum
    }

    /**
     * Map GCash payment status to standard status
     */
    protected function mapGCashStatus(string $gcashStatus): string
    {
        $statusMap = [
            'pending' => 'pending',
            'processing' => 'pending',
            'paid' => 'completed',
            'success' => 'completed',
            'completed' => 'completed',
            'failed' => 'failed',
            'error' => 'failed',
            'cancelled' => 'cancelled',
            'canceled' => 'cancelled',
            'expired' => 'failed',
        ];

        return $statusMap[strtolower($gcashStatus)] ?? 'pending';
    }

    /**
     * Map GCash webhook events to standard event types
     */
    protected function mapWebhookEvent(string $gcashEvent): string
    {
        $eventMap = [
            'payment.success' => 'payment.completed',
            'payment.paid' => 'payment.completed',
            'payment.failed' => 'payment.failed',
            'payment.cancelled' => 'payment.cancelled',
            'refund.success' => 'refund.completed',
            'refund.completed' => 'refund.completed',
        ];

        return $eventMap[$gcashEvent] ?? 'unknown';
    }
}
