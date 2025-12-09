<?php

namespace App\Contracts;

/**
 * Payment Gateway Interface
 * 
 * Provides a unified interface for all payment gateway implementations.
 * Supports GCash, Stripe, PayPal, and other future payment providers.
 */
interface PaymentGatewayInterface
{
    /**
     * Create a payment intent/transaction
     * 
     * @param array $data Payment data including:
     *   - amount: float (in PHP/USD)
     *   - currency: string (PHP, USD, etc.)
     *   - order_id: int
     *   - customer_email: string
     *   - description: string
     *   - metadata: array (optional)
     * @return array Payment response including:
     *   - success: bool
     *   - transaction_id: string
     *   - status: string (pending, completed, failed)
     *   - payment_url: string (for redirect-based payments)
     *   - client_secret: string (for client-side confirmation)
     *   - message: string
     */
    public function createPayment(array $data): array;

    /**
     * Verify payment status
     * 
     * @param string $transactionId Transaction/Payment ID
     * @return array Payment status including:
     *   - success: bool
     *   - status: string (pending, completed, failed, refunded)
     *   - amount: float
     *   - currency: string
     *   - transaction_id: string
     *   - paid_at: string|null (timestamp)
     */
    public function verifyPayment(string $transactionId): array;

    /**
     * Process refund
     * 
     * @param string $transactionId Original transaction ID
     * @param float|null $amount Amount to refund (null = full refund)
     * @param string|null $reason Refund reason
     * @return array Refund response including:
     *   - success: bool
     *   - refund_id: string
     *   - status: string
     *   - amount: float
     *   - message: string
     */
    public function refundPayment(string $transactionId, ?float $amount = null, ?string $reason = null): array;

    /**
     * Cancel pending payment
     * 
     * @param string $transactionId Transaction ID to cancel
     * @return array Cancellation response including:
     *   - success: bool
     *   - status: string
     *   - message: string
     */
    public function cancelPayment(string $transactionId): array;

    /**
     * Verify webhook signature
     * 
     * @param string $payload Raw webhook payload
     * @param string $signature Webhook signature header
     * @return bool True if signature is valid
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool;

    /**
     * Parse webhook payload
     * 
     * @param string $payload Raw webhook payload
     * @return array Parsed webhook data including:
     *   - event_type: string (payment.completed, payment.failed, refund.completed, etc.)
     *   - transaction_id: string
     *   - status: string
     *   - amount: float
     *   - metadata: array
     */
    public function parseWebhook(string $payload): array;

    /**
     * Get gateway name
     * 
     * @return string Gateway identifier (gcash, stripe, paypal)
     */
    public function getGatewayName(): string;

    /**
     * Get supported currencies
     * 
     * @return array Array of currency codes (PHP, USD, EUR, etc.)
     */
    public function getSupportedCurrencies(): array;

    /**
     * Check if gateway supports given currency
     * 
     * @param string $currency Currency code
     * @return bool True if currency is supported
     */
    public function supportsCurrency(string $currency): bool;

    /**
     * Get minimum transaction amount
     * 
     * @param string $currency Currency code
     * @return float Minimum amount in specified currency
     */
    public function getMinimumAmount(string $currency): float;
}
