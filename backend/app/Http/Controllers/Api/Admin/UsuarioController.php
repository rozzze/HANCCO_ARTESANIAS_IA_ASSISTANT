<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Controller;
use App\Http\Resources\UsuarioResource;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password as PasswordRule;

class UsuarioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Usuario::query();

        if ($request->filled('rol')) {
            $query->where('rol', $request->string('rol'));
        }

        if ($request->filled('buscar')) {
            $buscar = '%'.$request->string('buscar').'%';
            $query->where(function ($q) use ($buscar) {
                $q->where('nombres', 'like', $buscar)
                    ->orWhere('correo', 'like', $buscar);
            });
        }

        $perPage = min($request->integer('per_page', 25), 100);
        $usuarios = $query->latest()->paginate($perPage);

        return response()->json([
            'data' => UsuarioResource::collection($usuarios),
        ]);
    }

    public function show(Usuario $usuario): JsonResponse
    {
        return response()->json([
            'data' => new UsuarioResource($usuario),
        ]);
    }

    /**
     * El admin edita los datos de cualquier usuario. La contrasena es
     * opcional: si viene, se le asigna una nueva y se cierran sus sesiones.
     */
    public function update(Request $request, Usuario $usuario): JsonResponse
    {
        $data = $request->validate([
            'nombres' => ['sometimes', 'required', 'string', 'min:2', 'max:120'],
            'correo' => ['sometimes', 'required', 'string', 'email', 'max:180', Rule::unique('usuarios', 'correo')->ignore($usuario->id)],
            'rol' => ['sometimes', 'required', 'in:admin,cliente'],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:30'],
            'direccion' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contrasena' => ['sometimes', 'nullable', 'confirmed', PasswordRule::min(8)],
        ], AuthController::mensajesUsuario() + [
            'nombres.required' => 'Escribe los nombres del usuario.',
        ]);

        // Evita que el admin se quite a si mismo el rol y se quede sin acceso.
        $esElMismo = $usuario->id === $request->user()->id;
        if ($esElMismo && isset($data['rol']) && $data['rol'] !== 'admin') {
            return response()->json([
                'message' => 'No puedes quitarte tu propio rol de administrador.',
                'errors' => ['rol' => ['No puedes quitarte tu propio rol de administrador.']],
            ], 422);
        }

        if (isset($data['correo'])) {
            $data['correo'] = mb_strtolower(trim($data['correo']));
        }

        $nuevaContrasena = $data['contrasena'] ?? null;
        unset($data['contrasena']);
        if ($nuevaContrasena) {
            $data['contrasena'] = $nuevaContrasena;
        }

        $usuario->update($data);

        // Con contrasena nueva, cierra sus sesiones abiertas (salvo la del
        // propio admin si se esta editando a si mismo).
        if ($nuevaContrasena) {
            $usuario->tokens()
                ->when($esElMismo, fn ($q) => $q->where('id', '!=', $request->user()->currentAccessToken()?->id))
                ->delete();
        }

        return response()->json([
            'message' => 'Usuario actualizado.',
            'data' => new UsuarioResource($usuario->fresh()),
        ]);
    }

    public function destroy(Request $request, Usuario $usuario): JsonResponse
    {
        if ($usuario->id === $request->user()->id) {
            return response()->json([
                'message' => 'No puedes eliminarte a ti mismo.',
            ], 422);
        }

        $usuario->delete();

        return response()->json([
            'message' => 'Usuario eliminado.',
        ]);
    }
}
