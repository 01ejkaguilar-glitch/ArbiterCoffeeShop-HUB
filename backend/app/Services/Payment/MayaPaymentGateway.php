<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MayaPaymentGateway implements PaymentGatewayInterface
{
    protected string $apiUrl;
    protected ?string $publicKey;
    protected ?string $secretKey;
    protected ?string $webhookSecret;

    public function __construct()
    {
        $this->apiUrl = config('services.maya.api_url', 'https://pg-sandbox.paymaya.com');
        $this->publicKey = config('services.maya.public_key');
        $this->secretKey = config('services.maya.secret_key');
        $this->webhookSecret = config('services.maya.webhook_secret');
    }

    /**
     * Create a payment transaction
     */
    public function createPayment(array $data): array
    {
        try {
            $payload = [
                'totalAmount' => [
                    'value' => $data['amount'],
                    'currency' => $data['currency'] ?? 'PHP',
                ],
                'buyer' => [
                    'contact' => [
                        'email' => $data['customer_email'] ?? 'customer@example.com',
                    ],
                ],
                'redirectUrl' => [
                    'success' => config('app.frontend_url') . '/payment/success',
                    'failure' => config('app.frontend_url') . '/payment/failed',
                    'cancel' => config('app.frontend_url') . '/payment/cancelled',
                ],
                'requestReferenceNumber' => 'ORD-' . $data['order_id'],
                'metadata' => array_merge(
                    ['order_id' => $data['order_id']],
                    $data['metadata'] ?? []
                ),
            ];

            $response = Http::withBasicAuth($this->publicKey, $this->secretKey)
                ->post($this->apiUrl . '/payby/v2/paymaya/payments', $payload);

            if ($response->successful()) {
                $result = $response->json();

                return [
                    'success' => true,
                    'transaction_id' => $result['id'] ?? $result['requestReferenceNumber'],
                    'status' => 'pending',
                    'payment_url' => $result['redirectUrl'] ?? null,
                    'client_secret' => null, // Maya uses redirect flow
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
            Log::error('Maya payment creation failed', [
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
            $response = Http::withBasicAuth($this->publicKey, $this->secretKey)
                ->get($this->apiUrl . '/payby/v2/paymaya/payments/' . $transactionId);

            if ($response->successful()) {
                $result = $response->json();

                return [
                    'success' => true,
                    'status' => $this->mapMayaStatus($result['status'] ?? 'UNKNOWN'),
                    'amount' => $result['totalAmount']['value'] ?? 0,
                    'currency' => $result['totalAmount']['currency'] ?? 'PHP',
                    'transaction_id' => $result['id'] ?? $transactionId,
                    'paid_at' => $result['createdAt'] ?? null,
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
            Log::error('Maya payment verification failed', [
                'error' => $e->getMessage(),
                'transaction_id' => $transactionId,
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
            $payload = [
                'totalAmount' => [
                    'value' => $amount,
                    'currency' => 'PHP',
                ],
                'reason' => 'Customer request',
            ];

            $response = Http::withBasicAuth($this->publicKey, $this->secretKey)
                ->post($this->apiUrl . '/payby/v2/paymaya/payments/' . $transactionId . '/refunds', $payload);

            if ($response->successful()) {
                $result = $response->json();

                return [
                    'success' => true,
                    'message' => 'Refund processed successfully',
                    'refund_id' => $result['id'] ?? null,
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Refund failed',
            ];
        } catch (\Exception $e) {
            Log::error('Maya refund failed', [
                'error' => $e->getMessage(),
                'transaction_id' => $transactionId,
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get supported currencies
     */
    public function getSupportedCurrencies(): array
    {
        return ['PHP'];
    }

    /**
     * Map Maya status to standard status
     */
    private function mapMayaStatus(string $status): string
    {
        return match ($status) {
            'PAYMENT_SUCCESS', 'PAYMENT_COMPLETED' => 'completed',
            'PAYMENT_FAILED' => 'failed',
            'PAYMENT_CANCELLED' => 'cancelled',
            'PAYMENT_EXPIRED' => 'expired',
            'PAYMENT_PENDING', 'PAYMENT_PROCESSING' => 'pending',
            default => 'pending',
        };
    }

    /**
     * Cancel pending payment
     */
    public function cancelPayment(string $transactionId): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode($this->secretKey . ':'),
                'Content-Type' => 'application/json',
            ])->delete("{$this->apiUrl}/payments/{$transactionId}");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'status' => 'cancelled',
                    'message' => 'Payment cancelled successfully',
                ];
            }

            return [
                'success' => false,
                'status' => 'error',
                'message' => 'Failed to cancel payment',
            ];
        } catch (\Exception $e) {
            Log::error('Maya payment cancellation failed', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'status' => 'error',
                'message' => 'Payment cancellation failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Verify webhook signature
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        if (!$this->webhookSecret) {
            Log::warning('Maya webhook secret not configured');
            return false;
        }

        // Maya uses HMAC-SHA256 for webhook signatures
        $expectedSignature = hash_hmac('sha256', $payload, $this->webhookSecret);

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Parse webhook payload
     */
    public function parseWebhook(string $payload): array
    {
        try {
            $data = json_decode($payload, true);

            if (!$data) {
                return [
                    'success' => false,
                    'error' => 'Invalid JSON payload',
                ];
            }

            return [
                'success' => true,
                'event_type' => $data['eventType'] ?? 'unknown',
                'transaction_id' => $data['transactionId'] ?? $data['id'] ?? '',
                'status' => $this->mapMayaStatus($data['status'] ?? ''),
                'amount' => $data['amount'] ?? $data['totalAmount']['value'] ?? 0,
                'currency' => $data['currency'] ?? $data['totalAmount']['currency'] ?? 'PHP',
                'metadata' => $data['metadata'] ?? [],
                'raw_data' => $data,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to parse Maya webhook', [
                'error' => $e->getMessage(),
                'payload' => $payload,
            ]);

            return [
                'success' => false,
                'error' => 'Failed to parse webhook: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get gateway name
     */
    public function getGatewayName(): string
    {
        return 'maya';
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
        return match (strtoupper($currency)) {
            'PHP' => 1.00,  // ₱1.00 minimum for Maya
            'USD' => 0.03,  // ~₱1.50 at current rates
            default => 1.00,
        };
    }
}