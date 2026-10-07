export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen_url: string | null;
  activo: boolean;
  productos_count?: number;
}