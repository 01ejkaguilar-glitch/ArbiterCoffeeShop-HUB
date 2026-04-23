<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\PasswordReset;

class AuthController extends BaseController
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/', // At least 1 lowercase, 1 uppercase, 1 number
            ],
        ], [
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        $user = User::create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'password' => Hash::make($request->input('password')),
        ]);

        // Assign default role (customer)
        $user->assignRole('customer');

        $token = $user->createToken('auth_token', ['*'], now()->addDays(7))->plainTextToken;

        return $this->sendResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => 'customer'
            ],
            'token' => $token,
            'expires_in' => '7 days'
        ], 'User registered successfully', 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        $email = $request->input('email');
        $password = $request->input('password');

        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return $this->sendError('Invalid credentials', 401);
        }

        // Revoke old tokens for security (optional - keep only latest session)
        // $user->tokens()->delete();

        $rememberMe = $request->boolean('rememberMe');
        $expiresAt = $rememberMe ? now()->addDays(30) : now()->addDays(7);
        $token = $user->createToken('auth_token', ['*'], $expiresAt)->plainTextToken;

        // Get user roles
        $roles = $user->getRoleNames();

        // Assign default customer role if no roles assigned
        if ($roles->isEmpty()) {
            $user->assignRole('customer');
            $roles = $user->getRoleNames();
        }

        $primaryRole = $roles->first() ?? 'customer';

        return $this->sendResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $primaryRole,
                'roles' => $roles
            ],
            'token' => $token,
            'expires_in' => $rememberMe ? '30 days' : '7 days'
        ], 'Login successful');
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->sendResponse(null, 'Logged out successfully');
    }

    /**
     * Get authenticated user
     */
    public function user(Request $request)
    {
        $user = $request->user();
        $roles = $user->getRoleNames();
        $primaryRole = $roles->first() ?? 'customer';

        return $this->sendResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $primaryRole,
                'roles' => $roles,
                'permissions' => $user->getAllPermissions()->pluck('name')
            ]
        ]);
    }

    /**
     * Refresh authentication token
     */
    public function refreshToken(Request $request)
    {
        $user = $request->user();

        // Delete current token
        $user->currentAccessToken()->delete();

        // Create new token with 7-day expiration
        $token = $user->createToken('auth_token', ['*'], now()->addDays(7))->plainTextToken;

        return $this->sendResponse([
            'token' => $token,
            'expires_in' => '7 days'
        ], 'Token refreshed successfully');
    }

    /**
     * Send password reset link
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Please enter a valid email address', 422, $validator->errors()->toArray());
        }

        // Always return success to prevent email enumeration
        Password::sendResetLink($request->only('email'));

        return $this->sendResponse(null, 'If an account with that email exists, a password reset link has been sent.');
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required',
            'email' => 'required|email',
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/',
            ],
        ], [
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors()->toArray());
        }

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ])->setRememberToken(Str::random(60));

                $user->save();

                event(new PasswordReset($user));

                // Revoke all tokens for security
                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return $this->sendResponse(null, 'Password reset successfully. Please login with your new password.');
        }

        return $this->sendError(__($status), 400);
    }
}
