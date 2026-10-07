import { Categoria } from './categoria.model';

export interface Imagen {
  id: number;
  producto_id: number;
  url_cloudflare_s3: string;
  generada_ia: boolean;
  metadata_ia: any | null;
  es_principal: boolean;
  orden: number;
  created_at?: string;
}

export interface ProductoTalla {
  id: number;
  producto_id: number;
  talla: string;
  stock_disponible: number;
  activo: boolean;
}

export interface Producto {
  id: number;
  categoria_id: number;
  categoria?: Categoria;
  nombre: string;
  slug: string;
  material: string;
  color: string;
  precio_venta: number;
  stock_disponible: number;
  tallas?: ProductoTalla[];
  descripcion_ia: string | null;
  descripcion_manual: string | null;
  activo: boolean;
  imagenes?: Imagen[];
  imagen_principal_url: string | null;
  created_at?: string;
}