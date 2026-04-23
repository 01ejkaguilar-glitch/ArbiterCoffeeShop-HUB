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
     * Build a normalised cart response with items, subtotal, etc.
     */
    private function cartResponse(Cart $cart): array
    {
        $cartItems = CartItem::where('cart_id', $cart->id)
            ->with('product')
            ->get();

        // Map items so every item carries unit_price from product
        $items = $cartItems->map(function ($item) {
            return [
                'id'                   => $item->id,
                'cart_id'              => $item->cart_id,
                'product_id'           => $item->product_id,
                'quantity'             => $item->quantity,
                'unit_price'           => (float) ($item->product->price ?? 0),
                'customizations'       => $item->customizations,
                'special_instructions' => $item->customizations['special_instructions'] ?? null,
                'product'              => $item->product,
                'created_at'           => $item->created_at,
                'updated_at'           => $item->updated_at,
            ];
        });

        $subtotal = $items->sum(fn($i) => $i['unit_price'] * $i['quantity']);

        return [
            'cart_id'      => $cart->id,
            'items'        => $items->values(),
            'subtotal'     => round($subtotal, 2),
            'total_items'  => $items->sum('quantity'),
            'total_amount' => round($subtotal, 2),
        ];
    }

    /**
     * Get cart contents
     */
    public function index()
    {
        try {
            $user = Auth::user();

            $cart = Cart::firstOrCreate(
                ['user_id' => $user->id],
                ['user_id' => $user->id]
            );

            return $this->sendResponse($this->cartResponse($cart), 'Cart retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve cart', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Add item to cart
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

            $productId = $request->input('product_id');
            $product = Product::findOrFail($productId);
            if (!$product->is_available) {
                return $this->sendError('Product is not available', 400);
            }

            $cart = Cart::firstOrCreate(
                ['user_id' => $user->id],
                ['user_id' => $user->id]
            );

            $existingItem = CartItem::where('cart_id', $cart->id)
                ->where('product_id', $productId)
                ->first();

            $quantity = $request->input('quantity');
            $customizations = $request->has('customizations') ? $request->input('customizations') : null;

            if ($existingItem) {
                $existingItem->quantity += $quantity;
                if ($customizations !== null) {
                    $existingItem->customizations = $customizations;
                }
                $existingItem->save();
            } else {
                CartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'customizations' => $customizations,
                ]);
            }

            return $this->sendResponse($this->cartResponse($cart), 'Item added to cart successfully', 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to add item to cart', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update cart item
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

            return $this->sendResponse($this->cartResponse($cart), 'Cart item updated successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to update cart item', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Remove item from cart
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

            return $this->sendResponse($this->cartResponse($cart), 'Item removed from cart successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to remove item from cart', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Clear cart
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
