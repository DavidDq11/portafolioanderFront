import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { AuthService } from '../../core/services/auth.service';
import { Categoria, Producto } from '../../core/models/catalog.models';

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

        <!-- Tabs & Primary Action -->
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

          <div>
            <button
              *ngIf="activeTab() === 'productos'"
              type="button"
              (click)="abrirModalProducto()"
              class="px-4 sm:px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              + Nuevo Producto
            </button>
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
                <img
                  [src]="prod.imagen_url || defaultImage"
                  (error)="onImageError($event)"
                  [alt]="prod.nombre"
                  class="w-16 h-16 object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                />
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
                      <img
                        [src]="prod.imagen_url || defaultImage"
                        (error)="onImageError($event)"
                        [alt]="prod.nombre"
                        class="w-12 h-12 object-cover bg-zinc-950 border border-zinc-800 flex-shrink-0"
                      />
                      <div>
                        <div class="font-bold text-white">{{ prod.nombre }}</div>
                        <div class="text-[11px] font-mono text-zinc-500 flex items-center gap-2 mt-0.5">
                          <span *ngIf="prod.codigo">{{ prod.codigo }}</span>
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

      <!-- MODAL CREAR / EDITAR PRODUCTO -->
      <div
        *ngIf="showProductoModal()"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      >
        <div class="bg-[#111113] max-w-2xl w-full p-5 sm:p-8 border border-zinc-800 my-8 max-h-[92vh] overflow-y-auto">
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
                  placeholder="Ej: Camiseta Oversize Negra"
                  class="w-full px-3.5 py-2.5 bg-black border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-white outline-none"
                />
              </div>

              <div>
                <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Código / SKU</label>
                <input
                  type="text"
                  name="codigo"
                  [(ngModel)]="prodForm.codigo"
                  placeholder="Ej: CAM-001"
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
                  placeholder="65000"
                  class="w-full px-3.5 py-2.5 bg-black border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-white outline-none font-mono"
                />
              </div>
            </div>

            <!-- Imagen por URL -->
            <div class="p-4 bg-black border border-zinc-800">
              <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2.5">
                URL de la Imagen del Producto
              </label>

              <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <img
                  [src]="prodForm.imagen_url || defaultImage"
                  (error)="onImageError($event)"
                  alt="Vista previa"
                  class="w-20 h-20 object-cover border border-zinc-800 bg-zinc-950 flex-shrink-0"
                />

                <div class="flex-1 w-full space-y-1.5">
                  <input
                    type="url"
                    name="imagen_url"
                    [(ngModel)]="prodForm.imagen_url"
                    placeholder="https://i.ibb.co/... o https://res.cloudinary.com/..."
                    class="w-full px-3.5 py-2.5 bg-[#111113] border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-white outline-none"
                  />
                  <p class="text-[11px] font-mono text-zinc-500">
                    Pega el enlace directo de la imagen (ImgBB, Cloudinary, Postimages, etc.).
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Etiquetas (separadas por coma)
              </label>
              <input
                type="text"
                name="etiquetas"
                [(ngModel)]="prodForm.etiquetas"
                placeholder="Ej: Algodón 240g, Oversize, Tallas S a XL"
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
                placeholder="Ej: Camisetas, Gorras, Hoodies..."
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
      etiquetas: '',
      destacado: false,
      disponible: true,
    };
  }

  abrirModalProducto(prod?: Producto): void {
    if (prod) {
      this.editingProductoId.set(prod.id);
      this.prodForm = { ...prod, precio_anterior: null, destacado: false };
    } else {
      this.editingProductoId.set(null);
      this.prodForm = this.getEmptyProductoForm();
    }
    this.showProductoModal.set(true);
  }

  guardarProducto(): void {
    if (!this.prodForm.nombre) return;
    this.saving.set(true);

    const payload: Partial<Producto> = {
      ...this.prodForm,
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
