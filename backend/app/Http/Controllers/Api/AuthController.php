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
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

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

        $token = $this->crearToken($usuario);

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

        $token = $this->crearToken($usuario);

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

    /**
     * El usuario logueado actualiza SUS propios datos (nunca el rol).
     * Siempre usa $request->user(): no recibe un id, asi nadie puede
     * editar el perfil de otra persona por esta ruta.
     */
    public function actualizarPerfil(Request $request): JsonResponse
    {
        $usuario = $request->user();

        $data = $request->validate([
            'nombres' => ['required', 'string', 'min:2', 'max:120'],
            'correo' => ['required', 'string', 'email', 'max:180', Rule::unique('usuarios', 'correo')->ignore($usuario->id)],
            'telefono' => ['nullable', 'string', 'max:30'],
            'direccion' => ['nullable', 'string', 'max:255'],
        ], self::mensajesUsuario());

        $data['correo'] = mb_strtolower(trim($data['correo']));
        $usuario->update($data);

        return response()->json([
            'message' => 'Tus datos se guardaron correctamente.',
            'data' => new UsuarioResource($usuario->fresh()),
        ]);
    }

    /**
     * Cambia la contrasena del usuario logueado pidiendo la actual.
     * Cierra las demas sesiones (otros dispositivos), pero no la actual.
     */
    public function cambiarContrasena(Request $request): JsonResponse
    {
        $usuario = $request->user();

        $data = $request->validate([
            'contrasena_actual' => ['required', 'string'],
            'contrasena' => ['required', 'confirmed', PasswordRule::min(8)],
        ], self::mensajesUsuario() + [
            'contrasena_actual.required' => 'Escribe tu contraseña actual.',
        ]);

        // 422 (y no 401) para que el frontend no lo confunda con sesion vencida.
        if (!Hash::check($data['contrasena_actual'], $usuario->contrasena)) {
            throw ValidationException::withMessages([
                'contrasena_actual' => 'La contraseña actual no es correcta.',
            ]);
        }

        if (Hash::check($data['contrasena'], $usuario->contrasena)) {
            throw ValidationException::withMessages([
                'contrasena' => 'La nueva contraseña debe ser distinta a la actual.',
            ]);
        }

        $usuario->update(['contrasena' => $data['contrasena']]);

        $tokenActual = $usuario->currentAccessToken();
        $usuario->tokens()
            ->when($tokenActual?->id, fn ($q, $id) => $q->where('id', '!=', $id))
            ->delete();

        return response()->json([
            'message' => 'Tu contraseña se cambió correctamente.',
        ]);
    }

    /**
     * Mensajes en espanol para los campos de usuario (los reusa el admin).
     */
    public static function mensajesUsuario(): array
    {
        return [
            'nombres.required' => 'Escribe tus nombres.',
            'nombres.min' => 'Los nombres deben tener al menos 2 letras.',
            'nombres.max' => 'Los nombres no pueden pasar de 120 caracteres.',
            'correo.required' => 'Escribe un correo.',
            'correo.email' => 'El correo no tiene un formato válido.',
            'correo.max' => 'El correo no puede pasar de 180 caracteres.',
            'correo.unique' => 'Ese correo ya lo usa otra cuenta.',
            'telefono.max' => 'El teléfono no puede pasar de 30 caracteres.',
            'direccion.max' => 'La dirección no puede pasar de 255 caracteres.',
            'rol.in' => 'El rol debe ser admin o cliente.',
            'contrasena.required' => 'Escribe la nueva contraseña.',
            'contrasena.confirmed' => 'Las contraseñas nuevas no coinciden.',
            'contrasena.min' => 'La contraseña debe tener al menos 8 caracteres.',
        ];
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

    /**
     * Crea un token nuevo para el usuario y, de paso, borra sus tokens ya
     * vencidos para que la tabla personal_access_tokens no crezca sin fin.
     */
    private function crearToken(Usuario $usuario): string
    {
        $minutos = config('sanctum.expiration');

        if ($minutos) {
            $usuario->tokens()
                ->where('created_at', '<', now()->subMinutes($minutos))
                ->delete();
        }

        return $usuario->createToken('spa')->plainTextToken;
    }
}
