<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UsuarioResource;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function update(Request $request, Usuario $usuario): JsonResponse
    {
        $data = $request->validate([
            'nombres' => ['sometimes', 'string', 'max:120'],
            'correo' => ['sometimes', 'email', 'max:180', 'unique:usuarios,correo,'.$usuario->id],
            'rol' => ['sometimes', 'in:admin,cliente'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'direccion' => ['nullable', 'string', 'max:255'],
        ]);

        $usuario->update($data);

        return response()->json([
            'message' => 'Usuario actualizado.',
            'data' => new UsuarioResource($usuario),
        ]);
    }

    public function destroy(Usuario $usuario): JsonResponse
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