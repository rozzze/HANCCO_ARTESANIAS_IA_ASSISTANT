import { Producto } from '../models/producto.model';

export interface ConsultaOpciones {
  talla?: string;
  cantidad?: number;
}

export function buildConsultaLink(producto: Producto, numero: string, opts: ConsultaOpciones = {}): string {
  const limpio = (numero ?? '').replace(/\D/g, '');
  if (!limpio) return '';

  const tallas = (producto.tallas ?? [])
    .filter((t) => t.activo)
    .map((t) => `${t.talla} (${t.stock_disponible})`)
    .join(', ');

  const lineas: string[] = [
    'Hola Hancco Artesanias! Quiero consultar por esta prenda:',
    '',
    `🧥 ${producto.nombre}`,
    `Material: ${producto.material} · Color: ${producto.color}`,
  ];

  if (tallas) lineas.push(`Tallas (stock): ${tallas}`);

  if (opts.talla) {
    lineas.push(`Talla de interes: ${opts.talla}${opts.cantidad && opts.cantidad > 1 ? ` x${opts.cantidad}` : ''}`);
  }

  lineas.push(
    `Precio referencial: S/ ${Number(producto.precio_venta).toFixed(2)}`,
    '',
    'Foto:',
    producto.imagen_principal_url ?? '(sin foto)'
  );

  return `https://wa.me/${limpio}?text=${encodeURIComponent(lineas.join('\n'))}`;
}
