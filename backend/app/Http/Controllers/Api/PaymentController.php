<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PaymentController extends BaseController
{
    /**
     * Process GCash payment
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function processGCash(Request $request)
    {
        try {
            $request->validate([
                'order_id' => 'required|exists:orders,id',
                'gcash_reference' => 'required|string|max:100',
            ]);

            $user = Auth::user();

            $orderId = $request->input('order_id');
            $order = Order::where('user_id', $user->id)
                ->where('id', $orderId)
                ->first();

            if (!$order) {
                return $this->sendError('Order not found', 404);
            }

            if ($order->payment_status === 'paid') {
                return $this->sendError('Order already paid', 400);
            }

            // TODO: Integrate with actual GCash API in production
            // For now, simulate payment processing

            $payment = Payment::create([
                'order_id' => $order->id,
                'amount' => $order->total_amount,
                'method' => 'gcash',
                'transaction_id' => $request->input('gcash_reference'),
                'status' => 'completed',
                'paid_at' => now(),
            ]);

            // Update order payment status
            $order->payment_status = 'paid';
            $order->save();

            $order->load('orderItems.product');

            return $this->sendResponse([
                'order' => $order,
                'payment' => $payment,
            ], 'Payment processed successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Payment processing failed', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Process Maya payment
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function processMaya(Request $request)
    {
        try {
            $request->validate([
                'order_id' => 'required|exists:orders,id',
            ]);

            $user = Auth::user();
            $orderId = $request->input('order_id');
            $order = Order::where('user_id', $user->id)
                ->where('id', $orderId)
                ->first();

            if (!$order) {
                return $this->sendError('Order not found', 404);
            }

            if ($order->payment_status === 'paid') {
                return $this->sendError('Order already paid', 400);
            }

            // Create Maya payment
            $gateway = \App\Services\Payment\PaymentGatewayFactory::create('maya');
            $result = $gateway->createPayment([
                'amount' => $order->total_amount,
                'currency' => 'PHP',
                'order_id' => $order->id,
                'customer_email' => $user->email,
                'description' => "Order #{$order->id} Payment",
            ]);

            if (!$result['success']) {
                return $this->sendError($result['message'], 400);
            }

            // Create payment record
            $payment = Payment::create([
                'order_id' => $order->id,
                'amount' => $order->total_amount,
                'method' => 'maya',
                'transaction_id' => $result['transaction_id'],
                'status' => 'pending',
            ]);

            return $this->sendResponse([
                'payment' => $payment,
                'payment_url' => $result['payment_url'],
                'transaction_id' => $result['transaction_id'],
            ], 'Maya payment initiated successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Maya payment processing failed', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Record cash payment
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function recordCash(Request $request)
    {
        try {
            $request->validate([
                'order_id' => 'required|exists:orders,id',
            ]);

            $user = Auth::user();

            $orderId = $request->input('order_id');
            $order = Order::where('user_id', $user->id)
                ->where('id', $orderId)
                ->first();

            if (!$order) {
                return $this->sendError('Order not found', 404);
            }

            if ($order->payment_method !== 'cash') {
                return $this->sendError('Order payment method is not cash', 400);
            }

            if ($order->payment_status === 'paid') {
                return $this->sendError('Order already marked as paid', 400);
            }

            $payment = Payment::create([
                'order_id' => $order->id,
                'amount' => $order->total_amount,
                'method' => 'cash',
                'transaction_id' => 'CASH-' . $order->order_number,
                'status' => 'pending',
                'paid_at' => null, // Will be updated when staff confirms receipt
            ]);

            // Keep payment status as pending for cash until confirmed by staff
            $order->payment_status = 'pending';
            $order->save();

            $order->load('orderItems.product');

            return $this->sendResponse([
                'order' => $order,
                'payment' => $payment,
            ], 'Cash payment recorded successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to record cash payment', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Check payment status
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkStatus($id)
    {
        try {
            $user = Auth::user();

            $payment = Payment::whereHas('order', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->where('id', $id)
              ->with('order')
              ->first();

            if (!$payment) {
                return $this->sendError('Payment not found', 404);
            }

            return $this->sendResponse($payment, 'Payment status retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve payment status', 500, ['error' => $e->getMessage()]);
        }
    }
}
