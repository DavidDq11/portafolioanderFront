import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BulkProductosPayload,
  BulkProductosResponse,
  CatalogStats,
  Categoria,
  Producto,
} from '../models/catalog.models';

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
      precio_anterior: null,
      imagen_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
      imagenes: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
      ],
      etiquetas: 'Algodón 240g, Oversize, Tallas S-XL',
      destacado: false,
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
      precio_anterior: null,
      imagen_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
      imagenes: [
        'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
      ],
      etiquetas: '5.5 Litros, Digital, Garantía 1 Año',
      destacado: false,
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
      imagenes: [
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
      ],
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
      precio_anterior: null,
      imagen_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80',
      imagenes: [
        'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80',
      ],
      etiquetas: '15 Bares, Acero Inox, Hogar',
      destacado: false,
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
      precio_anterior: null,
      imagen_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      imagenes: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
      ],
      etiquetas: 'Bluetooth 5.3, ANC, 40h Batería',
      destacado: false,
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
      imagenes: [
        'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80',
      ],
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
      precio_anterior: null,
      imagen_url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80',
      imagenes: [
        'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80',
      ],
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
      imagenes: [
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
      ],
      etiquetas: 'LED, Dimerizable, Nórdica',
      destacado: false,
      disponible: true,
    },
  ];

  constructor(private http: HttpClient) {}

  // ==========================================================================
  // NORMALIZACIÓN DE IMÁGENES
  // ==========================================================================
  private normalizeImagenes(rawImagenes: unknown, imagenUrl?: string): string[] {
    let list: string[] = [];

    if (Array.isArray(rawImagenes)) {
      list = rawImagenes.map((u) => String(u || '').trim()).filter(Boolean);
    } else if (typeof rawImagenes === 'string' && rawImagenes.trim()) {
      try {
        const parsed = JSON.parse(rawImagenes);
        if (Array.isArray(parsed)) {
          list = parsed.map((u) => String(u || '').trim()).filter(Boolean);
        }
      } catch {
        list = rawImagenes
          .split(/[\n,|]/)
          .map((u) => u.trim())
          .filter(Boolean);
      }
    }

    const cover = (imagenUrl || '').trim();
    if (cover && !list.includes(cover)) {
      list.unshift(cover);
    }

    return Array.from(new Set(list));
  }

  private normalizeProducto(prod: Producto): Producto {
    const imagenes = this.normalizeImagenes(prod.imagenes, prod.imagen_url);
    return {
      ...prod,
      imagen_url: prod.imagen_url || imagenes[0] || '',
      imagenes,
    };
  }

  private prepareProductoPayload(payload: Partial<Producto>): Partial<Producto> {
    const imagenes = this.normalizeImagenes(payload.imagenes, payload.imagen_url);
    return {
      ...payload,
      imagen_url: imagenes[0] || payload.imagen_url || '',
      imagenes,
    };
  }

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
      map((list) => list.map((p) => this.normalizeProducto(p))),
      tap(() => this.isOfflineDemo.set(false)),
      catchError(() => {
        this.isOfflineDemo.set(true);
        return of(this.demoProductos.map((p) => this.normalizeProducto(p)));
      })
    );
  }

  getProductoById(id: number): Observable<Producto> {
    return this.http
      .get<Producto>(`${this.apiUrl}/productos/${id}`)
      .pipe(map((p) => this.normalizeProducto(p)));
  }

  crearProducto(payload: Partial<Producto>): Observable<Producto> {
    return this.http
      .post<Producto>(`${this.apiUrl}/productos`, this.prepareProductoPayload(payload))
      .pipe(map((p) => this.normalizeProducto(p)));
  }

  crearProductosMasivo(payload: BulkProductosPayload): Observable<BulkProductosResponse> {
    const normalizedPayload: BulkProductosPayload = {
      categoria_id: payload.categoria_id,
      productos: payload.productos.map((p) =>
        this.prepareProductoPayload({
          ...p,
          categoria_id: payload.categoria_id,
          precio_anterior: null,
          destacado: false,
          disponible: p.disponible ?? true,
        })
      ),
    };

    return this.http
      .post<BulkProductosResponse>(`${this.apiUrl}/productos/bulk`, normalizedPayload)
      .pipe(
        map((res) => ({
          ...res,
          creados: res.creados ?? res.productos?.length ?? normalizedPayload.productos.length,
          productos: (res.productos || []).map((p) => this.normalizeProducto(p)),
        })),
        catchError((err: HttpErrorResponse) => {
          // Si el backend aún no tiene /productos/bulk (404), crea uno por uno como respaldo
          if (err.status === 404 && normalizedPayload.productos.length > 0) {
            return forkJoin(
              normalizedPayload.productos.map((item) => this.crearProducto(item))
            ).pipe(
              map((productos) => ({
                creados: productos.length,
                productos,
              }))
            );
          }
          return throwError(() => err);
        })
      );
  }

  actualizarProducto(id: number, payload: Partial<Producto>): Observable<Producto> {
    return this.http
      .put<Producto>(`${this.apiUrl}/productos/${id}`, this.prepareProductoPayload(payload))
      .pipe(map((p) => this.normalizeProducto(p)));
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
