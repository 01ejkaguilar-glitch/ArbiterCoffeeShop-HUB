<?php

namespace App\Http\Controllers\Api;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CartController extends BaseController
{
    /**
     * Get cart contents
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $user = Auth::user();

            // Get or create cart for user
            $cart = Cart::firstOrCreate(
                ['user_id' => $user->id],
                ['user_id' => $user->id]
            );

            $cartItems = CartItem::where('cart_id', $cart->id)
                ->with('product')
                ->get();

            $totalAmount = $cartItems->sum(function ($item) {
                return $item->quantity * $item->product->price;
            });

            $cartData = [
                'cart_id' => $cart->id,
                'items' => $cartItems,
                'total_items' => $cartItems->sum('quantity'),
                'total_amount' => number_format($totalAmount, 2),
            ];

            return $this->sendResponse($cartData, 'Cart retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve cart', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Add item to cart
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function addItem(Request $request)
    {
        try {
            $request->validate([
                'product_id' => 'required|exists:products,id',
                'quantity' => 'required|integer|min:1',
                'customizations' => 'sometimes|array',
            ]);

            $user = Auth::user();

            // Check if product is available
            $productId = $request->input('product_id');
            $product = Product::findOrFail($productId);
            if (!$product->is_available) {
                return $this->sendError('Product is not available', 400);
            }

            // Get or create cart
            $cart = Cart::firstOrCreate(
                ['user_id' => $user->id],
                ['user_id' => $user->id]
            );

            // Check if item already exists in cart
            $existingItem = CartItem::where('cart_id', $cart->id)
                ->where('product_id', $productId)
                ->first();

            $quantity = $request->input('quantity');
            $customizations = $request->has('customizations') ? $request->input('customizations') : null;

            if ($existingItem) {
                // Update quantity
                $existingItem->quantity += $quantity;
                if ($customizations !== null) {
                    $existingItem->customizations = $customizations;
                }
                $existingItem->save();
                $cartItem = $existingItem;
            } else {
                // Create new cart item
                $cartItem = CartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'customizations' => $customizations,
                ]);
            }

            $cartItem->load('product');

            return $this->sendResponse($cartItem, 'Item added to cart successfully', 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to add item to cart', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update cart item
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateItem(Request $request, $id)
    {
        try {
            $request->validate([
                'quantity' => 'required|integer|min:1',
                'customizations' => 'sometimes|array',
            ]);

            $user = Auth::user();
            $cart = Cart::where('user_id', $user->id)->first();

            if (!$cart) {
                return $this->sendError('Cart not found', 404);
            }

            $cartItem = CartItem::where('cart_id', $cart->id)
                ->where('id', $id)
                ->first();

            if (!$cartItem) {
                return $this->sendError('Cart item not found', 404);
            }

            $cartItem->update([
                'quantity' => $request->input('quantity'),
                'customizations' => $request->has('customizations') ? $request->input('customizations') : $cartItem->customizations,
            ]);

            $cartItem->load('product');

            return $this->sendResponse($cartItem, 'Cart item updated successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to update cart item', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Remove item from cart
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function removeItem($id)
    {
        try {
            $user = Auth::user();
            $cart = Cart::where('user_id', $user->id)->first();

            if (!$cart) {
                return $this->sendError('Cart not found', 404);
            }

            $cartItem = CartItem::where('cart_id', $cart->id)
                ->where('id', $id)
                ->first();

            if (!$cartItem) {
                return $this->sendError('Cart item not found', 404);
            }

            $cartItem->delete();

            return $this->sendResponse(null, 'Item removed from cart successfully', 204);

        } catch (\Exception $e) {
            return $this->sendError('Failed to remove item from cart', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Clear cart
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function clear()
    {
        try {
            $user = Auth::user();
            $cart = Cart::where('user_id', $user->id)->first();

            if ($cart) {
                CartItem::where('cart_id', $cart->id)->delete();
            }

            return $this->sendResponse(null, 'Cart cleared successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to clear cart', 500, ['error' => $e->getMessage()]);
        }
    }
}
