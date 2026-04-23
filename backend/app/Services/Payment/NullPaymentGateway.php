<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;

class NullPaymentGateway implements PaymentGatewayInterface
{
    public function createPayment(array $data): array
    {
        return [
            'success' => true,
            'transaction_id' => 'null-' . uniqid(),
            'status' => 'pending',
            'amount' => $data['amount'] ?? 0,
            'currency' => $data['currency'] ?? 'PHP',
            'payment_url' => null,
            'raw_response' => (object) ['mock' => true],
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        return [
            'success' => true,
            'transaction_id' => $transactionId,
            'status' => 'completed',
            'amount' => 0.0,
            'currency' => 'PHP',
            'raw_response' => (object) ['mock' => true],
        ];
    }

    public function refundPayment(string $transactionId, ?float $amount = null, ?string $reason = null): array
    {
        return [
            'success' => true,
            'refund_id' => 'null-refund-' . uniqid(),
            'status' => 'completed',
            'amount' => $amount ?? 0.0,
            'message' => $reason ?? 'Mock refund processed',
        ];
    }

    public function cancelPayment(string $transactionId): array
    {
        return [
            'success' => true,
            'transaction_id' => $transactionId,
            'status' => 'cancelled',
            'message' => 'Mock cancellation',
        ];
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        return true;
    }

    public function parseWebhook(string $payload): array
    {
        return [
            'event_type' => 'mock.event',
            'transaction_id' => 'null-' . uniqid(),
            'status' => 'completed',
            'amount' => 0.0,
            'metadata' => [],
        ];
    }

    public function getGatewayName(): string
    {
        return 'paypal';
    }

    public function getSupportedCurrencies(): array
    {
        return ['USD', 'PHP'];
    }

    public function supportsCurrency(string $currency): bool
    {
        return in_array(strtoupper($currency), $this->getSupportedCurrencies());
    }

    public function getMinimumAmount(string $currency): float
    {
        return 1.0;
    }
}
