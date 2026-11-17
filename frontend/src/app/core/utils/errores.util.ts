import { HttpErrorResponse } from '@angular/common/http';

/**
 * Saca un mensaje claro del error que devuelve el backend:
 * primero el del campo que fallo (validacion 422), si no el mensaje general.
 */
export function mensajeDeError(err: unknown, porDefecto = 'Ocurrio un error. Intenta de nuevo.'): string {
  const e = err as HttpErrorResponse;
  if (e?.status === 0) return 'No hay conexion con el servidor. Verifica tu internet.';
  const campos = e?.error?.errors as Record<string, string[]> | undefined;
  const primero = campos ? Object.values(campos)[0]?.[0] : undefined;
  return primero || e?.error?.message || porDefecto;
}

/** Devuelve { campo: 'mensaje' } para mostrar cada error debajo de su input. */
export function erroresPorCampo(err: unknown): Record<string, string> {
  const campos = (err as HttpErrorResponse)?.error?.errors as Record<string, string[]> | undefined;
  const out: Record<string, string> = {};
  if (campos) for (const [k, v] of Object.entries(campos)) out[k] = v[0];
  return out;
}
