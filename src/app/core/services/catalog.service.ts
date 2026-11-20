import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CatalogStats, Categoria, Producto } from '../models/catalog.models';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly apiUrl = environment.apiUrl;

  /** Indica si los datos actuales provienen del backend real o del modo demostración local */
  readonly isOfflineDemo = signal<boolean>(false);

  private readonly demoCategorias: Categoria[] = [
    {
      id: 1,
      nombre: 'Camisetas y Moda',
      descripcion: 'Prendas de vestir, camisetas oversize, polos y moda casual',
      icono: 'shirt',
      activo: true,
      orden: 1,
      total_productos: 3,
    },
    {
      id: 2,
      nombre: 'Electrodomésticos',
      descripcion: 'Artículos prácticos para la cocina y el hogar moderno',
      icono: 'tv',
      activo: true,
      orden: 2,
      total_productos: 3,
    },
    {
      id: 3,
      nombre: 'Tecnología y Audio',
      descripcion: 'Accesorios electrónicos, audífonos, parlantes y gadgets',
      icono: 'headphones',
      activo: true,
      orden: 3,
      total_productos: 2,
    },
    {
      id: 4,
      nombre: 'Hogar y Decoración',
      descripcion: 'Elementos decorativos, iluminación y organización',
      icono: 'home',
      activo: true,
      orden: 4,
      total_productos: 2,
    },
  ];

  private readonly demoProductos: Producto[] = [
    {
      id: 1,
      categoria_id: 1,
      categoria_nombre: 'Camisetas y Moda',
      codigo: 'CAM-001',
      nombre: 'Camiseta Oversize Heavyweight Negra',
      descripcion: 'Camiseta 100% algodón peruano peinado de 240g, corte boxy relajado y cuello acanalado de alta durabilidad.',
      precio: 65000,
      precio_anterior: 85000,
      imagen_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
      etiquetas: 'Algodón 240g, Oversize, Tallas S-XL',
      destacado: true,
      disponible: true,
    },
    {
      id: 2,
      categoria_id: 2,
      categoria_nombre: 'Electrodomésticos',
      codigo: 'ELE-104',
      nombre: 'Freidora de Aire Digital 5.5 Litros Inox',
      descripcion: 'Panel táctil LED con 8 programas preestablecidos, canasta antiadherente libre de BPA y cocción sin aceite.',
      precio: 289000,
      precio_anterior: 350000,
      imagen_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
      etiquetas: '5.5 Litros, Digital, Garantía 1 Año',
      destacado: true,
      disponible: true,
    },
    {
      id: 3,
      categoria_id: 1,
      categoria_nombre: 'Camisetas y Moda',
      codigo: 'CAM-002',
      nombre: 'Camiseta Básica Essential Blanca',
      descripcion: 'Diseño minimalista ideal para cualquier ocasión. Costuras reforzadas y tacto frío ultra suave.',
      precio: 55000,
      precio_anterior: null,
      imagen_url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
      etiquetas: 'Básica, Algodón, Unisex',
      destacado: false,
      disponible: true,
    },
    {
      id: 4,
      categoria_id: 2,
      categoria_nombre: 'Electrodomésticos',
      codigo: 'ELE-205',
      nombre: 'Cafetera Espresso Italiana & Espumador',
      descripcion: 'Bomba de presión de 15 bares para preparar espresso, cappuccino y latte con espuma cremosa en segundos.',
      precio: 420000,
      precio_anterior: 490000,
      imagen_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80',
      etiquetas: '15 Bares, Acero Inox, Hogar',
      destacado: true,
      disponible: true,
    },
    {
      id: 5,
      categoria_id: 3,
      categoria_nombre: 'Tecnología y Audio',
      codigo: 'TEC-301',
      nombre: 'Audífonos Inalámbricos ANC Pro',
      descripcion: 'Cancelación activa de ruido híbrida, hasta 40 horas de batería continua y carga rápida USB-C.',
      precio: 195000,
      precio_anterior: 240000,
      imagen_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      etiquetas: 'Bluetooth 5.3, ANC, 40h Batería',
      destacado: true,
      disponible: true,
    },
    {
      id: 6,
      categoria_id: 2,
      categoria_nombre: 'Electrodomésticos',
      codigo: 'ELE-310',
      nombre: 'Licuadora de Alta Potencia Vaso de Vidrio',
      descripcion: 'Motor de 800W con cuchillas de acero inoxidable de 6 aspas para triturar hielo y preparar batidos perfectos.',
      precio: 175000,
      precio_anterior: null,
      imagen_url: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80',
      etiquetas: '800W, Vaso Vidrio, 1.5L',
      destacado: false,
      disponible: true,
    },
    {
      id: 7,
      categoria_id: 1,
      categoria_nombre: 'Camisetas y Moda',
      codigo: 'CAM-009',
      nombre: 'Polo Clásico Piqué Azul Navy',
      descripcion: 'Tejido piqué transpirable con cuello tejido y botones nacarados. Corte slim moderno.',
      precio: 78000,
      precio_anterior: 95000,
      imagen_url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80',
      etiquetas: 'Polo, Slim Fit, Elegante',
      destacado: false,
      disponible: true,
    },
    {
      id: 8,
      categoria_id: 4,
      categoria_nombre: 'Hogar y Decoración',
      codigo: 'HOG-401',
      nombre: 'Lámpara Nórdica de Escritorio LED',
      descripcion: 'Iluminación cálida y neutra regulable en 3 niveles con acabado mate minimalista.',
      precio: 110000,
      precio_anterior: null,
      imagen_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
      etiquetas: 'LED, Dimerizable, Nórdica',
      destacado: false,
      disponible: true,
    },
  ];

  constructor(private http: HttpClient) {}

  // ==========================================================================
  // CATEGORÍAS
  // ==========================================================================
  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/categorias`).pipe(
      tap(() => this.isOfflineDemo.set(false)),
      catchError(() => {
        this.isOfflineDemo.set(true);
        return of(this.demoCategorias);
      })
    );
  }

  crearCategoria(payload: Partial<Categoria>): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.apiUrl}/categorias`, payload);
  }

  actualizarCategoria(id: number, payload: Partial<Categoria>): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.apiUrl}/categorias/${id}`, payload);
  }

  eliminarCategoria(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/categorias/${id}`);
  }

  // ==========================================================================
  // PRODUCTOS
  // ==========================================================================
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/productos`).pipe(
      tap(() => this.isOfflineDemo.set(false)),
      catchError(() => {
        this.isOfflineDemo.set(true);
        return of(this.demoProductos);
      })
    );
  }

  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/productos/${id}`);
  }

  crearProducto(payload: Partial<Producto>): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}/productos`, payload);
  }

  actualizarProducto(id: number, payload: Partial<Producto>): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/productos/${id}`, payload);
  }

  eliminarProducto(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/productos/${id}`);
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================
  getStats(): Observable<CatalogStats> {
    return this.http.get<CatalogStats>(`${this.apiUrl}/stats`);
  }
}

