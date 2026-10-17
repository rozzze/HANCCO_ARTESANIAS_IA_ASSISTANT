<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UsuarioResource;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombres' => ['required', 'string', 'max:120'],
            'correo' => ['required', 'string', 'email', 'max:180', 'unique:usuarios,correo'],
            'contrasena' => ['required', 'confirmed', PasswordRule::min(8)],
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

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'correo' => ['required', 'string', 'email', 'max:180'],
        ]);

        // Dispara el email solo si la cuenta existe, pero la respuesta es
        // siempre la misma para no revelar que correos estan registrados.
        Password::sendResetLink(['correo' => $request->string('correo')->lower()->toString()]);

        return response()->json([
            'message' => 'Si existe una cuenta con ese correo, enviamos las instrucciones para restablecer tu contrasena.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'correo' => ['required', 'string', 'email', 'max:180'],
            'token' => ['required', 'string'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
            'password_confirmation' => ['required', 'string'],
        ]);

        $status = Password::reset(
            [
                'correo' => $request->string('correo')->lower()->toString(),
                'token' => $data['token'],
                'password' => $data['password'],
                'password_confirmation' => $data['password_confirmation'],
            ],
            function (Usuario $user, string $password) {
                $user->forceFill(['contrasena' => $password])->save();
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => match ($status) {
                    Password::INVALID_USER => 'No encontramos una cuenta con ese correo.',
                    Password::INVALID_TOKEN => 'El enlace de recuperacion es invalido o ya expiro. Solicita uno nuevo.',
                    default => 'No pudimos restablecer la contrasena. Intenta de nuevo.',
                },
            ], 422);
        }

        return response()->json([
            'message' => 'Contrasena actualizada. Ya puedes ingresar con tu nueva contrasena.',
        ]);
    }
}