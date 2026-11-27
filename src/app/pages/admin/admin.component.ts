import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { AuthService } from '../../core/services/auth.service';
import { Categoria, Producto } from '../../core/models/catalog.models';

interface BulkRowDraft {
  nombre: string;
  precio: number | null;
  codigo: string;
  etiquetas: string;
  descripcion: string;
  imagenesText: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <!-- Top Admin Navbar -->
      <header class="bg-black border-b border-zinc-800 sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2.5 sm:gap-4">
          <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div class="w-8 h-8 sm:w-9 sm:h-9 bg-white text-black flex items-center justify-center font-mono font-bold text-xs shrink-0">
              AD
            </div>
            <div class="min-w-0">
              <h1 class="text-xs sm:text-sm font-bold uppercase tracking-wider leading-none text-white truncate">
                Panel Admin
              </h1>
              <p class="text-[10px] sm:text-[11px] font-mono text-zinc-500 mt-1 truncate">
                {{ authService.currentUser()?.email || 'Administrador' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <a
              routerLink="/"
              class="px-2.5 sm:px-3.5 py-1.5 sm:py-2 border border-zinc-800 hover:border-white text-zinc-300 hover:text-white text-[10px] sm:text-[11px] font-mono uppercase tracking-wider transition-colors"
            >
              <span class="sm:hidden">Catálogo ↗</span>
              <span class="hidden sm:inline">Ver Catálogo ↗</span>
            </a>
            <button
              type="button"
              (click)="authService.logout()"
              class="px-2.5 sm:px-3.5 py-1.5 sm:py-2 border border-zinc-800 hover:bg-white hover:text-black text-zinc-400 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8">
        <!-- Offline warning if backend is not running -->
        <div
          *ngIf="catalogService.isOfflineDemo()"
          class="mb-6 p-4 border border-zinc-700 bg-[#111113] text-zinc-300 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <strong class="text-white uppercase">Modo local:</strong>
            Sin conexión al backend. Estás viendo datos de demostración; conecta el servidor para guardar cambios reales.
          </div>
          <button
            type="button"
            (click)="cargarDatos()"
            class="px-3.5 py-2 bg-white text-black font-bold uppercase tracking-wider whitespace-nowrap self-start sm:self-auto"
          >
            Reintentar
          </button>
        </div>

        <!-- Feedback Toast -->
        <div
          *ngIf="toastMessage()"
          class="mb-6 p-4 bg-white text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-between"
        >
          <span>{{ toastMessage() }}</span>
          <button type="button" (click)="toastMessage.set('')" class="text-black/70 hover:text-black">✕</button>
        </div>

        <!-- KPI Stats Cards -->
        <div class="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div class="bg-[#111113] p-4 sm:p-5 border border-zinc-800">
            <span class="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-zinc-500">Productos</span>
            <p class="text-2xl sm:text-3xl font-mono font-bold text-white mt-1.5">{{ productos().length }}</p>
          </div>
          <div class="bg-[#111113] p-4 sm:p-5 border border-zinc-800">
            <span class="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-zinc-500">Visibles</span>
            <p class="text-2xl sm:text-3xl font-mono font-bold text-white mt-1.5">{{ totalDisponibles() }}</p>
          </div>
          <div class="bg-[#111113] p-4 sm:p-5 border border-zinc-800">
            <span class="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-zinc-500">Categorías</span>
            <p class="text-2xl sm:text-3xl font-mono font-bold text-white mt-1.5">{{ categorias().length }}</p>
          </div>
        </div>

        <!-- Tabs & Primary Actions -->
        <div class="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-6">
          <div class="inline-flex border border-zinc-800 bg-black">
            <button
              type="button"
              (click)="activeTab.set('productos')"
              [class]="activeTab() === 'productos'
                ? 'px-4 sm:px-5 py-2.5 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider bg-white text-black transition-colors'
                : 'px-4 sm:px-5 py-2.5 text-[11px] sm:text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors'"
            >
              Productos [{{ productos().length }}]
            </button>
            <button
              type="button"
              (click)="activeTab.set('categorias')"
              [class]="activeTab() === 'categorias'
                ? 'px-4 sm:px-5 py-2.5 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider bg-white text-black transition-colors'
                : 'px-4 sm:px-5 py-2.5 text-[11px] sm:text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors'"
            >
              Categorías [{{ categorias().length }}]
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <ng-container *ngIf="activeTab() === 'productos'">
              <button
                type="button"
                (click)="abrirModalMasivo()"
                class="px-3.5 sm:px-4 py-2.5 border border-zinc-600 hover:border-white bg-black text-white text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-colors"
              >
                ↑ Subida Masiva
              </button>
              <button
                type="button"
                (click)="abrirModalProducto()"
                class="px-4 sm:px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-colors"
              >
                + Nuevo Producto
              </button>
            </ng-container>

            <button
              *ngIf="activeTab() === 'categorias'"
              type="button"
              (click)="abrirModalCategoria()"
              class="px-4 sm:px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              + Nueva Categoría
            </button>
          </div>
        </div>

        <!-- TAB 1: GESTIÓN DE PRODUCTOS -->
        <section *ngIf="activeTab() === 'productos'" class="bg-[#111113] border border-zinc-800 overflow-hidden">
          <!-- Filters Bar -->
          <div class="p-4 border-b border-zinc-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div class="w-full sm:max-w-md relative">
              <input
                type="text"
                [ngModel]="searchProducto()"
                (ngModelChange)="searchProducto.set($event)"
                placeholder="Buscar por nombre, código o etiqueta..."
                class="w-full pl-9 pr-4 py-2 bg-black text-sm text-white placeholder-zinc-500 border border-zinc-800 focus:border-white outline-none"
              />
              <svg class="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              [ngModel]="filterCategoriaId()"
              (ngModelChange)="filterCategoriaId.set($event)"
              class="w-full sm:w-auto px-3.5 py-2 bg-black border border-zinc-800 text-xs font-mono uppercase text-zinc-200 outline-none focus:border-white"
            >
              <option [ngValue]="null">Todas las categorías</option>
              <option *ngFor="let c of categorias()" [ngValue]="c.id">
                {{ c.nombre }}
              </option>
            </select>
          </div>

          <!-- Mobile Products Cards -->
          <div class="md:hidden divide-y divide-zinc-800/80">
            <div *ngFor="let prod of productosAdminFiltrados()" class="p-4 space-y-3">
              <div class="flex items-start gap-3">
                <div class="relative shrink-0">
                  <img
                    [src]="getProductCover(prod)"
                    (error)="onImageError($event)"
                    [alt]="prod.nombre"
                    class="w-16 h-16 object-cover bg-zinc-950 border border-zinc-800"
                  />
                  <span
                    *ngIf="getProductImageCount(prod) > 1"
                    class="absolute bottom-0.5 right-0.5 px-1 bg-black/90 text-white text-[9px] font-mono border border-zinc-700"
                  >
                    {{ getProductImageCount(prod) }}
                  </span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-[10px] font-mono uppercase text-zinc-500 truncate">
                    {{ prod.categoria_nombre || 'Sin categoría' }}
                    <span *ngIf="prod.codigo"> · {{ prod.codigo }}</span>
                  </div>
                  <div class="font-bold text-white text-sm leading-snug mt-0.5">{{ prod.nombre }}</div>
                  <div class="mt-1 font-mono font-bold text-white text-sm">
                    {{ formatPrice(prod.precio) }}
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between gap-2 pt-2 border-t border-zinc-900">
                <button
                  type="button"
                  (click)="toggleDisponible(prod)"
                  [class]="prod.disponible
                    ? 'px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase border border-white text-white'
                    : 'px-2.5 py-1.5 text-[10px] font-mono uppercase border border-zinc-800 text-zinc-600'"
                >
                  {{ prod.disponible ? 'Visible' : 'Oculto' }}
                </button>

                <div class="flex items-center gap-1.5 font-mono">
                  <button
                    type="button"
                    (click)="abrirModalProducto(prod)"
                    class="px-3 py-1.5 border border-zinc-700 text-zinc-200 text-[10px] uppercase"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    (click)="eliminarProducto(prod)"
                    class="px-3 py-1.5 border border-zinc-800 text-zinc-400 text-[10px] uppercase"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            </div>

            <div *ngIf="productosAdminFiltrados().length === 0" class="py-10 text-center font-mono text-xs uppercase text-zinc-500">
              No hay productos que coincidan con la búsqueda.
            </div>
          </div>

          <!-- Desktop Products Table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-zinc-800 text-[10px] font-mono uppercase tracking-widest text-zinc-500 bg-black/50">
                  <th class="py-3.5 px-4">Producto</th>
                  <th class="py-3.5 px-4">Categoría</th>
                  <th class="py-3.5 px-4">Precio</th>
                  <th class="py-3.5 px-4 text-center">Visible</th>
                  <th class="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800/80 text-sm">
                <tr
                  *ngFor="let prod of productosAdminFiltrados()"
                  class="hover:bg-zinc-900/50 transition-colors"
                >
                  <td class="py-3.5 px-4">
                    <div class="flex items-center gap-3">
                      <div class="relative shrink-0">
                        <img
                          [src]="getProductCover(prod)"
                          (error)="onImageError($event)"
                          [alt]="prod.nombre"
                          class="w-12 h-12 object-cover bg-zinc-950 border border-zinc-800"
                        />
                        <span
                          *ngIf="getProductImageCount(prod) > 1"
                          class="absolute -bottom-1 -right-1 px-1 bg-white text-black text-[9px] font-mono font-bold"
                        >
                          {{ getProductImageCount(prod) }}
                        </span>
                      </div>
                      <div>
                        <div class="font-bold text-white">{{ prod.nombre }}</div>
                        <div class="text-[11px] font-mono text-zinc-500 flex items-center gap-2 mt-0.5">
                          <span *ngIf="prod.codigo">{{ prod.codigo }}</span>
                          <span *ngIf="getProductImageCount(prod) > 1">{{ getProductImageCount(prod) }} fotos</span>
                          <span *ngIf="prod.etiquetas" class="truncate max-w-[200px]">// {{ prod.etiquetas }}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="py-3.5 px-4">
                    <span class="px-2 py-1 border border-zinc-800 text-zinc-300 text-[11px] font-mono uppercase">
                      {{ prod.categoria_nombre || 'Sin categoría' }}
                    </span>
                  </td>

                  <td class="py-3.5 px-4 font-mono">
                    <div class="font-bold text-white">{{ formatPrice(prod.precio) }}</div>
                  </td>

                  <td class="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      (click)="toggleDisponible(prod)"
                      [class]="prod.disponible
                        ? 'px-2.5 py-1 text-[10px] font-mono font-bold uppercase border border-white text-white'
                        : 'px-2.5 py-1 text-[10px] font-mono uppercase border border-zinc-800 text-zinc-600'"
                    >
                      {{ prod.disponible ? 'Visible' : 'Oculto' }}
                    </button>
                  </td>

                  <td class="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                    <button
                      type="button"
                      (click)="abrirModalProducto(prod)"
                      class="px-3 py-1.5 border border-zinc-700 hover:border-white text-zinc-200 hover:text-white text-[11px] uppercase mr-1.5 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      (click)="eliminarProducto(prod)"
                      class="px-3 py-1.5 border border-zinc-800 hover:bg-white hover:text-black text-zinc-400 text-[11px] uppercase transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>

                <tr *ngIf="productosAdminFiltrados().length === 0">
                  <td colspan="5" class="py-12 text-center font-mono text-xs uppercase text-zinc-500">
                    No hay productos que coincidan con la búsqueda.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- TAB 2: GESTIÓN DE CATEGORÍAS -->
        <section *ngIf="activeTab() === 'categorias'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            *ngFor="let cat of categorias()"
            class="bg-[#111113] p-6 border border-zinc-800 flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  ORDEN #{{ cat.orden || 0 }}
                </span>
                <span
                  [class]="cat.activo
                    ? 'px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-white text-black'
                    : 'px-2 py-0.5 text-[10px] font-mono uppercase border border-zinc-800 text-zinc-500'"
                >
                  {{ cat.activo ? 'Activa' : 'Inactiva' }}
                </span>
              </div>

              <h3 class="text-lg font-bold text-white uppercase tracking-wide mt-4">{{ cat.nombre }}</h3>
              <p class="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                {{ cat.descripcion || 'Sin descripción adicional' }}
              </p>
            </div>

            <div class="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-end gap-2 font-mono">
              <button
                type="button"
                (click)="abrirModalCategoria(cat)"
                class="px-3 py-1.5 border border-zinc-700 hover:border-white text-zinc-200 hover:text-white text-[11px] uppercase transition-colors"
              >
                Editar
              </button>
              <button
                type="button"
                (click)="eliminarCategoria(cat)"
                class="px-3 py-1.5 border border-zinc-800 hover:bg-white hover:text-black text-zinc-400 text-[11px] uppercase transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </section>
      </main>

      <!-- ================================================================== -->
      <!-- MODAL CREAR / EDITAR PRODUCTO (CON GALERÍA MULTI-IMAGEN)           -->
      <!-- ================================================================== -->
      <div
        *ngIf="showProductoModal()"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <div class="bg-[#111113] max-w-2xl w-full p-5 sm:p-8 border border-zinc-800 my-auto max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-4 border-b border-zinc-800">
            <h2 class="text-lg font-bold uppercase tracking-wider text-white">
              {{ editingProductoId() ? 'Editar Producto' : 'Nuevo Producto' }}
            </h2>
            <button
              type="button"
              (click)="showProductoModal.set(false)"
              class="w-8 h-8 border border-zinc-800 hover:border-white flex items-center justify-center text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <form (ngSubmit)="guardarProducto()" class="mt-5 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Nombre del Producto *</label>
                <input
                  type="text"
                  name="nombre"
                  [(ngModel)]="prodForm.nombre"
                  required
                  placeholder="Ej: Tenis Air Black / Camiseta Oversize"
                  class="w-full px-3.5 py-2.5 bg-black border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-white outline-none"
                />
              </div>

              <div>
                <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Código / SKU</label>
                <input
                  type="text"
                  name="codigo"
                  [(ngModel)]="prodForm.codigo"
                  placeholder="Ej: ZAP-001"
                  class="w-full px-3.5 py-2.5 bg-black border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-white outline-none font-mono"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Categoría *</label>
                <select
                  name="categoria_id"
                  [(ngModel)]="prodForm.categoria_id"
                  class="w-full px-3.5 py-2.5 bg-black border border-zinc-800 text-sm text-white focus:border-white outline-none"
                >
                  <option [ngValue]="null">-- Seleccionar --</option>
                  <option *ngFor="let c of categorias()" [ngValue]="c.id">
                    {{ c.nombre }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Precio *</label>
                <input
                  type="number"
                  name="precio"
                  [(ngModel)]="prodForm.precio"
                  required
                  min="0"
                  placeholder="180000"
                  class="w-full px-3.5 py-2.5 bg-black border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-white outline-none font-mono"
                />
              </div>
            </div>

            <!-- Galería Multi-Imagen -->
            <div class="p-4 bg-black border border-zinc-800 space-y-3">
              <div class="flex items-center justify-between gap-2">
                <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-300">
                  Imágenes del Producto ({{ prodImages().length }})
                </label>
                <span class="text-[10px] font-mono text-zinc-500">
                  La primera foto es la portada
                </span>
              </div>

              <!-- Input para agregar 1 o varias URLs -->
              <div class="flex flex-col sm:flex-row gap-2">
                <textarea
                  name="newImageUrls"
                  [(ngModel)]="newImageUrlInput"
                  rows="2"
                  placeholder="Pega una o varias URLs (una por línea o separadas por coma)..."
                  class="flex-1 px-3 py-2 bg-[#111113] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:border-white outline-none font-mono"
                ></textarea>
                <button
                  type="button"
                  (click)="agregarImagenesDesdeInput()"
                  class="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-[11px] font-mono font-bold uppercase tracking-wider shrink-0 self-start sm:self-stretch"
                >
                  + Agregar
                </button>
              </div>

              <!-- Grid de miniaturas -->
              <div *ngIf="prodImages().length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                <div
                  *ngFor="let img of prodImages(); let idx = index"
                  [class]="idx === 0 ? 'relative border-2 border-white bg-zinc-950' : 'relative border border-zinc-800 bg-zinc-950'"
                >
                  <img
                    [src]="img"
                    (error)="onImageError($event)"
                    alt="Foto producto"
                    class="w-full aspect-square object-cover"
                  />
                  <span
                    *ngIf="idx === 0"
                    class="absolute top-1 left-1 px-1.5 py-0.5 bg-white text-black text-[9px] font-mono font-bold uppercase"
                  >
                    Portada
                  </span>
                  <button
                    type="button"
                    (click)="quitarImagenProducto(idx)"
                    class="absolute top-1 right-1 w-6 h-6 bg-black/85 border border-zinc-600 hover:border-white text-white text-[10px] flex items-center justify-center"
                    aria-label="Quitar imagen"
                  >
                    ✕
                  </button>
                  <button
                    *ngIf="idx > 0"
                    type="button"
                    (click)="hacerPortadaImagen(idx)"
                    class="w-full py-1 bg-black/90 hover:bg-white hover:text-black text-zinc-300 text-[9px] font-mono uppercase border-t border-zinc-800 transition-colors"
                  >
                    Hacer portada
                  </button>
                </div>
              </div>

              <p *ngIf="prodImages().length === 0" class="text-[11px] font-mono text-zinc-500">
                Aún no has agregado fotos. Puedes pegar varios enlaces a la vez (ImgBB, Cloudinary, Postimages, etc.).
              </p>
            </div>

            <div>
              <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Etiquetas (separadas por coma)
              </label>
              <input
                type="text"
                name="etiquetas"
                [(ngModel)]="prodForm.etiquetas"
                placeholder="Ej: Tallas 38-43, Cuero Sintético, Unisex"
                class="w-full px-3.5 py-2.5 bg-black border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-white outline-none"
              />
            </div>

            <div>
              <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Descripción</label>
              <textarea
                name="descripcion"
                [(ngModel)]="prodForm.descripcion"
                rows="3"
                placeholder="Describe los detalles principales del producto..."
                class="w-full px-3.5 py-2.5 bg-black border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-white outline-none"
              ></textarea>
            </div>

            <div class="pt-2">
              <label class="inline-flex items-center gap-2 cursor-pointer text-xs font-mono uppercase text-zinc-300">
                <input
                  type="checkbox"
                  name="disponible"
                  [(ngModel)]="prodForm.disponible"
                  class="w-4 h-4 accent-white"
                />
                <span>Disponible (Visible en el catálogo)</span>
              </label>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800 font-mono">
              <button
                type="button"
                (click)="showProductoModal.set(false)"
                class="px-4 py-2.5 border border-zinc-800 hover:border-zinc-500 text-xs uppercase text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="saving()"
                class="px-6 py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-bold uppercase tracking-wider"
              >
                {{ saving() ? 'Guardando...' : 'Guardar Producto' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ================================================================== -->
      <!-- MODAL SUBIDA MASIVA DE PRODUCTOS POR CATEGORÍA                     -->
      <!-- ================================================================== -->
      <div
        *ngIf="showBulkModal()"
        class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
      >
        <div class="bg-[#111113] max-w-5xl w-full p-4 sm:p-7 border border-zinc-700 my-auto max-h-[94vh] flex flex-col">
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
            <div>
              <span class="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
                Carga por Lote
              </span>
              <h2 class="text-lg sm:text-xl font-bold uppercase tracking-wider text-white">
                Subida Masiva por Categoría
              </h2>
            </div>
            <button
              type="button"
              (click)="showBulkModal.set(false)"
              class="w-8 h-8 border border-zinc-800 hover:border-white flex items-center justify-center text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <!-- Body -->
          <div class="overflow-y-auto flex-1 py-4 space-y-5">
            <!-- Paso 1: Categoría común + Selector de Modo -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black border border-zinc-800">
              <div>
                <label class="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                  1. Categoría para todo el lote *
                </label>
                <select
                  name="bulk_categoria"
                  [ngModel]="bulkCategoriaId()"
                  (ngModelChange)="bulkCategoriaId.set($event)"
                  class="w-full px-3.5 py-2.5 bg-[#111113] border border-zinc-700 text-sm text-white focus:border-white outline-none"
                >
                  <option [ngValue]="null">-- Seleccionar categoría (ej. Zapatos) --</option>
                  <option *ngFor="let c of categorias()" [ngValue]="c.id">
                    {{ c.nombre }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                  2. Método de carga
                </label>
                <div class="grid grid-cols-2 border border-zinc-800 bg-[#111113]">
                  <button
                    type="button"
                    (click)="bulkMode.set('table')"
                    [class]="bulkMode() === 'table'
                      ? 'py-2.5 text-[11px] font-mono font-bold uppercase bg-white text-black'
                      : 'py-2.5 text-[11px] font-mono uppercase text-zinc-400 hover:text-white'"
                  >
                    Tabla Rápida
                  </button>
                  <button
                    type="button"
                    (click)="bulkMode.set('csv')"
                    [class]="bulkMode() === 'csv'
                      ? 'py-2.5 text-[11px] font-mono font-bold uppercase bg-white text-black'
                      : 'py-2.5 text-[11px] font-mono uppercase text-zinc-400 hover:text-white'"
                  >
                    Pegar Excel / CSV
                  </button>
                </div>
              </div>
            </div>

            <!-- MODO 1: TABLA RÁPIDA MULTI-FILA -->
            <div *ngIf="bulkMode() === 'table'" class="space-y-4">
              <!-- Atajos para rellenar precio o etiquetas en todas las filas -->
              <div class="p-3.5 bg-[#0c0c0f] border border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
                <div class="flex-1">
                  <label class="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Precio común (opcional)</label>
                  <input
                    type="number"
                    [(ngModel)]="bulkDefaultPrice"
                    placeholder="Ej: 180000"
                    class="w-full px-3 py-2 bg-black border border-zinc-800 text-xs text-white font-mono outline-none focus:border-white"
                  />
                </div>
                <div class="flex-1">
                  <label class="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Etiquetas comunes (opcional)</label>
                  <input
                    type="text"
                    [(ngModel)]="bulkDefaultTags"
                    placeholder="Ej: Tallas 38-43, Entrega inmediata"
                    class="w-full px-3 py-2 bg-black border border-zinc-800 text-xs text-white outline-none focus:border-white"
                  />
                </div>
                <button
                  type="button"
                  (click)="aplicarDefaultsMasivo()"
                  class="px-4 py-2 border border-zinc-600 hover:border-white text-[11px] font-mono uppercase text-white shrink-0"
                >
                  Aplicar a todas
                </button>
              </div>

              <!-- Filas de productos -->
              <div class="space-y-3">
                <div
                  *ngFor="let row of bulkRows; let i = index"
                  class="p-3.5 bg-black border border-zinc-800 space-y-3"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                      Producto #{{ i + 1 }}
                      <span *ngIf="parseImagesList(row.imagenesText).length > 0" class="text-white ml-2">
                        · {{ parseImagesList(row.imagenesText).length }} foto(s)
                      </span>
                    </span>
                    <div class="flex items-center gap-1.5 font-mono">
                      <button
                        type="button"
                        (click)="duplicarFilaMasiva(i)"
                        class="px-2 py-1 border border-zinc-800 hover:border-zinc-500 text-[10px] uppercase text-zinc-400 hover:text-white"
                      >
                        Duplicar
                      </button>
                      <button
                        type="button"
                        (click)="eliminarFilaMasiva(i)"
                        [disabled]="bulkRows.length <= 1"
                        class="px-2 py-1 border border-zinc-800 hover:border-white disabled:opacity-30 text-[10px] uppercase text-zinc-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div class="sm:col-span-5">
                      <input
                        type="text"
                        [(ngModel)]="row.nombre"
                        placeholder="Nombre del producto * (Ej: Air Force Black)"
                        class="w-full px-3 py-2 bg-[#111113] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:border-white outline-none"
                      />
                    </div>
                    <div class="sm:col-span-3">
                      <input
                        type="number"
                        [(ngModel)]="row.precio"
                        min="0"
                        placeholder="Precio * (Ej: 180000)"
                        class="w-full px-3 py-2 bg-[#111113] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:border-white outline-none font-mono"
                      />
                    </div>
                    <div class="sm:col-span-4">
                      <input
                        type="text"
                        [(ngModel)]="row.codigo"
                        placeholder="Código / SKU (opcional)"
                        class="w-full px-3 py-2 bg-[#111113] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:border-white outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      [(ngModel)]="row.etiquetas"
                      placeholder="Etiquetas (Ej: Tallas 38-43, Cuero)"
                      class="w-full px-3 py-2 bg-[#111113] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:border-white outline-none"
                    />
                    <input
                      type="text"
                      [(ngModel)]="row.descripcion"
                      placeholder="Descripción corta (opcional)"
                      class="w-full px-3 py-2 bg-[#111113] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:border-white outline-none"
                    />
                  </div>

                  <div class="flex flex-col sm:flex-row items-start gap-2.5">
                    <textarea
                      [(ngModel)]="row.imagenesText"
                      rows="2"
                      placeholder="URLs de imágenes (1 o varias separadas por coma, | o salto de línea)..."
                      class="w-full flex-1 px-3 py-2 bg-[#111113] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:border-white outline-none font-mono"
                    ></textarea>

                    <!-- Mini vista previa de fotos de esta fila -->
                    <div *ngIf="parseImagesList(row.imagenesText).length > 0" class="flex items-center gap-1.5 shrink-0">
                      <img
                        *ngFor="let thumb of parseImagesList(row.imagenesText).slice(0, 3)"
                        [src]="thumb"
                        (error)="onImageError($event)"
                        alt="Preview"
                        class="w-12 h-12 object-cover border border-zinc-700 bg-zinc-950"
                      />
                      <span
                        *ngIf="parseImagesList(row.imagenesText).length > 3"
                        class="w-10 h-12 border border-zinc-800 bg-zinc-950 flex items-center justify-center text-[10px] font-mono text-zinc-400"
                      >
                        +{{ parseImagesList(row.imagenesText).length - 3 }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  (click)="agregarFilasMasivas(1)"
                  class="px-4 py-2 border border-zinc-700 hover:border-white text-xs font-mono uppercase text-white"
                >
                  + Agregar fila
                </button>
                <button
                  type="button"
                  (click)="agregarFilasMasivas(5)"
                  class="px-4 py-2 border border-zinc-800 hover:border-zinc-500 text-xs font-mono uppercase text-zinc-300"
                >
                  + Agregar 5 filas
                </button>
              </div>
            </div>

            <!-- MODO 2: PEGAR EXCEL / IMPORTAR CSV -->
            <div *ngIf="bulkMode() === 'csv'" class="space-y-4">
              <div class="p-4 bg-black border border-zinc-800 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="text-xs font-mono text-zinc-400">
                    Columnas: <span class="text-white">nombre, precio, codigo, etiquetas, descripcion, imagenes</span>
                    (varias fotos separadas con <code class="text-white">|</code>)
                  </p>
                  <div class="flex items-center gap-2 font-mono">
                    <button
                      type="button"
                      (click)="cargarEjemploCsv()"
                      class="px-3 py-1.5 border border-zinc-700 hover:border-white text-[10px] uppercase text-zinc-200"
                    >
                      Cargar ejemplo
                    </button>
                    <label class="px-3 py-1.5 bg-white text-black text-[10px] font-bold uppercase cursor-pointer">
                      Subir .CSV
                      <input type="file" accept=".csv,.txt" (change)="onCsvFileSelected($event)" class="hidden" />
                    </label>
                  </div>
                </div>

                <textarea
                  [(ngModel)]="bulkCsvText"
                  rows="7"
                  placeholder="Pega aquí las filas copiadas desde Excel / Google Sheets o escribe en formato CSV:&#10;Tenis Street Black, 185000, ZAP-01, Tallas 38-43, Suela vulcanizada, https://url1.jpg | https://url2.jpg"
                  class="w-full p-3 bg-[#111113] border border-zinc-800 focus:border-white text-xs text-white font-mono outline-none"
                ></textarea>

                <div class="flex items-center justify-between gap-3">
                  <span class="text-[11px] font-mono text-zinc-400">
                    Detectados listos para importar: <strong class="text-white">{{ parseCsvToDrafts().length }}</strong> productos
                  </span>
                  <button
                    type="button"
                    (click)="pasarCsvATabla()"
                    [disabled]="parseCsvToDrafts().length === 0"
                    class="px-3.5 py-2 border border-zinc-700 hover:border-white disabled:opacity-40 text-[10px] font-mono uppercase text-zinc-200"
                  >
                    Revisar en Tabla Rápida →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 font-mono">
            <div class="text-[11px] text-zinc-400">
              Listos para subir: <strong class="text-white">{{ getValidBulkProductsCount() }}</strong> producto(s)
              <span *ngIf="getSelectedBulkCategoryName()"> en <strong class="text-white uppercase">{{ getSelectedBulkCategoryName() }}</strong></span>
            </div>

            <div class="flex items-center justify-end gap-2.5">
              <button
                type="button"
                (click)="showBulkModal.set(false)"
                class="px-4 py-2.5 border border-zinc-800 hover:border-zinc-500 text-xs uppercase text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="guardarLoteMasivo()"
                [disabled]="saving() || getValidBulkProductsCount() === 0 || !bulkCategoriaId()"
                class="px-5 py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-40 text-black text-xs font-bold uppercase tracking-wider"
              >
                {{ saving() ? 'Subiendo lote...' : 'Subir ' + getValidBulkProductsCount() + ' Productos' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL CREAR / EDITAR CATEGORÍA -->
      <div
        *ngIf="showCategoriaModal()"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div class="bg-[#111113] max-w-md w-full p-5 sm:p-8 border border-zinc-800">
          <div class="flex items-center justify-between pb-4 border-b border-zinc-800">
            <h2 class="text-lg font-bold uppercase tracking-wider text-white">
              {{ editingCategoriaId() ? 'Editar Categoría' : 'Nueva Categoría' }}
            </h2>
            <button
              type="button"
              (click)="showCategoriaModal.set(false)"
              class="w-8 h-8 border border-zinc-800 hover:border-white flex items-center justify-center text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <form (ngSubmit)="guardarCategoria()" class="mt-5 space-y-4">
            <div>
              <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Nombre de la Categoría *</label>
              <input
                type="text"
                name="cat_nombre"
                [(ngModel)]="catForm.nombre"
                required
                placeholder="Ej: Zapatos, Camisetas, Gorras..."
                class="w-full px-3.5 py-2.5 bg-black border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-white outline-none"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Tipo</label>
                <select
                  name="cat_icono"
                  [(ngModel)]="catForm.icono"
                  class="w-full px-3.5 py-2.5 bg-black border border-zinc-800 text-sm text-white outline-none focus:border-white"
                >
                  <option value="shirt">Moda / Ropa</option>
                  <option value="tv">Electrodomésticos</option>
                  <option value="headphones">Tecnología / Audio</option>
                  <option value="home">Hogar</option>
                  <option value="sparkles">Otros</option>
                  <option value="tag">General</option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Orden</label>
                <input
                  type="number"
                  name="cat_orden"
                  [(ngModel)]="catForm.orden"
                  class="w-full px-3.5 py-2.5 bg-black border border-zinc-800 text-sm text-white outline-none focus:border-white font-mono"
                />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Descripción</label>
              <textarea
                name="cat_descripcion"
                [(ngModel)]="catForm.descripcion"
                rows="2"
                placeholder="Breve descripción de la categoría..."
                class="w-full px-3.5 py-2.5 bg-black border border-zinc-800 text-sm text-white placeholder-zinc-600 outline-none focus:border-white"
              ></textarea>
            </div>

            <label class="inline-flex items-center gap-2 cursor-pointer text-xs font-mono uppercase text-zinc-300">
              <input
                type="checkbox"
                name="cat_activo"
                [(ngModel)]="catForm.activo"
                class="w-4 h-4 accent-white"
              />
              <span>Categoría activa en el catálogo</span>
            </label>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800 font-mono">
              <button
                type="button"
                (click)="showCategoriaModal.set(false)"
                class="px-4 py-2.5 border border-zinc-800 hover:border-zinc-500 text-xs uppercase text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="saving()"
                class="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider"
              >
                {{ saving() ? 'Guardando...' : 'Guardar Categoría' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  readonly catalogService = inject(CatalogService);
  readonly authService = inject(AuthService);

  readonly defaultImage =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

  activeTab = signal<'productos' | 'categorias'>('productos');
  categorias = signal<Categoria[]>([]);
  productos = signal<Producto[]>([]);

  searchProducto = signal<string>('');
  filterCategoriaId = signal<number | null>(null);

  showProductoModal = signal<boolean>(false);
  editingProductoId = signal<number | null>(null);
  prodImages = signal<string[]>([]);
  newImageUrlInput = '';

  showBulkModal = signal<boolean>(false);
  bulkMode = signal<'table' | 'csv'>('table');
  bulkCategoriaId = signal<number | null>(null);
  bulkDefaultPrice: number | null = null;
  bulkDefaultTags = '';
  bulkRows: BulkRowDraft[] = [];
  bulkCsvText = '';

  showCategoriaModal = signal<boolean>(false);
  editingCategoriaId = signal<number | null>(null);

  saving = signal<boolean>(false);
  toastMessage = signal<string>('');

  prodForm: Partial<Producto> = this.getEmptyProductoForm();
  catForm: Partial<Categoria> = this.getEmptyCategoriaForm();

  readonly totalDisponibles = computed(
    () => this.productos().filter((p) => p.disponible !== false).length
  );

  readonly productosAdminFiltrados = computed(() => {
    const term = this.searchProducto().trim().toLowerCase();
    const catId = this.filterCategoriaId();

    return this.productos().filter((p) => {
      const matchesCat = catId === null || Number(p.categoria_id) === Number(catId);
      const matchesTerm =
        !term ||
        p.nombre.toLowerCase().includes(term) ||
        (p.codigo || '').toLowerCase().includes(term) ||
        (p.etiquetas || '').toLowerCase().includes(term);
      return matchesCat && matchesTerm;
    });
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.catalogService.getCategorias().subscribe((cats) => this.categorias.set(cats));
    this.catalogService.getProductos().subscribe((prods) => this.productos.set(prods));
  }

  // ==========================================================================
  // MULTI-IMAGEN HELPERS
  // ==========================================================================
  getProductCover(prod: Producto): string {
    if (prod.imagen_url) return prod.imagen_url;
    if (Array.isArray(prod.imagenes) && prod.imagenes.length > 0) return prod.imagenes[0];
    return this.defaultImage;
  }

  getProductImageCount(prod: Producto): number {
    const set = new Set<string>();
    if (prod.imagen_url) set.add(prod.imagen_url.trim());
    if (Array.isArray(prod.imagenes)) {
      prod.imagenes.forEach((u) => {
        if (u?.trim()) set.add(u.trim());
      });
    }
    return set.size;
  }

  parseImagesList(text: string): string[] {
    if (!text) return [];
    const urls = text
      .split(/[\n,|]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
    return Array.from(new Set(urls));
  }

  agregarImagenesDesdeInput(): void {
    const nuevas = this.parseImagesList(this.newImageUrlInput);
    if (nuevas.length === 0) return;
    const combinadas = Array.from(new Set([...this.prodImages(), ...nuevas]));
    this.prodImages.set(combinadas);
    this.newImageUrlInput = '';
  }

  quitarImagenProducto(index: number): void {
    const copy = [...this.prodImages()];
    copy.splice(index, 1);
    this.prodImages.set(copy);
  }

  hacerPortadaImagen(index: number): void {
    const copy = [...this.prodImages()];
    const [selected] = copy.splice(index, 1);
    if (selected) {
      copy.unshift(selected);
      this.prodImages.set(copy);
    }
  }

  // ==========================================================================
  // PRODUCTOS CRUD
  // ==========================================================================
  getEmptyProductoForm(): Partial<Producto> {
    return {
      categoria_id: this.categorias()[0]?.id ?? null,
      codigo: '',
      nombre: '',
      descripcion: '',
      precio: 0,
      precio_anterior: null,
      imagen_url: '',
      imagenes: [],
      etiquetas: '',
      destacado: false,
      disponible: true,
    };
  }

  abrirModalProducto(prod?: Producto): void {
    this.newImageUrlInput = '';
    if (prod) {
      this.editingProductoId.set(prod.id);
      const imgs: string[] = [];
      if (Array.isArray(prod.imagenes)) {
        prod.imagenes.forEach((u) => {
          if (u?.trim() && !imgs.includes(u.trim())) imgs.push(u.trim());
        });
      }
      if (prod.imagen_url?.trim() && !imgs.includes(prod.imagen_url.trim())) {
        imgs.unshift(prod.imagen_url.trim());
      }
      this.prodImages.set(imgs);
      this.prodForm = { ...prod, precio_anterior: null, destacado: false };
    } else {
      this.editingProductoId.set(null);
      this.prodImages.set([]);
      this.prodForm = this.getEmptyProductoForm();
    }
    this.showProductoModal.set(true);
  }

  guardarProducto(): void {
    if (!this.prodForm.nombre) return;
    if (this.newImageUrlInput.trim()) {
      this.agregarImagenesDesdeInput();
    }
    this.saving.set(true);

    const imgs = this.prodImages();
    const payload: Partial<Producto> = {
      ...this.prodForm,
      imagen_url: imgs[0] || '',
      imagenes: imgs,
      precio_anterior: null,
      destacado: false,
    };

    const id = this.editingProductoId();
    const req$ = id
      ? this.catalogService.actualizarProducto(id, payload)
      : this.catalogService.crearProducto(payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showProductoModal.set(false);
        this.mostrarToast(id ? 'Producto actualizado correctamente' : 'Producto creado en el catálogo');
        this.cargarDatos();
      },
      error: (err) => {
        this.saving.set(false);
        alert(err?.error?.message || 'Error al guardar el producto. Verifica que el backend esté activo.');
      },
    });
  }

  toggleDisponible(prod: Producto): void {
    const actualizado = { ...prod, disponible: !prod.disponible, precio_anterior: null, destacado: false };
    this.catalogService.actualizarProducto(prod.id, actualizado).subscribe({
      next: () => this.cargarDatos(),
    });
  }

  eliminarProducto(prod: Producto): void {
    if (!confirm(`¿Seguro que deseas eliminar "${prod.nombre}" del catálogo?`)) return;
    this.catalogService.eliminarProducto(prod.id).subscribe({
      next: () => {
        this.mostrarToast('Producto eliminado');
        this.cargarDatos();
      },
    });
  }

  // ==========================================================================
  // SUBIDA MASIVA POR CATEGORÍA
  // ==========================================================================
  private createEmptyBulkRow(): BulkRowDraft {
    return {
      nombre: '',
      precio: this.bulkDefaultPrice,
      codigo: '',
      etiquetas: this.bulkDefaultTags,
      descripcion: '',
      imagenesText: '',
    };
  }

  abrirModalMasivo(): void {
    this.bulkMode.set('table');
    this.bulkCategoriaId.set(this.filterCategoriaId() ?? this.categorias()[0]?.id ?? null);
    this.bulkDefaultPrice = null;
    this.bulkDefaultTags = '';
    this.bulkCsvText = '';
    this.bulkRows = [
      this.createEmptyBulkRow(),
      this.createEmptyBulkRow(),
      this.createEmptyBulkRow(),
    ];
    this.showBulkModal.set(true);
  }

  agregarFilasMasivas(count: number): void {
    for (let i = 0; i < count; i++) {
      this.bulkRows.push(this.createEmptyBulkRow());
    }
  }

  duplicarFilaMasiva(index: number): void {
    const row = this.bulkRows[index];
    if (!row) return;
    this.bulkRows.splice(index + 1, 0, { ...row, codigo: '' });
  }

  eliminarFilaMasiva(index: number): void {
    if (this.bulkRows.length <= 1) return;
    this.bulkRows.splice(index, 1);
  }

  aplicarDefaultsMasivo(): void {
    this.bulkRows.forEach((row) => {
      if (this.bulkDefaultPrice !== null && this.bulkDefaultPrice >= 0) {
        row.precio = this.bulkDefaultPrice;
      }
      if (this.bulkDefaultTags.trim()) {
        row.etiquetas = this.bulkDefaultTags.trim();
      }
    });
  }

  cargarEjemploCsv(): void {
    this.bulkCsvText = [
      'nombre, precio, codigo, etiquetas, descripcion, imagenes',
      'Tenis Street Black, 185000, ZAP-001, Tallas 38-43, Cuero sintético negro con suela gruesa, https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800 | https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
      'Tenis Urban White, 175000, ZAP-002, Tallas 37-42, Diseño limpio totalmente blanco, https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
    ].join('\n');
  }

  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.bulkCsvText = String(reader.result || '');
    };
    reader.readAsText(file, 'UTF-8');
    input.value = '';
  }

  parseCsvToDrafts(): BulkRowDraft[] {
    const raw = this.bulkCsvText.trim();
    if (!raw) return [];

    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const drafts: BulkRowDraft[] = [];

    lines.forEach((line, idx) => {
      const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
      const cols = line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));

      // Ignora encabezado si la primera línea dice "nombre"
      if (idx === 0 && cols[0]?.toLowerCase() === 'nombre') return;

      const nombre = cols[0] || '';
      const rawPrice = (cols[1] || '').replace(/[^\d.]/g, '');
      const precio = rawPrice ? Number(rawPrice) : null;

      if (!nombre || precio === null || Number.isNaN(precio)) return;

      drafts.push({
        nombre,
        precio,
        codigo: cols[2] || '',
        etiquetas: cols[3] || '',
        descripcion: cols[4] || '',
        imagenesText: cols.slice(5).join(' | '),
      });
    });

    return drafts;
  }

  pasarCsvATabla(): void {
    const parsed = this.parseCsvToDrafts();
    if (parsed.length === 0) return;
    this.bulkRows = parsed;
    this.bulkMode.set('table');
  }

  private getBulkDraftsSource(): BulkRowDraft[] {
    return this.bulkMode() === 'csv' ? this.parseCsvToDrafts() : this.bulkRows;
  }

  getValidBulkProductsCount(): number {
    return this.getBulkDraftsSource().filter(
      (r) => r.nombre.trim().length > 0 && r.precio !== null && Number(r.precio) >= 0
    ).length;
  }

  getSelectedBulkCategoryName(): string {
    const id = this.bulkCategoriaId();
    if (!id) return '';
    return this.categorias().find((c) => Number(c.id) === Number(id))?.nombre || '';
  }

  guardarLoteMasivo(): void {
    const catId = this.bulkCategoriaId();
    if (!catId) {
      alert('Selecciona primero la categoría para el lote.');
      return;
    }

    const validRows = this.getBulkDraftsSource().filter(
      (r) => r.nombre.trim().length > 0 && r.precio !== null && Number(r.precio) >= 0
    );

    if (validRows.length === 0) return;

    const productosPayload: Partial<Producto>[] = validRows.map((r) => {
      const imgs = this.parseImagesList(r.imagenesText);
      return {
        categoria_id: catId,
        nombre: r.nombre.trim(),
        precio: Number(r.precio),
        codigo: r.codigo.trim(),
        etiquetas: r.etiquetas.trim(),
        descripcion: r.descripcion.trim(),
        imagen_url: imgs[0] || '',
        imagenes: imgs,
        precio_anterior: null,
        destacado: false,
        disponible: true,
      };
    });

    this.saving.set(true);
    this.catalogService
      .crearProductosMasivo({
        categoria_id: catId,
        productos: productosPayload,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.showBulkModal.set(false);
          this.mostrarToast(`Se subieron ${res.creados} productos en ${this.getSelectedBulkCategoryName() || 'la categoría'}`);
          this.cargarDatos();
        },
        error: (err) => {
          this.saving.set(false);
          alert(err?.error?.message || 'Error al subir el lote de productos. Verifica la conexión con el backend.');
        },
      });
  }

  onImageError(event: Event): void {
    const imgEl = event.target as HTMLImageElement;
    if (imgEl && imgEl.src !== this.defaultImage) {
      imgEl.src = this.defaultImage;
    }
  }

  // ==========================================================================
  // CATEGORÍAS CRUD
  // ==========================================================================
  getEmptyCategoriaForm(): Partial<Categoria> {
    return {
      nombre: '',
      descripcion: '',
      icono: 'shirt',
      orden: this.categorias().length + 1,
      activo: true,
    };
  }

  abrirModalCategoria(cat?: Categoria): void {
    if (cat) {
      this.editingCategoriaId.set(cat.id);
      this.catForm = { ...cat };
    } else {
      this.editingCategoriaId.set(null);
      this.catForm = this.getEmptyCategoriaForm();
    }
    this.showCategoriaModal.set(true);
  }

  guardarCategoria(): void {
    if (!this.catForm.nombre) return;
    this.saving.set(true);

    const id = this.editingCategoriaId();
    const req$ = id
      ? this.catalogService.actualizarCategoria(id, this.catForm)
      : this.catalogService.crearCategoria(this.catForm);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showCategoriaModal.set(false);
        this.mostrarToast(id ? 'Categoría actualizada' : 'Categoría creada');
        this.cargarDatos();
      },
      error: (err) => {
        this.saving.set(false);
        alert(err?.error?.message || 'Error al guardar la categoría.');
      },
    });
  }

  eliminarCategoria(cat: Categoria): void {
    if (!confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return;
    this.catalogService.eliminarCategoria(cat.id).subscribe({
      next: () => {
        this.mostrarToast('Categoría eliminada');
        this.cargarDatos();
      },
    });
  }

  formatPrice(value: number | string | null | undefined): string {
    const num = Number(value || 0);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);
  }

  private mostrarToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set('');
      }
    }, 3500);
  }
}
