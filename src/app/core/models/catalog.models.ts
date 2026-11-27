export interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  icono?: string;
  activo: boolean;
  orden?: number;
  total_productos?: number;
  creado_en?: string;
}

export interface Producto {
  id: number;
  categoria_id: number | null;
  categoria_nombre?: string;
  categoria_icono?: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  precio_anterior?: number | null;
  imagen_url?: string;
  imagenes?: string[];
  etiquetas?: string;
  destacado: boolean;
  disponible: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

export interface BulkProductosPayload {
  categoria_id: number | null;
  productos: Partial<Producto>[];
}

export interface BulkProductosResponse {
  creados: number;
  productos: Producto[];
  message?: string;
}

export interface CatalogStats {
  totalProductos: number;
  productosDisponibles: number;
  productosDestacados: number;
  totalCategorias: number;
}
