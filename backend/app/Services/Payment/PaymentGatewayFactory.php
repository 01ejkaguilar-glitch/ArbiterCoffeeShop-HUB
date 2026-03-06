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
        $g = strtolower($gateway);

        // If running tests or PayPal SDK is missing, use the Null gateway for PayPal
        if ($g === 'paypal' && (app()->environment('testing') || !class_exists(\PayPalCheckoutSdk\Core\SandboxEnvironment::class))) {
            return new NullPaymentGateway();
        }

        return match($g) {
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
        $available = ['gcash', 'stripe', 'maya', 'paymongo'];

        // Expose PayPal only when the SDK is present and not in the testing environment
        if (!app()->environment('testing') && class_exists(\PayPalCheckoutSdk\Core\SandboxEnvironment::class)) {
            $available[] = 'paypal';
        }

        return $available;
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
        // PHP currency - use GCash
        if ($currency === 'PHP') {
            return new GCashPaymentGateway();
        }

        // PayPal supports many currencies, can be used as alternative
        // For now, default to Stripe for non-PHP currencies
        return new StripePaymentGateway();
    }
}
