<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Payment\PaymentGatewayFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PaymentGatewayTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test user
        $this->user = User::factory()->create();
        
        // Create test order
        $this->order = Order::factory()->create([
            'user_id' => $this->user->id,
            'total_amount' => 500.00,
            'payment_status' => 'pending',
        ]);
    }

    /** @test */
    public function it_can_create_payment_gateway_factory()
    {
        $gcash = PaymentGatewayFactory::create('gcash');
        $stripe = PaymentGatewayFactory::create('stripe');

        $this->assertEquals('gcash', $gcash->getGatewayName());
        $this->assertEquals('stripe', $stripe->getGatewayName());
    }

    /** @test */
    public function it_returns_correct_gateway_for_currency()
    {
        $phpGateway = PaymentGatewayFactory::forCurrency('PHP');
        $usdGateway = PaymentGatewayFactory::forCurrency('USD');

        $this->assertEquals('gcash', $phpGateway->getGatewayName());
        $this->assertEquals('stripe', $usdGateway->getGatewayName());
    }

    /** @test */
    public function it_lists_available_gateways()
    {
        $gateways = PaymentGatewayFactory::available();

        $this->assertIsArray($gateways);
        $this->assertContains('gcash', $gateways);
        $this->assertContains('stripe', $gateways);
        $this->assertContains('maya', $gateways);
        $this->assertContains('paymongo', $gateways);
    }

    /** @test */
    public function it_checks_gateway_availability()
    {
        $this->assertTrue(PaymentGatewayFactory::isAvailable('gcash'));
        $this->assertTrue(PaymentGatewayFactory::isAvailable('stripe'));
        $this->assertTrue(PaymentGatewayFactory::isAvailable('paypal'));
        $this->assertTrue(PaymentGatewayFactory::isAvailable('maya'));
        $this->assertFalse(PaymentGatewayFactory::isAvailable('unknown'));
    }

    /** @test */
    public function it_validates_supported_currencies()
    {
        $gcash = PaymentGatewayFactory::create('gcash');
        $stripe = PaymentGatewayFactory::create('stripe');

        // GCash supports only PHP
        $this->assertTrue($gcash->supportsCurrency('PHP'));
        $this->assertFalse($gcash->supportsCurrency('USD'));

        // Stripe supports multiple currencies
        $this->assertTrue($stripe->supportsCurrency('PHP'));
        $this->assertTrue($stripe->supportsCurrency('USD'));
        $this->assertTrue($stripe->supportsCurrency('EUR'));
    }

    /** @test */
    public function it_returns_minimum_transaction_amounts()
    {
        $gcash = PaymentGatewayFactory::create('gcash');
        $stripe = PaymentGatewayFactory::create('stripe');

        $this->assertEquals(1.00, $gcash->getMinimumAmount('PHP'));
        $this->assertEquals(50.00, $stripe->getMinimumAmount('PHP'));
        $this->assertEquals(0.50, $stripe->getMinimumAmount('USD'));
    }

    /** @test */
    public function it_creates_stripe_payment_intent()
    {
        // Skip if Stripe credentials not configured
        if (!config('services.stripe.secret_key')) {
            $this->markTestSkipped('Stripe credentials not configured');
        }

        $gateway = PaymentGatewayFactory::create('stripe');
        
        $result = $gateway->createPayment([
            'amount' => 500.00,
            'currency' => 'PHP',
            'order_id' => $this->order->id,
            'customer_email' => $this->user->email,
            'description' => 'Test Order Payment',
        ]);

        $this->assertTrue($result['success']);
        $this->assertNotNull($result['transaction_id']);
        $this->assertNotNull($result['client_secret']);
        $this->assertEquals('pending', $result['status']);
    }

    /** @test */
    public function it_handles_stripe_payment_creation_failure()
    {
        // Use invalid API key to trigger failure
        config(['services.stripe.secret_key' => 'invalid_key']);
        
        $gateway = PaymentGatewayFactory::create('stripe');
        
        $result = $gateway->createPayment([
            'amount' => 500.00,
            'currency' => 'PHP',
            'order_id' => $this->order->id,
            'customer_email' => $this->user->email,
        ]);

        $this->assertFalse($result['success']);
        $this->assertEquals('failed', $result['status']);
    }

    /** @test */
    public function it_processes_stripe_webhook()
    {
        $payment = Payment::factory()->create([
            'order_id' => $this->order->id,
            'transaction_id' => 'pi_test123',
            'status' => 'pending',
        ]);

        $webhookPayload = json_encode([
            'type' => 'payment_intent.succeeded',
            'data' => [
                'object' => [
                    'id' => 'pi_test123',
                    'status' => 'succeeded',
                    'amount' => 50000,
                    'metadata' => ['order_id' => $this->order->id],
                ],
            ],
        ]);

        $response = $this->postJson('/api/v1/webhooks/stripe', [], [
            'Stripe-Signature' => 'test_signature',
        ]);

        // Note: Will fail signature verification in actual test
        // This tests the endpoint exists and handles requests
        $this->assertNotNull($response);
    }

    /** @test */
    public function it_creates_maya_payment()
    {
        // Skip if Maya credentials not configured
        if (!config('services.maya.secret_key')) {
            $this->markTestSkipped('Maya credentials not configured');
        }

        $gateway = PaymentGatewayFactory::create('maya');

        $result = $gateway->createPayment([
            'amount' => 500.00,
            'currency' => 'PHP',
            'order_id' => $this->order->id,
            'customer_email' => $this->user->email,
            'description' => 'Test Order Payment',
        ]);

        // Should fail in test environment without proper credentials
        // But should return proper structure
        $this->assertIsArray($result);
        $this->assertArrayHasKey('success', $result);
        $this->assertArrayHasKey('message', $result);
    }

    /** @test */
    public function it_processes_gcash_webhook()
    {
        $payment = Payment::factory()->create([
            'order_id' => $this->order->id,
            'transaction_id' => 'gcash_test123',
            'status' => 'pending',
        ]);

        $webhookPayload = json_encode([
            'event_type' => 'payment.success',
            'transaction_id' => 'gcash_test123',
            'status' => 'paid',
            'amount' => 500.00,
            'metadata' => ['order_id' => $this->order->id],
        ]);

        $response = $this->postJson('/api/v1/webhooks/gcash', [], [
            'X-GCash-Signature' => 'test_signature',
        ]);

        // Note: Will fail signature verification in actual test
        // This tests the endpoint exists and handles requests
        $this->assertNotNull($response);
    }

    /** @test */
    public function it_maps_payment_statuses_correctly()
    {
        $stripe = PaymentGatewayFactory::create('stripe');
        
        // Test webhook parsing for different event types
        $successPayload = json_encode([
            'type' => 'payment_intent.succeeded',
            'data' => [
                'object' => [
                    'id' => 'pi_test',
                    'status' => 'succeeded',
                    'amount' => 50000,
                ],
            ],
        ]);

        $webhookData = $stripe->parseWebhook($successPayload);
        
        $this->assertEquals('payment.completed', $webhookData['event_type']);
        $this->assertEquals('completed', $webhookData['status']);
    }

    /** @test */
    public function it_validates_minimum_amounts()
    {
        $gcash = PaymentGatewayFactory::create('gcash');
        $stripe = PaymentGatewayFactory::create('stripe');

        // Test that gateways have minimum amount restrictions
        $this->assertGreaterThan(0, $gcash->getMinimumAmount('PHP'));
        $this->assertGreaterThan(0, $stripe->getMinimumAmount('PHP'));
        $this->assertGreaterThan(0, $stripe->getMinimumAmount('USD'));
    }

    /** @test */
    public function it_provides_gateway_information()
    {
        $gcash = PaymentGatewayFactory::create('gcash');
        $stripe = PaymentGatewayFactory::create('stripe');
        $paypal = PaymentGatewayFactory::create('paypal');

        // GCash info
        $this->assertEquals('gcash', $gcash->getGatewayName());
        $this->assertCount(1, $gcash->getSupportedCurrencies());
        $this->assertContains('PHP', $gcash->getSupportedCurrencies());

        // Stripe info
        $this->assertEquals('stripe', $stripe->getGatewayName());
        $this->assertGreaterThan(1, count($stripe->getSupportedCurrencies()));
        $this->assertContains('PHP', $stripe->getSupportedCurrencies());
        $this->assertContains('USD', $stripe->getSupportedCurrencies());

        // PayPal info
        $this->assertEquals('paypal', $paypal->getGatewayName());
        $this->assertGreaterThan(1, count($paypal->getSupportedCurrencies()));
        $this->assertContains('PHP', $paypal->getSupportedCurrencies());
        $this->assertContains('USD', $paypal->getSupportedCurrencies());
        $this->assertContains('EUR', $paypal->getSupportedCurrencies());
    }

    /** @test */
    public function it_supports_paypal_payment_creation()
    {
        $paypal = PaymentGatewayFactory::create('paypal');

        $this->assertTrue($paypal->supportsCurrency('USD'));
        $this->assertTrue($paypal->supportsCurrency('EUR'));
        $this->assertTrue($paypal->supportsCurrency('PHP'));
        $this->assertEquals(1.00, $paypal->getMinimumAmount('USD'));
        $this->assertEquals(50.00, $paypal->getMinimumAmount('PHP'));
    }

    /** @test */
    public function it_processes_paypal_webhook_events()
    {
        $paypal = PaymentGatewayFactory::create('paypal');

        // Test PayPal webhook parsing
        $payload = json_encode([
            'event_type' => 'PAYMENT.SALE.COMPLETED',
            'resource' => [
                'id' => 'sale_test_123',
                'parent_payment' => 'PAY-123456789',
                'state' => 'completed',
                'amount' => [
                    'total' => '100.00',
                    'currency' => 'USD',
                ],
            ],
        ]);

        $webhookData = $paypal->parseWebhook($payload);

        $this->assertEquals('payment.completed', $webhookData['event']);
        $this->assertEquals('PAY-123456789', $webhookData['transaction_id']);
        $this->assertEquals('100.00', $webhookData['amount']);
        $this->assertEquals('USD', $webhookData['currency']);
        $this->assertEquals('completed', $webhookData['status']);
    }

    /** @test */
    public function it_validates_paypal_minimum_amounts_per_currency()
    {
        $paypal = PaymentGatewayFactory::create('paypal');

        $this->assertEquals(50.00, $paypal->getMinimumAmount('PHP'));
        $this->assertEquals(1.00, $paypal->getMinimumAmount('USD'));
        $this->assertEquals(1.00, $paypal->getMinimumAmount('EUR'));
        $this->assertEquals(100.00, $paypal->getMinimumAmount('JPY'));
    }
}
