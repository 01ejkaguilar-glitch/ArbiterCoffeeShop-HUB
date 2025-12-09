<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Payment\PaymentGatewayFactory;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    /**
     * Handle Stripe webhook
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function stripeWebhook(Request $request): JsonResponse
    {
        try {
            $gateway = PaymentGatewayFactory::create('stripe');
            
            // Verify webhook signature
            $signature = $request->header('Stripe-Signature');
            if (!$gateway->verifyWebhookSignature($request->getContent(), $signature)) {
                Log::warning('Invalid Stripe webhook signature');
                return response()->json(['error' => 'Invalid signature'], 400);
            }

            // Parse webhook data
            $webhookData = $gateway->parseWebhook($request->getContent());
            
            Log::info('Stripe webhook received', $webhookData);

            // Handle different event types
            switch ($webhookData['event_type']) {
                case 'payment.completed':
                    $this->handlePaymentCompleted($webhookData, 'stripe');
                    break;
                    
                case 'payment.failed':
                    $this->handlePaymentFailed($webhookData, 'stripe');
                    break;
                    
                case 'payment.cancelled':
                    $this->handlePaymentCancelled($webhookData, 'stripe');
                    break;
                    
                case 'refund.completed':
                    $this->handleRefundCompleted($webhookData, 'stripe');
                    break;
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Stripe webhook processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Handle GCash webhook
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function gcashWebhook(Request $request): JsonResponse
    {
        try {
            $gateway = PaymentGatewayFactory::create('gcash');
            
            // Verify webhook signature
            $signature = $request->header('X-GCash-Signature');
            if (!$gateway->verifyWebhookSignature($request->getContent(), $signature)) {
                Log::warning('Invalid GCash webhook signature');
                return response()->json(['error' => 'Invalid signature'], 400);
            }

            // Parse webhook data
            $webhookData = $gateway->parseWebhook($request->getContent());
            
            Log::info('GCash webhook received', $webhookData);

            // Handle different event types
            switch ($webhookData['event_type']) {
                case 'payment.completed':
                    $this->handlePaymentCompleted($webhookData, 'gcash');
                    break;
                    
                case 'payment.failed':
                    $this->handlePaymentFailed($webhookData, 'gcash');
                    break;
                    
                case 'payment.cancelled':
                    $this->handlePaymentCancelled($webhookData, 'gcash');
                    break;
                    
                case 'refund.completed':
                    $this->handleRefundCompleted($webhookData, 'gcash');
                    break;
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('GCash webhook processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Handle PayPal webhook
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function paypalWebhook(Request $request): JsonResponse
    {
        try {
            $gateway = PaymentGatewayFactory::create('paypal');
            
            // Verify webhook signature
            $headers = [
                'PAYPAL-TRANSMISSION-ID' => $request->header('PAYPAL-TRANSMISSION-ID'),
                'PAYPAL-TRANSMISSION-TIME' => $request->header('PAYPAL-TRANSMISSION-TIME'),
                'PAYPAL-TRANSMISSION-SIG' => $request->header('PAYPAL-TRANSMISSION-SIG'),
                'PAYPAL-CERT-URL' => $request->header('PAYPAL-CERT-URL'),
            ];
            
            // Encode headers as JSON string to match interface signature
            if (!$gateway->verifyWebhookSignature($request->getContent(), json_encode($headers))) {
                Log::warning('Invalid PayPal webhook signature');
                return response()->json(['error' => 'Invalid signature'], 400);
            }

            // Parse webhook data
            $webhookData = $gateway->parseWebhook($request->getContent());
            
            Log::info('PayPal webhook received', $webhookData);

            // Handle different event types
            switch ($webhookData['event']) {
                case 'payment.completed':
                    $this->handlePaymentCompleted($webhookData, 'paypal');
                    break;
                    
                case 'payment.failed':
                    $this->handlePaymentFailed($webhookData, 'paypal');
                    break;
                    
                case 'payment.pending':
                    $this->handlePaymentPending($webhookData, 'paypal');
                    break;
                    
                case 'refund.completed':
                    $this->handleRefundCompleted($webhookData, 'paypal');
                    break;
                    
                case 'payment.reversed':
                    $this->handlePaymentReversed($webhookData, 'paypal');
                    break;
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('PayPal webhook processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Handle Maya webhook
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function mayaWebhook(Request $request): JsonResponse
    {
        try {
            $gateway = PaymentGatewayFactory::create('maya');

            // Maya webhooks don't have signature verification in sandbox
            // In production, you would verify the webhook signature

            $webhookData = $request->all();

            Log::info('Maya webhook received', $webhookData);

            // Handle different event types
            switch ($webhookData['status'] ?? '') {
                case 'PAYMENT_SUCCESS':
                case 'PAYMENT_COMPLETED':
                    $this->handlePaymentCompleted([
                        'transaction_id' => $webhookData['requestReferenceNumber'] ?? $webhookData['id'],
                        'amount' => $webhookData['totalAmount']['value'] ?? 0,
                        'currency' => $webhookData['totalAmount']['currency'] ?? 'PHP',
                    ], 'maya');
                    break;

                case 'PAYMENT_FAILED':
                    $this->handlePaymentFailed([
                        'transaction_id' => $webhookData['requestReferenceNumber'] ?? $webhookData['id'],
                    ], 'maya');
                    break;

                case 'PAYMENT_CANCELLED':
                    $this->handlePaymentCancelled([
                        'transaction_id' => $webhookData['requestReferenceNumber'] ?? $webhookData['id'],
                    ], 'maya');
                    break;
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Maya webhook processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Handle payment completed event
     */
    protected function handlePaymentCompleted(array $webhookData, string $gateway): void
    {
        DB::transaction(function () use ($webhookData, $gateway) {
            // Find payment record
            $payment = Payment::where('transaction_id', $webhookData['transaction_id'])->first();
            
            if (!$payment) {
                Log::warning('Payment not found for webhook', [
                    'transaction_id' => $webhookData['transaction_id'],
                    'gateway' => $gateway,
                ]);
                return;
            }

            // Update payment status
            $payment->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            // Update order status
            $order = $payment->order;
            if ($order && $order->payment_status !== 'paid') {
                $order->update([
                    'payment_status' => 'paid',
                    'status' => 'confirmed',
                ]);

                Log::info('Order payment confirmed', [
                    'order_id' => $order->id,
                    'transaction_id' => $webhookData['transaction_id'],
                    'gateway' => $gateway,
                ]);
            }
        });
    }

    /**
     * Handle payment failed event
     */
    protected function handlePaymentFailed(array $webhookData, string $gateway): void
    {
        DB::transaction(function () use ($webhookData, $gateway) {
            // Find payment record
            $payment = Payment::where('transaction_id', $webhookData['transaction_id'])->first();
            
            if (!$payment) {
                return;
            }

            // Update payment status
            $payment->update([
                'status' => 'failed',
            ]);

            // Update order status
            $order = $payment->order;
            if ($order) {
                $order->update([
                    'payment_status' => 'failed',
                ]);

                Log::warning('Order payment failed', [
                    'order_id' => $order->id,
                    'transaction_id' => $webhookData['transaction_id'],
                    'gateway' => $gateway,
                ]);
            }
        });
    }

    /**
     * Handle payment cancelled event
     */
    protected function handlePaymentCancelled(array $webhookData, string $gateway): void
    {
        DB::transaction(function () use ($webhookData, $gateway) {
            // Find payment record
            $payment = Payment::where('transaction_id', $webhookData['transaction_id'])->first();
            
            if (!$payment) {
                return;
            }

            // Update payment status
            $payment->update([
                'status' => 'cancelled',
            ]);

            // Update order status
            $order = $payment->order;
            if ($order) {
                $order->update([
                    'payment_status' => 'cancelled',
                    'status' => 'cancelled',
                ]);

                Log::info('Order payment cancelled', [
                    'order_id' => $order->id,
                    'transaction_id' => $webhookData['transaction_id'],
                    'gateway' => $gateway,
                ]);
            }
        });
    }

    /**
     * Handle refund completed event
     */
    protected function handleRefundCompleted(array $webhookData, string $gateway): void
    {
        DB::transaction(function () use ($webhookData, $gateway) {
            // Find payment record
            $payment = Payment::where('transaction_id', $webhookData['transaction_id'])->first();
            
            if (!$payment) {
                return;
            }

            // Update payment status
            $payment->update([
                'status' => 'refunded',
            ]);

            // Update order status
            $order = $payment->order;
            if ($order) {
                $order->update([
                    'payment_status' => 'refunded',
                ]);

                Log::info('Order payment refunded', [
                    'order_id' => $order->id,
                    'transaction_id' => $webhookData['transaction_id'],
                    'gateway' => $gateway,
                ]);
            }
        });
    }

    /**
     * Handle payment pending event
     */
    protected function handlePaymentPending(array $webhookData, string $gateway): void
    {
        DB::transaction(function () use ($webhookData, $gateway) {
            // Find payment record
            $payment = Payment::where('transaction_id', $webhookData['transaction_id'])->first();
            
            if (!$payment) {
                return;
            }

            // Update payment status
            $payment->update([
                'status' => 'pending',
            ]);

            Log::info('Order payment pending', [
                'payment_id' => $payment->id,
                'transaction_id' => $webhookData['transaction_id'],
                'gateway' => $gateway,
            ]);
        });
    }

    /**
     * Handle payment reversed event (chargebacks, disputes)
     */
    protected function handlePaymentReversed(array $webhookData, string $gateway): void
    {
        DB::transaction(function () use ($webhookData, $gateway) {
            // Find payment record
            $payment = Payment::where('transaction_id', $webhookData['transaction_id'])->first();
            
            if (!$payment) {
                return;
            }

            // Update payment status
            $payment->update([
                'status' => 'reversed',
            ]);

            // Update order status
            $order = $payment->order;
            if ($order) {
                $order->update([
                    'payment_status' => 'reversed',
                ]);

                Log::warning('Order payment reversed', [
                    'order_id' => $order->id,
                    'transaction_id' => $webhookData['transaction_id'],
                    'gateway' => $gateway,
                ]);
            }
        });
    }
}
