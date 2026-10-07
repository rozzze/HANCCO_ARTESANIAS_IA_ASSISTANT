<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UsuarioResource;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombres' => ['required', 'string', 'max:120'],
            'correo' => ['required', 'string', 'email', 'max:180', 'unique:usuarios,correo'],
            'contrasena' => ['required', 'confirmed', Password::min(8)],
            'telefono' => ['nullable', 'string', 'max:30'],
            'direccion' => ['nullable', 'string', 'max:255'],
        ]);

        $usuario = Usuario::create([
            'nombres' => $data['nombres'],
            'correo' => $data['correo'],
            'contrasena' => $data['contrasena'],
            'rol' => 'cliente',
            'telefono' => $data['telefono'] ?? null,
            'direccion' => $data['direccion'] ?? null,
        ]);

        $token = $usuario->createToken('spa')->plainTextToken;

        return response()->json([
            'message' => 'Registro exitoso.',
            'data' => [
                'usuario' => new UsuarioResource($usuario),
                'token' => $token,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'correo' => ['required', 'email'],
            'contrasena' => ['required', 'string'],
        ]);

        $usuario = Usuario::where('correo', $data['correo'])->first();

        if (!$usuario || !Hash::check($data['contrasena'], $usuario->contrasena)) {
            return response()->json([
                'message' => 'Credenciales invalidas.',
            ], 401);
        }

        $token = $usuario->createToken('spa')->plainTextToken;

        return response()->json([
            'message' => 'Bienvenido.',
            'data' => [
                'usuario' => new UsuarioResource($usuario),
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesion cerrada.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new UsuarioResource($request->user()),
        ]);
    }
}