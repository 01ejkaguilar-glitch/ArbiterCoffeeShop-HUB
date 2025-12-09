<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;
use InvalidArgumentException;

class PaymentGatewayFactory
{
    /**
     * Create payment gateway instance
     * 
     * @param string $gateway Gateway name (gcash, stripe, paypal)
     * @return PaymentGatewayInterface
     * @throws InvalidArgumentException If gateway is not supported
     */
    public static function create(string $gateway): PaymentGatewayInterface
    {
        return match(strtolower($gateway)) {
            'gcash' => new GCashPaymentGateway(),
            'stripe' => new StripePaymentGateway(),
            'paypal' => new PayPalPaymentGateway(),
            'maya' => new MayaPaymentGateway(),
            default => throw new InvalidArgumentException("Unsupported payment gateway: {$gateway}"),
        };
    }

    /**
     * Get default payment gateway
     * 
     * @return PaymentGatewayInterface
     */
    public static function default(): PaymentGatewayInterface
    {
        $defaultGateway = config('services.payment.default_gateway', 'gcash');
        return self::create($defaultGateway);
    }

    /**
     * Get all available payment gateways
     * 
     * @return array Array of gateway names
     */
    public static function available(): array
    {
        return ['gcash', 'stripe', 'paypal', 'maya'];
    }

    /**
     * Check if gateway is available
     * 
     * @param string $gateway Gateway name
     * @return bool
     */
    public static function isAvailable(string $gateway): bool
    {
        return in_array(strtolower($gateway), self::available());
    }

    /**
     * Get gateway for specific currency
     * 
     * @param string $currency Currency code
     * @return PaymentGatewayInterface
     */
    public static function forCurrency(string $currency): PaymentGatewayInterface
    {
        $currency = strtoupper($currency);
        
        // PHP currency - use Maya
        if ($currency === 'PHP') {
            return new MayaPaymentGateway();
        }
        
        // PayPal supports many currencies, can be used as alternative
        // For now, default to Stripe for non-PHP currencies
        return new StripePaymentGateway();
    }
}
