<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ManiquiResource;
use App\Models\Maniqui;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManiquiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Maniqui::with('categoria')->where('activo', true);

        if ($request->filled('categoria_id')) {
            $categoriaId = $request->integer('categoria_id');
            $query->where(function ($q) use ($categoriaId) {
                $q->whereNull('categoria_id')->orWhere('categoria_id', $categoriaId);
            });
        } elseif ($request->filled('categoria_slug')) {
            $slug = $request->string('categoria_slug');
            $query->where(function ($q) use ($slug) {
                $q->whereNull('categoria_id')
                    ->orWhereHas('categoria', fn ($c) => $c->where('slug', $slug));
            });
        }

        $maniquies = $query->orderBy('nombre')->get();

        return response()->json([
            'data' => ManiquiResource::collection($maniquies),
        ]);
    }
}
