export interface Usuario {
  id: number;
  nombres: string;
  correo: string;
  rol: 'admin' | 'cliente';
  telefono: string | null;
  direccion: string | null;
  created_at?: string;
}

export interface AuthResponse {
  message: string;
  data: {
    usuario: Usuario;
    token: string;
  };
}