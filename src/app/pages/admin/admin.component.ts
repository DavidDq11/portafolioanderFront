import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { AuthService } from '../../core/services/auth.service';
import { Categoria, Producto } from '../../core/models/catalog.models';
import { readXlsxRows } from '../../core/utils/xlsx-reader';

interface BulkRowDraft {
  nombre: string;
  precio: number | null;
  tags: string[];
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
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
          <div class="grid grid-cols-2 sm:inline-flex border border-zinc-800 bg-black">
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

          <div class="grid grid-cols-2 sm:flex items-center gap-2">
            <ng-container *ngIf="activeTab() === 'productos'">
              <button
                type="button"
                (click)="abrirModalMasivo()"
                class="px-3.5 sm:px-4 py-2.5 border border-zinc-600 hover:border-white bg-black text-white text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-colors text-center"
              >
                ↑ Subida Masiva
              </button>
              <button
                type="button"
                (click)="abrirModalProducto()"
                class="px-4 sm:px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-colors text-center"
              >
                + Nuevo Producto
              </button>
            </ng-container>

            <button
              *ngIf="activeTab() === 'categorias'"
              type="button"
              (click)="abrirModalCategoria()"
              class="col-span-2 px-4 sm:px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-colors"
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
                class="w-full pl-9 pr-4 py-2.5 bg-black text-sm text-white placeholder-zinc-500 border border-zinc-800 focus:border-white outline-none"
              />
              <svg class="w-4 h-4 text-zinc-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              [ngModel]="filterCategoriaId()"
              (ngModelChange)="filterCategoriaId.set($event)"
              class="w-full sm:w-auto px-3.5 py-2.5 bg-black border border-zinc-800 text-xs font-mono uppercase text-zinc-200 outline-none focus:border-white"
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
      <!-- MODAL CREAR / EDITAR PRODUCTO (RÁPIDO, CÓDIGO AUTO Y CHIPS)        -->
      <!-- ================================================================== -->
      <div
        *ngIf="showProductoModal()"
        class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      >
        <form
          (ngSubmit)="guardarProducto()"
          class="bg-[#111113] w-full sm:max-w-2xl h-[94dvh] sm:h-auto sm:max-h-[92vh] border-t sm:border border-zinc-700 flex flex-col overflow-hidden"
        >
          <!-- Sticky Modal Header -->
          <div class="px-4 sm:px-7 py-4 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0 bg-black">
            <div>
              <h2 class="text-base sm:text-lg font-bold uppercase tracking-wider text-white">
                {{ editingProductoId() ? 'Editar Producto' : 'Nuevo Producto' }}
              </h2>
              <p class="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-0.5">
                Código automático: <span class="text-white">{{ prodForm.codigo || generateNextCode(prodForm.categoria_id) }}</span>
              </p>
            </div>
            <button
              type="button"
              (click)="showProductoModal.set(false)"
              class="w-9 h-9 border border-zinc-800 hover:border-white flex items-center justify-center text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <!-- Scrollable Form Body -->
          <div class="flex-1 overflow-y-auto px-4 sm:px-7 py-5 space-y-5">
            <!-- Categoría & Precio (2 cols) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                  Categoría *
                </label>
                <select
                  name="categoria_id"
                  [(ngModel)]="prodForm.categoria_id"
                  (ngModelChange)="onSingleCategoryChange($event)"
                  class="w-full px-3.5 py-3 bg-black border border-zinc-800 text-sm text-white focus:border-white outline-none"
                >
                  <option [ngValue]="null">-- Seleccionar --</option>
                  <option *ngFor="let c of categorias()" [ngValue]="c.id">
                    {{ c.nombre }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                  Precio *
                </label>
                <input
                  type="number"
                  inputmode="numeric"
                  name="precio"
                  [(ngModel)]="prodForm.precio"
                  required
                  min="0"
                  placeholder="180000"
                  class="w-full px-3.5 py-3 bg-black border border-zinc-800 text-base text-white placeholder-zinc-600 focus:border-white outline-none font-mono"
                />
              </div>
            </div>

            <!-- Nombre -->
            <div>
              <label class="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="nombre"
                [(ngModel)]="prodForm.nombre"
                required
                placeholder="Ej: Air Force Black / Camiseta Oversize"
                class="w-full px-3.5 py-3 bg-black border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-white outline-none"
              />
            </div>

            <!-- Galería Multi-Imagen por Links -->
            <div class="p-3.5 sm:p-4 bg-black border border-zinc-800 space-y-3">
              <div class="flex items-center justify-between gap-2">
                <label class="block text-[10px] font-mono uppercase tracking-widest text-zinc-300">
                  Fotos ({{ prodImages().length }})
                </label>
                <span class="text-[10px] font-mono text-zinc-500">
                  La primera es la portada
                </span>
              </div>

              <div class="flex flex-col sm:flex-row gap-2">
                <textarea
                  name="newImageUrls"
                  [(ngModel)]="newImageUrlInput"
                  rows="2"
                  placeholder="Pega 1 o varios links aquí (uno por línea)..."
                  class="flex-1 px-3 py-2.5 bg-[#111113] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:border-white outline-none font-mono"
                ></textarea>
                <button
                  type="button"
                  (click)="agregarImagenesDesdeInput()"
                  class="px-4 py-2.5 bg-white hover:bg-zinc-200 text-black text-[11px] font-mono font-bold uppercase tracking-wider shrink-0"
                >
                  + Agregar fotos
                </button>
              </div>

              <div *ngIf="prodImages().length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
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
                    class="absolute top-1 right-1 w-6 h-6 bg-black/85 border border-zinc-600 text-white text-[10px] flex items-center justify-center"
                    aria-label="Quitar imagen"
                  >
                    ✕
                  </button>
                  <button
                    *ngIf="idx > 0"
                    type="button"
                    (click)="hacerPortadaImagen(idx)"
                    class="w-full py-1 bg-black/90 hover:bg-white hover:text-black text-zinc-300 text-[9px] font-mono uppercase border-t border-zinc-800"
                  >
                    Portada
                  </button>
                </div>
              </div>
            </div>

            <!-- Etiquetas Recomendadas (1 toque) -->
            <div class="p-3.5 sm:p-4 bg-black border border-zinc-800 space-y-3">
              <div class="flex items-center justify-between gap-2">
                <label class="block text-[10px] font-mono uppercase tracking-widest text-zinc-300">
                  Etiquetas rápidas (toca para elegir)
                </label>
                <span class="text-[10px] font-mono text-zinc-500">
                  {{ prodSelectedTags().length }} activas
                </span>
              </div>

              <div class="flex flex-wrap gap-1.5">
                <button
                  *ngFor="let tag of getRecommendedTagsForCategory(prodForm.categoria_id)"
                  type="button"
                  (click)="toggleSingleTag(tag)"
                  [class]="prodSelectedTags().includes(tag)
                    ? 'px-3 py-1.5 text-[11px] font-mono font-bold bg-white text-black border border-white transition-colors'
                    : 'px-3 py-1.5 text-[11px] font-mono bg-[#111113] text-zinc-400 border border-zinc-800 hover:border-zinc-500 hover:text-white transition-colors'"
                >
                  {{ prodSelectedTags().includes(tag) ? '✓ ' : '+ ' }}{{ tag }}
                </button>
              </div>

              <!-- Etiquetas personalizadas adicionales -->
              <div *ngIf="getCustomSingleTags().length > 0" class="flex flex-wrap gap-1.5 pt-1">
                <button
                  *ngFor="let tag of getCustomSingleTags()"
                  type="button"
                  (click)="toggleSingleTag(tag)"
                  class="px-2.5 py-1 text-[10px] font-mono font-bold bg-zinc-200 text-black flex items-center gap-1"
                >
                  <span>{{ tag }}</span>
                  <span>✕</span>
                </button>
              </div>

              <div class="flex gap-2 pt-1">
                <input
                  type="text"
                  name="customTagInput"
                  [(ngModel)]="customTagInput"
                  (keydown.enter)="$event.preventDefault(); addCustomSingleTag()"
                  placeholder="Agregar otra etiqueta (opcional)..."
                  class="flex-1 px-3 py-2 bg-[#111113] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:border-white outline-none"
                />
                <button
                  type="button"
                  (click)="addCustomSingleTag()"
                  class="px-3.5 py-2 border border-zinc-700 hover:border-white text-[11px] font-mono uppercase text-zinc-200 shrink-0"
                >
                  + Añadir
                </button>
              </div>
            </div>

            <!-- Visibilidad -->
            <div class="flex items-center justify-between py-1">
              <label class="inline-flex items-center gap-2.5 cursor-pointer text-xs font-mono uppercase text-zinc-300">
                <input
                  type="checkbox"
                  name="disponible"
                  [(ngModel)]="prodForm.disponible"
                  class="w-4 h-4 accent-white"
                />
                <span>Visible en el catálogo</span>
              </label>

              <button
                type="button"
                (click)="showOptionalDesc.set(!showOptionalDesc())"
                class="text-[10px] font-mono uppercase text-zinc-500 hover:text-white underline underline-offset-4"
              >
                {{ showOptionalDesc() ? 'Ocultar nota' : '+ Nota opcional' }}
              </button>
            </div>

            <div *ngIf="showOptionalDesc()">
              <textarea
                name="descripcion"
                [(ngModel)]="prodForm.descripcion"
                rows="2"
                placeholder="Descripción opcional..."
                class="w-full px-3.5 py-2.5 bg-black border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:border-white outline-none"
              ></textarea>
            </div>
          </div>

          <!-- Sticky Bottom Save Bar (Mobile-friendly) -->
          <div class="px-4 sm:px-7 py-3.5 pb-safe border-t border-zinc-800 bg-black flex items-center justify-end gap-2.5 shrink-0 font-mono">
            <button
              type="button"
              (click)="showProductoModal.set(false)"
              class="px-4 py-3 border border-zinc-800 hover:border-zinc-500 text-xs uppercase text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="saving() || !prodForm.nombre"
              class="flex-1 sm:flex-none px-6 py-3 bg-white hover:bg-zinc-200 disabled:opacity-40 text-black text-xs font-bold uppercase tracking-wider"
            >
              {{ saving() ? 'Guardando...' : 'Guardar Producto' }}
            </button>
          </div>
        </form>
      </div>

      <!-- ================================================================== -->
      <!-- MODAL SUBIDA MASIVA DINÁMICA POR CATEGORÍA (CELULAR & PC)          -->
      <!-- ================================================================== -->
      <div
        *ngIf="showBulkModal()"
        class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      >
        <div class="bg-[#111113] w-full sm:max-w-5xl h-[96dvh] sm:h-auto sm:max-h-[94vh] border-t sm:border border-zinc-700 flex flex-col overflow-hidden">
          <!-- Sticky Header -->
          <div class="px-4 sm:px-7 py-3.5 sm:py-4 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0 bg-black">
            <div>
              <span class="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
                Códigos automáticos · Sin descripción
              </span>
              <h2 class="text-base sm:text-xl font-bold uppercase tracking-wider text-white">
                Subida Masiva
              </h2>
            </div>
            <button
              type="button"
              (click)="showBulkModal.set(false)"
              class="w-9 h-9 border border-zinc-800 hover:border-white flex items-center justify-center text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <!-- Scrollable Content -->
          <div class="overflow-y-auto flex-1 px-3.5 sm:px-7 py-4 space-y-4">
            <!-- Paso 1: Categoría + Precio base + Modo -->
            <div class="p-3.5 sm:p-4 bg-black border border-zinc-800 space-y-3.5">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                    1. Categoría del lote *
                  </label>
                  <select
                    name="bulk_categoria"
                    [ngModel]="bulkCategoriaId()"
                    (ngModelChange)="onBulkCategoryChange($event)"
                    class="w-full px-3 py-2.5 bg-[#111113] border border-zinc-700 text-sm text-white focus:border-white outline-none"
                  >
                    <option [ngValue]="null">-- Seleccionar (ej. Zapatos) --</option>
                    <option *ngFor="let c of categorias()" [ngValue]="c.id">
                      {{ c.nombre }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                    2. Precio base (opcional)
                  </label>
                  <div class="flex gap-2">
                    <input
                      type="number"
                      inputmode="numeric"
                      [(ngModel)]="bulkDefaultPrice"
                      placeholder="Ej: 180000"
                      class="flex-1 px-3 py-2.5 bg-[#111113] border border-zinc-700 text-sm text-white font-mono outline-none focus:border-white"
                    />
                    <button
                      type="button"
                      (click)="aplicarDefaultsMasivo()"
                      class="px-3 py-2.5 border border-zinc-600 hover:border-white text-[10px] font-mono uppercase text-white shrink-0"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>

              <!-- Etiquetas recomendadas para todo el lote -->
              <div>
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <label class="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                    3. Etiquetas por defecto (toca y aplica a todos)
                  </label>
                  <button
                    *ngIf="bulkDefaultTags().length > 0 && bulkMode() === 'table'"
                    type="button"
                    (click)="aplicarDefaultsMasivo()"
                    class="text-[10px] font-mono uppercase text-white underline underline-offset-4"
                  >
                    Aplicar a filas
                  </button>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    *ngFor="let tag of getRecommendedTagsForCategory(bulkCategoriaId())"
                    type="button"
                    (click)="toggleBulkDefaultTag(tag)"
                    [class]="bulkDefaultTags().includes(tag)
                      ? 'px-2.5 py-1.5 text-[10px] sm:text-[11px] font-mono font-bold bg-white text-black border border-white transition-colors'
                      : 'px-2.5 py-1.5 text-[10px] sm:text-[11px] font-mono bg-[#111113] text-zinc-400 border border-zinc-800 hover:border-zinc-500 hover:text-white transition-colors'"
                  >
                    {{ bulkDefaultTags().includes(tag) ? '✓ ' : '+ ' }}{{ tag }}
                  </button>
                </div>
              </div>

              <!-- Selector de Método (3 modos) -->
              <div class="grid grid-cols-3 border border-zinc-800 bg-[#111113] pt-0">
                <button
                  type="button"
                  (click)="bulkMode.set('links')"
                  [class]="bulkMode() === 'links'
                    ? 'py-2.5 px-2 text-[10px] sm:text-[11px] font-mono font-bold uppercase bg-white text-black'
                    : 'py-2.5 px-2 text-[10px] sm:text-[11px] font-mono uppercase text-zinc-400 hover:text-white'"
                >
                  Pegar Links
                </button>
                <button
                  type="button"
                  (click)="bulkMode.set('table')"
                  [class]="bulkMode() === 'table'
                    ? 'py-2.5 px-2 text-[10px] sm:text-[11px] font-mono font-bold uppercase bg-white text-black'
                    : 'py-2.5 px-2 text-[10px] sm:text-[11px] font-mono uppercase text-zinc-400 hover:text-white'"
                >
                  Tarjetas ({{ bulkRows.length }})
                </button>
                <button
                  type="button"
                  (click)="bulkMode.set('csv')"
                  [class]="bulkMode() === 'csv'
                    ? 'py-2.5 px-2 text-[10px] sm:text-[11px] font-mono font-bold uppercase bg-white text-black'
                    : 'py-2.5 px-2 text-[10px] sm:text-[11px] font-mono uppercase text-zinc-400 hover:text-white'"
                >
                  Excel / CSV
                </button>
              </div>
            </div>

            <!-- ============================================================ -->
            <!-- MODO A: PEGAR LINKS MASIVOS (Postimages / ImgBB → 1 clic)    -->
            <!-- ============================================================ -->
            <div *ngIf="bulkMode() === 'links'" class="p-3.5 sm:p-4 bg-black border border-zinc-800 space-y-3.5">
              <div>
                <p class="text-xs font-bold text-white uppercase tracking-wide">
                  Pega tus links de Postimages / ImgBB y genera todos los productos al instante
                </p>
                <p class="text-[11px] font-mono text-zinc-400 mt-1">
                  • <strong>1 link por línea</strong> = crea 1 producto por cada foto.<br />
                  • <strong>Varios links separados con coma o <code class="text-white">|</code> en la misma línea</strong> = 1 producto con varias fotos.
                </p>
              </div>

              <div>
                <label class="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                  Nombre base automático (luego puedes editar cada uno)
                </label>
                <input
                  type="text"
                  [(ngModel)]="bulkNamePrefix"
                  [placeholder]="'Ej: ' + (getSelectedBulkCategoryName() || 'Zapatos') + ' Modelo'"
                  class="w-full px-3 py-2.5 bg-[#111113] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:border-white outline-none"
                />
              </div>

              <textarea
                [(ngModel)]="bulkRawLinksText"
                rows="6"
                placeholder="Pega aquí la lista de links directos:&#10;https://i.postimg.cc/foto1.jpg | https://i.postimg.cc/foto1-angulo2.jpg&#10;https://i.postimg.cc/foto2.jpg&#10;https://i.postimg.cc/foto3.jpg"
                class="w-full p-3 bg-[#111113] border border-zinc-800 focus:border-white text-xs text-white placeholder-zinc-600 font-mono outline-none"
              ></textarea>

              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span class="text-[11px] font-mono text-zinc-400">
                  Líneas con fotos detectadas: <strong class="text-white">{{ countBulkLinkGroups() }}</strong> productos
                </span>
                <button
                  type="button"
                  (click)="generarTarjetasDesdeLinks()"
                  [disabled]="countBulkLinkGroups() === 0"
                  class="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-40 text-black text-xs font-mono font-bold uppercase tracking-wider"
                >
                  Generar {{ countBulkLinkGroups() }} Productos →
                </button>
              </div>
            </div>

            <!-- ============================================================ -->
            <!-- MODO B: TARJETAS RÁPIDAS (EDITABLES EN CELULAR Y PC)         -->
            <!-- ============================================================ -->
            <div *ngIf="bulkMode() === 'table'" class="space-y-3">
              <div
                *ngFor="let row of bulkRows; let i = index"
                class="p-3.5 bg-black border border-zinc-800 space-y-3"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
                    <span class="px-2 py-0.5 bg-white text-black font-bold">
                      {{ getPreviewBulkCode(i) }}
                    </span>
                    <span class="text-zinc-400">
                      #{{ i + 1 }}
                      <span *ngIf="parseImagesList(row.imagenesText).length > 0" class="text-white">
                        · {{ parseImagesList(row.imagenesText).length }} foto(s)
                      </span>
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 font-mono">
                    <button
                      type="button"
                      (click)="duplicarFilaMasiva(i)"
                      class="px-2.5 py-1 border border-zinc-800 hover:border-zinc-500 text-[10px] uppercase text-zinc-400 hover:text-white"
                    >
                      Duplicar
                    </button>
                    <button
                      type="button"
                      (click)="eliminarFilaMasiva(i)"
                      [disabled]="bulkRows.length <= 1"
                      class="px-2.5 py-1 border border-zinc-800 hover:border-white disabled:opacity-30 text-[10px] uppercase text-zinc-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <!-- Nombre + Precio + Miniaturas -->
                <div class="flex items-start gap-3">
                  <!-- Miniatura principal si ya hay link -->
                  <div *ngIf="parseImagesList(row.imagenesText).length > 0" class="relative shrink-0">
                    <img
                      [src]="parseImagesList(row.imagenesText)[0]"
                      (error)="onImageError($event)"
                      alt="Preview"
                      class="w-16 h-16 object-cover border border-zinc-700 bg-zinc-950"
                    />
                    <span
                      *ngIf="parseImagesList(row.imagenesText).length > 1"
                      class="absolute bottom-0.5 right-0.5 px-1 bg-black/90 text-white text-[9px] font-mono border border-zinc-700"
                    >
                      +{{ parseImagesList(row.imagenesText).length - 1 }}
                    </span>
                  </div>

                  <div class="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div class="sm:col-span-8">
                      <input
                        type="text"
                        [(ngModel)]="row.nombre"
                        placeholder="Nombre del producto *"
                        class="w-full px-3 py-2.5 bg-[#111113] border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-white outline-none"
                      />
                    </div>
                    <div class="sm:col-span-4">
                      <input
                        type="number"
                        inputmode="numeric"
                        [(ngModel)]="row.precio"
                        min="0"
                        placeholder="Precio *"
                        class="w-full px-3 py-2.5 bg-[#111113] border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-white outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <!-- Links de fotos de este producto -->
                <textarea
                  [(ngModel)]="row.imagenesText"
                  rows="2"
                  placeholder="Pega 1 o varios links de fotos (separados por línea, coma o |)..."
                  class="w-full px-3 py-2 bg-[#111113] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:border-white outline-none font-mono"
                ></textarea>

                <!-- Chips de etiquetas recomendadas por fila (1 toque) -->
                <div class="flex flex-wrap gap-1.5">
                  <button
                    *ngFor="let tag of getRecommendedTagsForCategory(bulkCategoriaId())"
                    type="button"
                    (click)="toggleRowTag(row, tag)"
                    [class]="row.tags.includes(tag)
                      ? 'px-2 py-1 text-[10px] font-mono font-bold bg-white text-black border border-white'
                      : 'px-2 py-1 text-[10px] font-mono bg-[#111113] text-zinc-500 border border-zinc-800 hover:text-zinc-200'"
                  >
                    {{ row.tags.includes(tag) ? '✓ ' : '+ ' }}{{ tag }}
                  </button>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  (click)="agregarFilasMasivas(1)"
                  class="px-4 py-2.5 border border-zinc-700 hover:border-white text-xs font-mono uppercase text-white"
                >
                  + Agregar producto
                </button>
                <button
                  type="button"
                  (click)="agregarFilasMasivas(5)"
                  class="px-4 py-2.5 border border-zinc-800 hover:border-zinc-500 text-xs font-mono uppercase text-zinc-300"
                >
                  + Agregar 5
                </button>
              </div>
            </div>

            <!-- ============================================================ -->
            <!-- MODO C: PEGAR EXCEL / IMPORTAR CSV                           -->
            <!-- ============================================================ -->
            <div *ngIf="bulkMode() === 'csv'" class="p-3.5 sm:p-4 bg-black border border-zinc-800 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-[11px] font-mono text-zinc-400">
                  Formato simple: <span class="text-white">nombre, precio, etiquetas, imagenes</span>
                  (varias fotos con <code class="text-white">|</code>; el código se genera automático).
                </p>
                <div class="flex items-center gap-2 font-mono">
                  <button
                    type="button"
                    (click)="cargarEjemploCsv()"
                    class="px-3 py-1.5 border border-zinc-700 hover:border-white text-[10px] uppercase text-zinc-200"
                  >
                    Ejemplo
                  </button>
                  <label class="px-3 py-1.5 bg-white hover:bg-zinc-200 text-black text-[10px] font-bold uppercase cursor-pointer transition-colors">
                    Subir Excel (.xlsx / .csv)
                    <input type="file" accept=".xlsx,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" (change)="onSpreadsheetFileSelected($event)" class="hidden" />
                  </label>
                </div>
              </div>

              <div
                *ngIf="bulkUploadedFileName()"
                class="px-3 py-2 bg-[#111113] border border-zinc-700 text-[11px] font-mono text-zinc-200 flex items-center justify-between gap-2"
              >
                <span class="truncate">Archivo cargado: <strong class="text-white">{{ bulkUploadedFileName() }}</strong></span>
                <button
                  type="button"
                  (click)="bulkUploadedFileName.set(''); bulkCsvText = ''"
                  class="text-zinc-400 hover:text-white shrink-0"
                >
                  ✕
                </button>
              </div>

              <textarea
                [(ngModel)]="bulkCsvText"
                rows="6"
                placeholder="Tenis Street Black, 185000, Tallas 38-43, https://url1.jpg | https://url2.jpg"
                class="w-full p-3 bg-[#111113] border border-zinc-800 focus:border-white text-xs text-white font-mono outline-none"
              ></textarea>

              <div class="flex items-center justify-between gap-3">
                <span class="text-[11px] font-mono text-zinc-400">
                  Detectados: <strong class="text-white">{{ parseCsvToDrafts().length }}</strong> productos
                </span>
                <button
                  type="button"
                  (click)="pasarCsvATabla()"
                  [disabled]="parseCsvToDrafts().length === 0"
                  class="px-3.5 py-2 border border-zinc-700 hover:border-white disabled:opacity-40 text-[10px] font-mono uppercase text-zinc-200"
                >
                  Editar en Tarjetas →
                </button>
              </div>
            </div>
          </div>

          <!-- Sticky Bottom Footer (Always reachable on phone) -->
          <div class="px-4 sm:px-7 py-3.5 pb-safe border-t border-zinc-800 bg-black flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 font-mono">
            <div class="text-[11px] text-zinc-400">
              Listos: <strong class="text-white">{{ getValidBulkProductsCount() }}</strong>
              <span *ngIf="getSelectedBulkCategoryName()"> en <strong class="text-white uppercase">{{ getSelectedBulkCategoryName() }}</strong></span>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="showBulkModal.set(false)"
                class="px-4 py-3 border border-zinc-800 hover:border-zinc-500 text-xs uppercase text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="guardarLoteMasivo()"
                [disabled]="saving() || getValidBulkProductsCount() === 0 || !bulkCategoriaId()"
                class="flex-1 sm:flex-none px-5 py-3 bg-white hover:bg-zinc-200 disabled:opacity-40 text-black text-xs font-bold uppercase tracking-wider"
              >
                {{ saving() ? 'Subiendo...' : 'Subir ' + getValidBulkProductsCount() + ' Productos' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL CREAR / EDITAR CATEGORÍA -->
      <div
        *ngIf="showCategoriaModal()"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      >
        <div class="bg-[#111113] w-full sm:max-w-md p-5 sm:p-8 border-t sm:border border-zinc-800">
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
                  inputmode="numeric"
                  name="cat_orden"
                  [(ngModel)]="catForm.orden"
                  class="w-full px-3.5 py-2.5 bg-black border border-zinc-800 text-sm text-white outline-none focus:border-white font-mono"
                />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Descripción (opcional)</label>
              <textarea
                name="cat_descripcion"
                [(ngModel)]="catForm.descripcion"
                rows="2"
                placeholder="Breve descripción..."
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

            <div class="flex items-center justify-end gap-3 pt-4 pb-safe border-t border-zinc-800 font-mono">
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

  // Single Product Modal State
  showProductoModal = signal<boolean>(false);
  editingProductoId = signal<number | null>(null);
  prodImages = signal<string[]>([]);
  prodSelectedTags = signal<string[]>([]);
  showOptionalDesc = signal<boolean>(false);
  newImageUrlInput = '';
  customTagInput = '';

  // Bulk Upload Modal State
  showBulkModal = signal<boolean>(false);
  bulkMode = signal<'links' | 'table' | 'csv'>('links');
  bulkCategoriaId = signal<number | null>(null);
  bulkDefaultPrice: number | null = null;
  bulkDefaultTags = signal<string[]>([]);
  bulkNamePrefix = '';
  bulkRawLinksText = '';
  bulkRows: BulkRowDraft[] = [];
  bulkCsvText = '';
  bulkUploadedFileName = signal<string>('');

  // Category Modal State
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
  // CÓDIGO AUTOMÁTICO POR CATEGORÍA + ETIQUETAS RECOMENDADAS
  // ==========================================================================
  private getCategoryPrefix(catId: number | null | undefined): string {
    const cat = this.categorias().find((c) => Number(c.id) === Number(catId));
    if (!cat?.nombre) return 'PRD';
    const clean = cat.nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
    return (clean.slice(0, 3) || 'PRD').padEnd(3, 'X');
  }

  private getNextSequenceForPrefix(prefix: string): number {
    const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
    let max = 0;
    for (const p of this.productos()) {
      const match = (p.codigo || '').trim().match(regex);
      if (match) {
        const num = Number(match[1]);
        if (num > max) max = num;
      }
    }
    return max + 1;
  }

  generateNextCode(catId: number | null | undefined, offset = 0): string {
    const prefix = this.getCategoryPrefix(catId);
    const nextNum = this.getNextSequenceForPrefix(prefix) + offset;
    return `${prefix}-${String(nextNum).padStart(3, '0')}`;
  }

  getRecommendedTagsForCategory(catId: number | null | undefined): string[] {
    const cat = this.categorias().find((c) => Number(c.id) === Number(catId));
    const name = (cat?.nombre || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (/(zapat|tenis|calzad|sneaker|bota|sandal)/.test(name)) {
      return [
        'Tallas 36-40',
        'Tallas 38-43',
        'Tallas 35-43',
        'Unisex',
        'Importado',
        'Triple A',
        'Caja original',
        'Envío inmediato',
      ];
    }

    if (/(camiset|ropa|moda|hoodie|buzo|pantalon|jean|chaqueta|polo|sudad)/.test(name)) {
      return [
        'Tallas S-XL',
        'Oversize',
        'Algodón',
        'Unisex',
        'Nuevo',
        'Edición limitada',
        'Envío inmediato',
      ];
    }

    if (/(gorra|cap|accesor|bolso|gafa|reloj|cadena)/.test(name)) {
      return [
        'Talla única',
        'Ajustable',
        'Unisex',
        'Importado',
        'Nuevo',
        'Envío inmediato',
      ];
    }

    if (/(tecno|audio|electro|hogar|audifon|parlant)/.test(name)) {
      return [
        'Nuevo en caja',
        'Garantía',
        'Original',
        'Envío inmediato',
        'Disponible',
      ];
    }

    return [
      'Nuevo',
      'Unisex',
      'Importado',
      'Calidad Premium',
      'Edición limitada',
      'Envío inmediato',
      'Bajo pedido',
    ];
  }

  onSingleCategoryChange(catId: number | null): void {
    if (!this.editingProductoId()) {
      this.prodForm.codigo = this.generateNextCode(catId);
    }
  }

  toggleSingleTag(tag: string): void {
    const current = this.prodSelectedTags();
    if (current.includes(tag)) {
      this.prodSelectedTags.set(current.filter((t) => t !== tag));
    } else {
      this.prodSelectedTags.set([...current, tag]);
    }
  }

  getCustomSingleTags(): string[] {
    const recommended = this.getRecommendedTagsForCategory(this.prodForm.categoria_id);
    return this.prodSelectedTags().filter((t) => !recommended.includes(t));
  }

  addCustomSingleTag(): void {
    const clean = this.customTagInput.trim();
    if (!clean) return;
    if (!this.prodSelectedTags().includes(clean)) {
      this.prodSelectedTags.set([...this.prodSelectedTags(), clean]);
    }
    this.customTagInput = '';
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
  // PRODUCTOS CRUD (SINGLE)
  // ==========================================================================
  getEmptyProductoForm(): Partial<Producto> {
    const defaultCat = this.filterCategoriaId() ?? this.categorias()[0]?.id ?? null;
    return {
      categoria_id: defaultCat,
      codigo: this.generateNextCode(defaultCat),
      nombre: '',
      descripcion: '',
      precio: undefined,
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
    this.customTagInput = '';
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

      const tags = (prod.etiquetas || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      this.prodSelectedTags.set(tags);
      this.showOptionalDesc.set(!!prod.descripcion?.trim());

      this.prodForm = {
        ...prod,
        codigo: prod.codigo || this.generateNextCode(prod.categoria_id),
        precio_anterior: null,
        destacado: false,
      };
    } else {
      this.editingProductoId.set(null);
      this.prodImages.set([]);
      this.prodSelectedTags.set([]);
      this.showOptionalDesc.set(false);
      this.prodForm = this.getEmptyProductoForm();
    }
    this.showProductoModal.set(true);
  }

  guardarProducto(): void {
    if (!this.prodForm.nombre?.trim()) return;
    if (this.newImageUrlInput.trim()) {
      this.agregarImagenesDesdeInput();
    }
    if (this.customTagInput.trim()) {
      this.addCustomSingleTag();
    }

    this.saving.set(true);

    const imgs = this.prodImages();
    const codigoFinal =
      this.prodForm.codigo?.trim() || this.generateNextCode(this.prodForm.categoria_id);

    const payload: Partial<Producto> = {
      ...this.prodForm,
      nombre: this.prodForm.nombre.trim(),
      codigo: codigoFinal,
      precio: Number(this.prodForm.precio || 0),
      descripcion: this.showOptionalDesc() ? (this.prodForm.descripcion || '').trim() : '',
      etiquetas: this.prodSelectedTags().join(', '),
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
        this.mostrarToast(
          id ? 'Producto actualizado' : `Producto creado (${codigoFinal})`
        );
        this.cargarDatos();
      },
      error: (err) => {
        this.saving.set(false);
        alert(err?.error?.message || 'Error al guardar el producto. Verifica que el backend esté activo.');
      },
    });
  }

  toggleDisponible(prod: Producto): void {
    const actualizado = {
      ...prod,
      disponible: !prod.disponible,
      precio_anterior: null,
      destacado: false,
    };
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
  // SUBIDA MASIVA DINÁMICA POR CATEGORÍA
  // ==========================================================================
  private createEmptyBulkRow(): BulkRowDraft {
    return {
      nombre: '',
      precio: this.bulkDefaultPrice,
      tags: [...this.bulkDefaultTags()],
      imagenesText: '',
    };
  }

  abrirModalMasivo(): void {
    const defaultCat = this.filterCategoriaId() ?? this.categorias()[0]?.id ?? null;
    this.bulkCategoriaId.set(defaultCat);
    this.bulkMode.set('links');
    this.bulkDefaultPrice = null;
    this.bulkDefaultTags.set([]);
    this.bulkNamePrefix = '';
    this.bulkRawLinksText = '';
    this.bulkCsvText = '';
    this.bulkUploadedFileName.set('');
    this.bulkRows = [
      this.createEmptyBulkRow(),
      this.createEmptyBulkRow(),
      this.createEmptyBulkRow(),
    ];
    this.showBulkModal.set(true);
  }

  onBulkCategoryChange(catId: number | null): void {
    this.bulkCategoriaId.set(catId);
    // Limpia etiquetas por defecto que ya no pertenecen a la nueva categoría
    const allowed = this.getRecommendedTagsForCategory(catId);
    this.bulkDefaultTags.set(this.bulkDefaultTags().filter((t) => allowed.includes(t)));
  }

  toggleBulkDefaultTag(tag: string): void {
    const current = this.bulkDefaultTags();
    if (current.includes(tag)) {
      this.bulkDefaultTags.set(current.filter((t) => t !== tag));
    } else {
      this.bulkDefaultTags.set([...current, tag]);
    }
  }

  toggleRowTag(row: BulkRowDraft, tag: string): void {
    if (row.tags.includes(tag)) {
      row.tags = row.tags.filter((t) => t !== tag);
    } else {
      row.tags = [...row.tags, tag];
    }
  }

  getPreviewBulkCode(index: number): string {
    return this.generateNextCode(this.bulkCategoriaId(), index);
  }

  agregarFilasMasivas(count: number): void {
    for (let i = 0; i < count; i++) {
      this.bulkRows.push(this.createEmptyBulkRow());
    }
  }

  duplicarFilaMasiva(index: number): void {
    const row = this.bulkRows[index];
    if (!row) return;
    this.bulkRows.splice(index + 1, 0, {
      ...row,
      tags: [...row.tags],
    });
  }

  eliminarFilaMasiva(index: number): void {
    if (this.bulkRows.length <= 1) return;
    this.bulkRows.splice(index, 1);
  }

  aplicarDefaultsMasivo(): void {
    const tagsCopy = [...this.bulkDefaultTags()];
    this.bulkRows.forEach((row) => {
      if (this.bulkDefaultPrice !== null && this.bulkDefaultPrice >= 0) {
        row.precio = this.bulkDefaultPrice;
      }
      if (tagsCopy.length > 0) {
        row.tags = Array.from(new Set([...row.tags, ...tagsCopy]));
      }
    });
  }

  // Modo A: Pegar links masivos (1 línea = 1 producto; varios links en una línea con coma o | = múltiples fotos)
  private parseBulkLinkLines(): string[][] {
    return this.bulkRawLinksText
      .split(/\r?\n/)
      .map((line) =>
        line
          .split(/[,|]+/)
          .map((u) => u.trim())
          .filter((u) => u.startsWith('http://') || u.startsWith('https://'))
      )
      .filter((group) => group.length > 0);
  }

  countBulkLinkGroups(): number {
    return this.parseBulkLinkLines().length;
  }

  generarTarjetasDesdeLinks(): void {
    const groups = this.parseBulkLinkLines();
    if (groups.length === 0) return;

    const baseName =
      this.bulkNamePrefix.trim() ||
      this.getSelectedBulkCategoryName() ||
      'Producto';

    const startSeq = this.getNextSequenceForPrefix(
      this.getCategoryPrefix(this.bulkCategoriaId())
    );

    this.bulkRows = groups.map((urls, idx) => ({
      nombre: `${baseName} #${startSeq + idx}`,
      precio: this.bulkDefaultPrice,
      tags: [...this.bulkDefaultTags()],
      imagenesText: urls.join('\n'),
    }));

    this.bulkMode.set('table');
  }

  // Modo C: Excel / CSV simplificado
  cargarEjemploCsv(): void {
    this.bulkCsvText = [
      'nombre, precio, etiquetas, imagenes',
      'Tenis Street Black, 185000, Tallas 38-43 | Importado, https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800 | https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
      'Tenis Urban White, 175000, Tallas 37-42, https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
    ].join('\n');
  }

  async onSpreadsheetFileSelected(event: Event): Promise < void> {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if(!file) return;

      const lowerName = file.name.toLowerCase();

      try {
        if(lowerName.endsWith('.xlsx')) {
      const rows = await readXlsxRows(file);
      if (rows.length === 0) {
        alert('El archivo Excel no contiene filas con datos.');
        return;
      }
      this.bulkCsvText = rows
        .map((cols) => cols.map((c) => c.replace(/\t|\r|\n/g, ' ').trim()).join('\t'))
        .join('\n');
      this.bulkUploadedFileName.set(file.name);
    } else {
      const text = await file.text();
      this.bulkCsvText = text.replace(/^\uFEFF/, '');
      this.bulkUploadedFileName.set(file.name);
    }
  } catch(err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : 'No se pudo leer el archivo. Verifica que sea un .xlsx o .csv válido.';
    alert(msg);
  } finally {
    input.value = '';
  }
  }

  private parseFlexiblePrice(raw: string): number | null {
  const trimmed = (raw || '').trim();
  if (!trimmed) return this.bulkDefaultPrice;
  // Quita decimales de 2 dígitos al final (ej: 185000.00 o 185.000,00) y limpia separadores de miles / símbolos
  const withoutCents = trimmed.replace(/[.,]\d{2}$/, '');
  const digits = withoutCents.replace(/[^\d]/g, '');
  if (!digits) return this.bulkDefaultPrice;
  const parsed = Number(digits);
  return Number.isNaN(parsed) ? null : parsed;
}

parseCsvToDrafts(): BulkRowDraft[] {
  const raw = this.bulkCsvText.replace(/^\uFEFF/, '').trim();
  if (!raw) return [];

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const drafts: BulkRowDraft[] = [];

  lines.forEach((line, idx) => {
    const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
    const cols = line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));

    if (idx === 0 && cols[0]?.toLowerCase() === 'nombre') return;

    const nombre = cols[0] || '';
    const precio = this.parseFlexiblePrice(cols[1] || '');

    if (!nombre || precio === null || Number.isNaN(precio)) return;

    const rowTags = (cols[2] || '')
      .split(/[|;]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    drafts.push({
      nombre,
      precio,
      tags: rowTags.length > 0 ? rowTags : [...this.bulkDefaultTags()],
      imagenesText: cols.slice(3).filter(Boolean).join(' | '),
    });
  });

  return drafts;
}

pasarCsvATabla(): void {
  const parsed = this.parseCsvToDrafts();
  if(parsed.length === 0) return;
  this.bulkRows = parsed;
  this.bulkMode.set('table');
}

  private getBulkDraftsSource(): BulkRowDraft[] {
  if (this.bulkMode() === 'csv') return this.parseCsvToDrafts();
  if (this.bulkMode() === 'links') {
    const groups = this.parseBulkLinkLines();
    const baseName =
      this.bulkNamePrefix.trim() ||
      this.getSelectedBulkCategoryName() ||
      'Producto';
    const startSeq = this.getNextSequenceForPrefix(
      this.getCategoryPrefix(this.bulkCategoriaId())
    );
    return groups.map((urls, idx) => ({
      nombre: `${baseName} #${startSeq + idx}`,
      precio: this.bulkDefaultPrice,
      tags: [...this.bulkDefaultTags()],
      imagenesText: urls.join('\n'),
    }));
  }
  return this.bulkRows;
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
  if(!catId) {
    alert('Selecciona primero la categoría para el lote.');
    return;
  }

    const validRows = this.getBulkDraftsSource().filter(
    (r) => r.nombre.trim().length > 0 && r.precio !== null && Number(r.precio) >= 0
  );

  if(validRows.length === 0) {
  alert('Asegúrate de tener nombre y precio en los productos antes de subir.');
  return;
}

const productosPayload: Partial<Producto>[] = validRows.map((r, idx) => {
  const imgs = this.parseImagesList(r.imagenesText);
  return {
    categoria_id: catId,
    codigo: this.generateNextCode(catId, idx),
    nombre: r.nombre.trim(),
    precio: Number(r.precio),
    etiquetas: r.tags.join(', '),
    descripcion: '',
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
      this.mostrarToast(
        `Se subieron ${res.creados} productos en ${this.getSelectedBulkCategoryName() || 'la categoría'}`
      );
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
  if(imgEl && imgEl.src !== this.defaultImage) {
  imgEl.src = this.defaultImage;
}
  }

// ==========================================================================
// CATEGORÍAS CRUD
// ==========================================================================
getEmptyCategoriaForm(): Partial < Categoria > {
  return {
    nombre: '',
    descripcion: '',
    icono: 'shirt',
    orden: this.categorias().length + 1,
    activo: true,
  };
}

abrirModalCategoria(cat ?: Categoria): void {
  if(cat) {
    this.editingCategoriaId.set(cat.id);
    this.catForm = { ...cat };
  } else {
    this.editingCategoriaId.set(null);
    this.catForm = this.getEmptyCategoriaForm();
  }
    this.showCategoriaModal.set(true);
}

guardarCategoria(): void {
  if(!this.catForm.nombre) return;
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
  if(!confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return;
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
