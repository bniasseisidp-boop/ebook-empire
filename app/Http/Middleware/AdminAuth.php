<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Hash;

class AdminAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['message' => 'Non autorisé'], 401);
        }

        // Verify token: base64(id:sha256(password+key))
        $decoded = base64_decode($token);
        [$id, $hash] = explode(':', $decoded, 2) + [null, null];

        if (!$id || !$hash) {
            return response()->json(['message' => 'Token invalide'], 401);
        }

        $admin = Admin::find($id);

        if (!$admin) {
            return response()->json(['message' => 'Administrateur introuvable'], 401);
        }

        $expected = hash('sha256', $admin->password . config('app.key'));
        if (!hash_equals($expected, $hash)) {
            return response()->json(['message' => 'Token invalide'], 401);
        }

        return $next($request);
    }
}
