<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;
use Illuminate\Support\Facades\Log;
use PayPal\PayPalHttp\HttpException;
use PayPalCheckoutSdk\Core\PayPalHttpClient;
use PayPalCheckoutSdk\Core\SandboxEnvironment;
use PayPalCheckoutSdk\Core\ProductionEnvironment;
use PayPalCheckoutSdk\Orders\OrdersCreateRequest;
use PayPalCheckoutSdk\Orders\OrdersCaptureRequest;
use PayPalCheckoutSdk\Orders\OrdersGetRequest;
use PayPalCheckoutSdk\Payments\CapturesRefundRequest;

class PayPalPaymentGateway implements PaymentGatewayInterface
{
    protected PayPalHttpClient $client;

    public function __construct()
    {
        $mode = config('services.paypal.mode', 'sandbox');
        $clientId = config('services.paypal.client_id');
        $clientSecret = config('services.paypal.secret');

        $environment = $mode === 'live'
            ? new ProductionEnvironment($clientId, $clientSecret)
            : new SandboxEnvironment($clientId, $clientSecret);

        $this->client = new PayPalHttpClient($environment);
    }

    /**
     * Create a new payment
     *
     * @param array $data
     * @return array
     */
    public function createPayment(array $data): array
    {
        try {
            $request = new OrdersCreateRequest();
            $request->prefer('return=representation');
            $request->body = [
                'intent' => 'CAPTURE',
                'purchase_units' => [
                    [
                        'reference_id' => $data['order_id'] ?? uniqid(),
                        'amount' => [
                            'value' => number_format($data['amount'], 2, '.', ''),
                            'currency_code' => $data['currency']
                        ],
                        'description' => $data['description'] ?? 'Payment for Order'
                    ]
                ],
                'application_context' => [
                    'return_url' => $data['return_url'] ?? config('app.frontend_url') . '/payment/success',
                    'cancel_url' => $data['cancel_url'] ?? config('app.frontend_url') . '/payment/cancel',
                    'brand_name' => 'Arbiter Coffee Hub',
                    'landing_page' => 'BILLING',
                    'shipping_preference' => 'NO_SHIPPING',
                    'user_action' => 'PAY_NOW'
                ]
            ];

            $response = $this->client->execute($request);
            $order = $response->result;

            // Get approval URL
            $approvalUrl = '';
            foreach ($order->links as $link) {
                if ($link->rel === 'approve') {
                    $approvalUrl = $link->href;
                    break;
                }
            }

            Log::info('PayPal order created', [
                'order_id' => $order->id,
                'amount' => $data['amount'],
                'currency' => $data['currency'],
            ]);

            return [
                'success' => true,
                'transaction_id' => $order->id,
                'status' => $this->mapPayPalStatus($order->status),
                'amount' => $data['amount'],
                'currency' => $data['currency'],
                'payment_url' => $approvalUrl,
                'raw_response' => $order,
            ];
        } catch (HttpException $e) {
            Log::error('PayPal order creation failed', [
                'error' => $e->getMessage(),
                'status_code' => method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 'unknown',
                'data' => $data,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        } catch (\Exception $e) {
            Log::error('PayPal order creation failed', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Execute/Complete a PayPal payment after user approval
     *
     * @param string $paymentId
     * @param string $payerId
     * @return array
     */
    public function executePayment(string $paymentId, string $payerId): array
    {
        try {
            // In the new Orders API, we capture the payment instead of executing
            $request = new OrdersCaptureRequest($paymentId);
            $request->prefer('return=representation');

            $response = $this->client->execute($request);
            $order = $response->result;

            Log::info('PayPal order captured', [
                'order_id' => $paymentId,
                'status' => $order->status,
            ]);

            return [
                'success' => true,
                'transaction_id' => $paymentId,
                'status' => $this->mapPayPalStatus($order->status),
                'raw_response' => $order,
            ];
        } catch (HttpException $e) {
            Log::error('PayPal order capture failed', [
                'error' => $e->getMessage(),
                'status_code' => method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 'unknown',
                'order_id' => $paymentId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        } catch (\Exception $e) {
            Log::error('PayPal order capture failed', [
                'error' => $e->getMessage(),
                'order_id' => $paymentId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify payment status
     *
     * @param string $transactionId
     * @return array
     */
    public function verifyPayment(string $transactionId): array
    {
        try {
            $request = new OrdersGetRequest($transactionId);
            $response = $this->client->execute($request);
            $order = $response->result;

            $amount = $order->purchase_units[0]->amount;

            return [
                'success' => true,
                'transaction_id' => $transactionId,
                'status' => $this->mapPayPalStatus($order->status),
                'amount' => $amount->value,
                'currency' => $amount->currency_code,
                'raw_response' => $order,
            ];
        } catch (HttpException $e) {
            Log::error('PayPal order verification failed', [
                'error' => $e->getMessage(),
                'status_code' => method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 'unknown',
                'order_id' => $transactionId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        } catch (\Exception $e) {
            Log::error('PayPal order verification failed', [
                'error' => $e->getMessage(),
                'order_id' => $transactionId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Refund a payment
     *
     * @param string $transactionId
     * @param float|null $amount
     * @param string|null $reason
     * @return array
     */
    public function refundPayment(string $transactionId, ?float $amount = null, ?string $reason = null): array
    {
        try {
            // First get the order to find the capture ID
            $orderRequest = new OrdersGetRequest($transactionId);
            $orderResponse = $this->client->execute($orderRequest);
            $order = $orderResponse->result;

            // Find the capture ID from the order
            $captureId = null;
            foreach ($order->purchase_units as $unit) {
                if (isset($unit->payments->captures[0])) {
                    $captureId = $unit->payments->captures[0]->id;
                    break;
                }
            }

            if (!$captureId) {
                throw new \Exception('No capture found for this order');
            }

            // Create refund request
            $request = new CapturesRefundRequest($captureId);
            $request->body = [];

            if ($amount) {
                $request->body['amount'] = [
                    'value' => number_format($amount, 2, '.', ''),
                    'currency_code' => $order->purchase_units[0]->amount->currency_code
                ];
            }

            $response = $this->client->execute($request);
            $refund = $response->result;

            Log::info('PayPal refund processed', [
                'order_id' => $transactionId,
                'capture_id' => $captureId,
                'refund_id' => $refund->id,
                'amount' => $amount,
                'reason' => $reason,
            ]);

            return [
                'success' => true,
                'refund_id' => $refund->id,
                'status' => $this->mapPayPalStatus($refund->status),
                'amount' => $refund->amount->value,
                'raw_response' => $refund,
            ];
        } catch (HttpException $e) {
            Log::error('PayPal refund failed', [
                'error' => $e->getMessage(),
                'status_code' => method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 'unknown',
                'order_id' => $transactionId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        } catch (\Exception $e) {
            Log::error('PayPal refund failed', [
                'error' => $e->getMessage(),
                'order_id' => $transactionId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Cancel a pending payment
     *
     * @param string $transactionId
     * @return array
     */
    public function cancelPayment(string $transactionId): array
    {
        try {
            // Check order status first
            $request = new OrdersGetRequest($transactionId);
            $response = $this->client->execute($request);
            $order = $response->result;

            if ($order->status === 'COMPLETED' || $order->status === 'APPROVED') {
                return [
                    'success' => false,
                    'error' => 'Cannot cancel a completed or approved order. Please refund instead.',
                ];
            }

            // For PayPal Orders API, orders that are not approved will automatically expire
            // We can't explicitly cancel them, but we can verify they're not approved

            Log::info('PayPal order cancellation noted', [
                'order_id' => $transactionId,
                'status' => $order->status,
            ]);

            return [
                'success' => true,
                'transaction_id' => $transactionId,
                'status' => 'cancelled',
                'message' => 'Order will expire automatically if not approved',
            ];
        } catch (HttpException $e) {
            Log::error('PayPal order cancellation check failed', [
                'error' => $e->getMessage(),
                'status_code' => method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 'unknown',
                'order_id' => $transactionId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        } catch (\Exception $e) {
            Log::error('PayPal order cancellation check failed', [
                'error' => $e->getMessage(),
                'order_id' => $transactionId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify webhook signature
     * For PayPal, signature parameter should contain JSON-encoded headers array
     *
     * @param string $payload
     * @param string $signature JSON-encoded array of PayPal headers
     * @return bool
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        try {
            // Decode headers from JSON string
            $headers = json_decode($signature, true);

            if (!is_array($headers)) {
                Log::warning('Invalid PayPal signature format - expected JSON-encoded headers');
                return false;
            }

            // PayPal webhook signature verification
            // Requires: PAYPAL-TRANSMISSION-ID, PAYPAL-TRANSMISSION-TIME, PAYPAL-TRANSMISSION-SIG, PAYPAL-CERT-URL

            $webhookId = config('services.paypal.webhook_id');

            if (!$webhookId) {
                Log::warning('PayPal webhook ID not configured');
                return false;
            }

            // In production, you would use PayPal's webhook verification API
            // For now, we'll do basic validation

            $requiredHeaders = [
                'PAYPAL-TRANSMISSION-ID',
                'PAYPAL-TRANSMISSION-TIME',
                'PAYPAL-TRANSMISSION-SIG',
                'PAYPAL-CERT-URL',
            ];

            foreach ($requiredHeaders as $header) {
                if (!isset($headers[$header])) {
                    Log::warning('Missing PayPal webhook header', ['header' => $header]);
                    return false;
                }
            }

            // TODO: Implement full webhook signature verification using PayPal SDK
            // For now, return true if all required headers are present
            return true;

        } catch (\Exception $e) {
            Log::error('PayPal webhook verification failed', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Parse webhook payload
     *
     * @param string $payload
     * @return array
     */
    public function parseWebhook(string $payload): array
    {
        try {
            $data = json_decode($payload, true);

            if (!$data || !isset($data['event_type'])) {
                throw new \Exception('Invalid PayPal webhook payload');
            }

            $eventType = $data['event_type'];
            $resource = $data['resource'] ?? [];

            // Map PayPal event types to our standard event types
            $eventMapping = [
                'PAYMENT.SALE.COMPLETED' => 'payment.completed',
                'PAYMENT.SALE.DENIED' => 'payment.failed',
                'PAYMENT.SALE.REFUNDED' => 'refund.completed',
                'PAYMENT.SALE.REVERSED' => 'payment.reversed',
                'PAYMENT.SALE.PENDING' => 'payment.pending',
            ];

            $standardEvent = $eventMapping[$eventType] ?? 'payment.unknown';

            return [
                'event' => $standardEvent,
                'transaction_id' => $resource['parent_payment'] ?? $resource['id'] ?? null,
                'amount' => $resource['amount']['total'] ?? null,
                'currency' => $resource['amount']['currency'] ?? null,
                'status' => $this->mapPayPalStatus($resource['state'] ?? ''),
                'raw_data' => $data,
            ];
        } catch (\Exception $e) {
            Log::error('PayPal webhook parsing failed', [
                'error' => $e->getMessage(),
                'payload' => $payload,
            ]);

            return [
                'event' => 'payment.error',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get gateway name
     *
     * @return string
     */
    public function getGatewayName(): string
    {
        return 'paypal';
    }

    /**
     * Get supported currencies
     *
     * @return array
     */
    public function getSupportedCurrencies(): array
    {
        return [
            'PHP', // Philippine Peso
            'USD', // US Dollar
            'EUR', // Euro
            'GBP', // British Pound
            'JPY', // Japanese Yen
            'CAD', // Canadian Dollar
            'AUD', // Australian Dollar
            'SGD', // Singapore Dollar
            'HKD', // Hong Kong Dollar
            'CNY', // Chinese Yuan
        ];
    }

    /**
     * Check if currency is supported
     *
     * @param string $currency
     * @return bool
     */
    public function supportsCurrency(string $currency): bool
    {
        return in_array(strtoupper($currency), $this->getSupportedCurrencies());
    }

    /**
     * Get minimum transaction amount for a currency
     *
     * @param string $currency
     * @return float
     */
    public function getMinimumAmount(string $currency): float
    {
        $minimums = [
            'PHP' => 50.00,
            'USD' => 1.00,
            'EUR' => 1.00,
            'GBP' => 1.00,
            'JPY' => 100.00,
            'CAD' => 1.00,
            'AUD' => 1.00,
            'SGD' => 1.00,
            'HKD' => 10.00,
            'CNY' => 10.00,
        ];

        return $minimums[strtoupper($currency)] ?? 1.00;
    }

    /**
     * Map PayPal order status to our standard status
     *
     * @param string $status
     * @return string
     */
    protected function mapPayPalStatus(string $status): string
    {
        $statusMap = [
            'CREATED' => 'pending',
            'APPROVED' => 'pending',
            'COMPLETED' => 'completed',
            'SAVED' => 'pending',
            'VOIDED' => 'cancelled',
            'PAYER_ACTION_REQUIRED' => 'pending',
            'REFUNDED' => 'refunded',
            'PARTIALLY_REFUNDED' => 'refunded',
        ];

        return $statusMap[strtoupper($status)] ?? 'pending';
    }
}
