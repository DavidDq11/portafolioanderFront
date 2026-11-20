import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { AuthService } from '../../core/services/auth.service';
import { Categoria, Producto } from '../../core/models/catalog.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex flex-col bg-[#050507] text-zinc-100">
      <!-- Top Streetwear Marquee Ticker -->
      <div class="bg-white text-black overflow-hidden border-b border-zinc-800 py-1.5 select-none">
        <div class="flex whitespace-nowrap animate-marquee font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em]">
          <span class="mx-6">CATÁLOGO OFICIAL 2026</span>
          <span class="mx-2">//</span>
          <span class="mx-6">EDICIÓN &amp; STOCK ACTUALIZADO</span>
          <span class="mx-2">//</span>
          <span class="mx-6">PEDIDOS DIRECTOS POR WHATSAPP</span>
          <span class="mx-2">//</span>
          <span class="mx-6">SELECCIÓN EXCLUSIVA POR CATEGORÍA</span>
          <span class="mx-2">//</span>
          <span class="mx-6">CATÁLOGO OFICIAL 2026</span>
          <span class="mx-2">//</span>
          <span class="mx-6">EDICIÓN &amp; STOCK ACTUALIZADO</span>
          <span class="mx-2">//</span>
          <span class="mx-6">PEDIDOS DIRECTOS POR WHATSAPP</span>
          <span class="mx-2">//</span>
          <span class="mx-6">SELECCIÓN EXCLUSIVA POR CATEGORÍA</span>
          <span class="mx-2">//</span>
        </div>
      </div>

      <!-- Sticky Header -->
      <header class="sticky top-0 z-30 bg-[#050507]/95 backdrop-blur-md border-b border-zinc-800/90">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <!-- Brand Mark -->
          <button
            type="button"
            (click)="resetFilters()"
            class="flex items-center gap-3 text-left group"
          >
            <div class="w-10 h-10 bg-white text-black flex items-center justify-center font-display text-2xl tracking-wider leading-none pt-0.5">
              {{ getStoreInitials() }}
            </div>
            <div>
              <h1 class="font-display text-2xl sm:text-3xl tracking-[0.1em] text-white leading-none uppercase">
                {{ storeName }}
              </h1>
              <p class="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500 mt-0.5">
                Catálogo // Drop Store
              </p>
            </div>
          </button>

          <!-- Desktop Search -->
          <div class="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              placeholder="Buscar producto, categoría o código..."
              class="w-full pl-10 pr-8 py-2.5 bg-[#0c0c0f] border border-zinc-800 focus:border-white text-sm text-white placeholder-zinc-500 outline-none transition-colors"
            />
            <svg class="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button
              *ngIf="searchTerm()"
              type="button"
              (click)="searchTerm.set('')"
              class="absolute right-3 top-2.5 text-zinc-500 hover:text-white text-sm"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          </div>

          <!-- Header Navigation & CTA -->
          <div class="flex items-center gap-3 sm:gap-5">
            <a
              href="#categorias"
              class="hidden lg:inline-block text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-400 hover:text-white transition-colors"
            >
              Categorías
            </a>
            <a
              href="#catalogo"
              class="hidden lg:inline-block text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-400 hover:text-white transition-colors"
            >
              Productos
            </a>
            <a
              [routerLink]="authService.isAuthenticated() ? '/admin' : '/admin/login'"
              class="hidden sm:inline-block text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 hover:text-white transition-colors"
            >
              {{ authService.isAuthenticated() ? 'Panel' : 'Admin' }}
            </a>
            <a
              [href]="getGeneralWhatsappUrl()"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-zinc-200 text-black text-[11px] font-mono font-bold uppercase tracking-widest transition-colors"
            >
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z"/>
              </svg>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        <!-- Mobile Search -->
        <div class="md:hidden px-4 pb-3">
          <div class="relative">
            <input
              type="text"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              placeholder="Buscar producto, categoría o referencia..."
              class="w-full pl-9 pr-8 py-2 bg-[#0c0c0f] border border-zinc-800 focus:border-white text-sm text-white placeholder-zinc-500 outline-none"
            />
            <svg class="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button
              *ngIf="searchTerm()"
              type="button"
              (click)="searchTerm.set('')"
              class="absolute right-3 top-2 text-zinc-500 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      </header>

      <!-- HERO: Editorial Rap Drop + Spotlight Showcase -->
      <section class="relative border-b border-zinc-800/90 bg-grid-subtle overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <!-- Left Copy -->
            <div class="lg:col-span-7">
              <div class="inline-flex items-center gap-2.5 px-3 py-1 border border-zinc-700 bg-black/80 text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-300 mb-5">
                <span class="w-1.5 h-1.5 bg-white"></span>
                <span>Selección Oficial // {{ productosDisponiblesCount() }} Piezas en Stock</span>
                <span *ngIf="catalogService.isOfflineDemo()" class="text-zinc-500">· DEMO</span>
              </div>

              <h2 class="font-display text-5xl sm:text-7xl lg:text-[5.25rem] uppercase tracking-wide text-white leading-[0.92]">
                NO ES UN CATÁLOGO MÁS.<br />
                <span class="text-zinc-500">ES TU PRÓXIMO DROP.</span>
              </h2>

              <p class="mt-5 text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed">
                Cada categoría reúne piezas escogidas con criterio — sin relleno, precios claros y atención directa al instante. Elige tu estilo, revisa el catálogo y sepáralo por WhatsApp.
              </p>

              <div class="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#categorias"
                  class="px-6 py-3.5 bg-white hover:bg-zinc-200 text-black text-xs font-mono font-bold uppercase tracking-[0.18em] transition-colors inline-flex items-center gap-2"
                >
                  <span>Explorar Categorías</span>
                  <span aria-hidden="true">↓</span>
                </a>
                <a
                  [href]="getGeneralWhatsappUrl()"
                  target="_blank"
                  rel="noopener"
                  class="px-6 py-3.5 border border-zinc-700 hover:border-white bg-black/70 text-white text-xs font-mono uppercase tracking-[0.18em] transition-colors inline-flex items-center gap-2"
                >
                  <span>Hablar Directo</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>

              <!-- Micro Metrics Strip -->
              <div class="mt-8 pt-6 border-t border-zinc-800/80 grid grid-cols-3 gap-4 max-w-md font-mono">
                <div>
                  <span class="block text-2xl sm:text-3xl font-bold text-white leading-none">
                    {{ padZero(categoriasActivas().length) }}
                  </span>
                  <span class="block text-[10px] uppercase tracking-widest text-zinc-500 mt-1.5">Categorías</span>
                </div>
                <div>
                  <span class="block text-2xl sm:text-3xl font-bold text-white leading-none">
                    {{ padZero(productosDisponiblesCount()) }}
                  </span>
                  <span class="block text-[10px] uppercase tracking-widest text-zinc-500 mt-1.5">Disponibles</span>
                </div>
                <div>
                  <span class="block text-2xl sm:text-3xl font-bold text-white leading-none">
                    {{ padZero(ofertasCount()) }}
                  </span>
                  <span class="block text-[10px] uppercase tracking-widest text-zinc-500 mt-1.5">En Oferta</span>
                </div>
              </div>
            </div>

            <!-- Right: Featured Drop Spotlight -->
            <div class="lg:col-span-5" *ngIf="spotlightProducto() as spot">
              <div class="bg-[#0c0c0f] border border-zinc-800 group">
                <!-- Spotlight Top Bar -->
                <div class="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]">
                  <span class="text-white font-bold">
                    "DESTACADO" // {{ padZero(spotlightIndex() + 1) }}/{{ padZero(featuredList().length) }}
                  </span>
                  <div class="flex items-center gap-1" *ngIf="featuredList().length > 1">
                    <button
                      type="button"
                      (click)="prevSpotlight()"
                      class="w-6 h-6 border border-zinc-800 hover:border-white text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                      aria-label="Producto destacado anterior"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      (click)="nextSpotlight()"
                      class="w-6 h-6 border border-zinc-800 hover:border-white text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                      aria-label="Siguiente producto destacado"
                    >
                      →
                    </button>
                  </div>
                </div>

                <!-- Spotlight Visual -->
                <div
                  class="relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] bg-black overflow-hidden cursor-pointer"
                  (click)="selectedProducto.set(spot)"
                >
                  <img
                    [src]="spot.imagen_url || defaultImage"
                    (error)="onImageError($event)"
                    [alt]="spot.nombre"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

                  <!-- Discount Callout -->
                  <span
                    *ngIf="getDiscountPercent(spot) > 0"
                    class="absolute top-3 left-3 px-2.5 py-1 bg-white text-black font-mono text-[11px] font-bold uppercase tracking-wider"
                  >
                    -{{ getDiscountPercent(spot) }}% OFF
                  </span>

                  <span
                    *ngIf="spot.codigo"
                    class="absolute top-3 right-3 px-2 py-1 bg-black/80 border border-zinc-700 text-zinc-300 font-mono text-[10px]"
                  >
                    {{ spot.codigo }}
                  </span>

                  <!-- Bottom Overlay Info -->
                  <div class="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <span class="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-400">
                      {{ spot.categoria_nombre || 'Colección' }}
                    </span>
                    <h3 class="font-display text-2xl sm:text-3xl tracking-wide text-white uppercase leading-tight mt-0.5 line-clamp-1">
                      {{ spot.nombre }}
                    </h3>
                  </div>
                </div>

                <!-- Spotlight Footer Action -->
                <div class="p-4 flex items-center justify-between gap-3 bg-[#0c0c0f]">
                  <div>
                    <span
                      *ngIf="spot.precio_anterior && spot.precio_anterior > spot.precio"
                      class="block text-[11px] font-mono text-zinc-500 line-through"
                    >
                      {{ formatPrice(spot.precio_anterior) }}
                    </span>
                    <span class="text-xl font-mono font-bold text-white">
                      {{ formatPrice(spot.precio) }}
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="selectedProducto.set(spot)"
                      class="px-3.5 py-2 border border-zinc-700 hover:border-white text-[11px] font-mono uppercase tracking-wider text-zinc-200 transition-colors"
                    >
                      Ver Pieza
                    </button>
                    <a
                      [href]="getProductWhatsappUrl(spot)"
                      target="_blank"
                      rel="noopener"
                      class="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-[11px] font-mono font-bold uppercase tracking-wider transition-colors"
                    >
                      Lo quiero →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- VISUAL CATEGORY CATALOGS SECTION -->
      <section id="categorias" class="border-b border-zinc-800/90 bg-[#08080a]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span class="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">
                01 // Catálogos por Línea
              </span>
              <h2 class="font-display text-3xl sm:text-5xl uppercase tracking-wide text-white leading-none mt-1">
                Explora Cada Categoría
              </h2>
            </div>

            <button
              type="button"
              (click)="selectCategoryAndScroll(null)"
              [class]="selectedCategoryId() === null
                ? 'self-start sm:self-auto px-4 py-2 bg-white text-black text-[11px] font-mono font-bold uppercase tracking-wider border border-white transition-colors'
                : 'self-start sm:self-auto px-4 py-2 bg-transparent text-zinc-300 hover:text-white text-[11px] font-mono uppercase tracking-wider border border-zinc-700 hover:border-white transition-colors'"
            >
              Ver Todo [{{ productosDisponiblesCount() }}]
            </button>
          </div>

          <!-- Editorial Category Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              *ngFor="let cat of categoriasActivas(); let idx = index"
              type="button"
              (click)="selectCategoryAndScroll(cat.id)"
              [class]="selectedCategoryId() === cat.id
                ? 'group relative text-left overflow-hidden border-2 border-white bg-black transition-all'
                : 'group relative text-left overflow-hidden border border-zinc-800 hover:border-zinc-400 bg-black transition-all'"
            >
              <!-- Category Preview Background Photo -->
              <div class="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden bg-zinc-950">
                <img
                  [src]="getCategoryCoverImage(cat.id)"
                  (error)="onImageError($event)"
                  [alt]="cat.nombre"
                  loading="lazy"
                  class="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 opacity-55 group-hover:opacity-75"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20"></div>

                <!-- Top Row: Index + Count -->
                <div class="absolute top-3 inset-x-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
                  <span class="px-2 py-0.5 bg-black/80 border border-zinc-700 text-zinc-300">
                    CAT {{ padZero(idx + 1) }}
                  </span>
                  <span
                    [class]="selectedCategoryId() === cat.id
                      ? 'px-2 py-0.5 bg-white text-black font-bold'
                      : 'px-2 py-0.5 bg-black/80 text-white border border-zinc-700'"
                  >
                    {{ getCategoryProductCount(cat.id) }} PIEZAS
                  </span>
                </div>

                <!-- Bottom Row: Title & CTA -->
                <div class="absolute inset-x-0 bottom-0 p-4">
                  <h3 class="font-display text-2xl sm:text-3xl tracking-wide text-white uppercase leading-none">
                    {{ cat.nombre }}
                  </h3>
                  <p *ngIf="cat.descripcion" class="text-[11px] text-zinc-400 mt-1.5 line-clamp-1">
                    {{ cat.descripcion }}
                  </p>
                  <div class="mt-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em]">
                    <span [class]="selectedCategoryId() === cat.id ? 'text-white font-bold' : 'text-zinc-400 group-hover:text-white'">
                      {{ selectedCategoryId() === cat.id ? '● VIENDO CATÁLOGO' : 'ABRIR CATÁLOGO' }}
                    </span>
                    <span class="text-white group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      <!-- MAIN PRODUCTS CATALOG -->
      <main id="catalogo" class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <!-- Active Category Heading + Controls -->
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-zinc-800/90">
          <div>
            <span class="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">
              02 // Vitrinas &amp; Piezas Disponibles
            </span>
            <h2 class="font-display text-4xl sm:text-5xl uppercase tracking-wide text-white leading-none mt-1">
              {{ selectedCategoryName() ? selectedCategoryName() : 'Catálogo Completo' }}
            </h2>
            <p *ngIf="selectedCategoryDescription()" class="text-sm text-zinc-400 mt-1.5">
              {{ selectedCategoryDescription() }}
            </p>
          </div>

          <!-- Quick Category Pills + Filter Toggles -->
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              (click)="onlyFeatured.set(!onlyFeatured())"
              [class]="onlyFeatured()
                ? 'px-3.5 py-2 text-[11px] font-mono font-bold uppercase tracking-wider bg-white text-black border border-white transition-colors'
                : 'px-3.5 py-2 text-[11px] font-mono uppercase tracking-wider bg-[#0c0c0f] text-zinc-300 border border-zinc-800 hover:border-white transition-colors'"
            >
              Top Destacados
            </button>

            <button
              type="button"
              (click)="onlyDeals.set(!onlyDeals())"
              [class]="onlyDeals()
                ? 'px-3.5 py-2 text-[11px] font-mono font-bold uppercase tracking-wider bg-white text-black border border-white transition-colors'
                : 'px-3.5 py-2 text-[11px] font-mono uppercase tracking-wider bg-[#0c0c0f] text-zinc-300 border border-zinc-800 hover:border-white transition-colors'"
            >
              Solo Ofertas
            </button>

            <select
              [ngModel]="sortBy()"
              (ngModelChange)="sortBy.set($event)"
              class="px-3.5 py-2 text-[11px] font-mono uppercase tracking-wider bg-[#0c0c0f] text-zinc-200 border border-zinc-800 focus:border-white outline-none cursor-pointer"
            >
              <option value="featured">Orden: Destacados</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="name-asc">Nombre: A - Z</option>
            </select>
          </div>
        </div>

        <!-- Compact Category Switcher + Counter -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 mb-6">
          <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button
              type="button"
              (click)="selectedCategoryId.set(null)"
              [class]="selectedCategoryId() === null
                ? 'px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider bg-white text-black border border-white whitespace-nowrap'
                : 'px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400 border border-zinc-800 hover:border-zinc-500 hover:text-white whitespace-nowrap'"
            >
              Todos
            </button>
            <button
              *ngFor="let cat of categoriasActivas()"
              type="button"
              (click)="selectedCategoryId.set(cat.id)"
              [class]="selectedCategoryId() === cat.id
                ? 'px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider bg-white text-black border border-white whitespace-nowrap'
                : 'px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400 border border-zinc-800 hover:border-zinc-500 hover:text-white whitespace-nowrap'"
            >
              {{ cat.nombre }}
            </button>
          </div>

          <div class="flex items-center gap-4 text-xs font-mono text-zinc-500 shrink-0">
            <span>
              <strong class="text-white">{{ productosFiltrados().length }}</strong>
              {{ productosFiltrados().length === 1 ? 'RESULTADO' : 'RESULTADOS' }}
            </span>
            <button
              *ngIf="hasActiveFilters()"
              type="button"
              (click)="resetFilters()"
              class="text-zinc-300 hover:text-white underline underline-offset-4 uppercase"
            >
              Limpiar ✕
            </button>
          </div>
        </div>

        <!-- Loading Skeleton -->
        <div *ngIf="loading()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <div *ngFor="let i of [1,2,3,4,5,6,7,8]" class="bg-[#0c0c0f] border border-zinc-800 animate-pulse">
            <div class="aspect-[4/5] bg-zinc-900"></div>
            <div class="p-4 space-y-3">
              <div class="h-3 bg-zinc-800 w-1/3"></div>
              <div class="h-5 bg-zinc-800 w-3/4"></div>
              <div class="h-3 bg-zinc-900 w-full"></div>
              <div class="h-10 bg-zinc-800 w-full mt-4"></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          *ngIf="!loading() && productosFiltrados().length === 0"
          class="border border-zinc-800 bg-[#0c0c0f] p-12 text-center max-w-lg mx-auto my-8"
        >
          <p class="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Sin coincidencias</p>
          <h3 class="font-display text-3xl text-white uppercase tracking-wide">
            No encontramos esa pieza
          </h3>
          <p class="text-sm text-zinc-400 mt-2">
            Prueba otro filtro o vuelve a ver todas las categorías del catálogo.
          </p>
          <button
            type="button"
            (click)="resetFilters()"
            class="mt-6 px-6 py-3 bg-white hover:bg-zinc-200 text-black text-xs font-mono font-bold uppercase tracking-widest transition-colors"
          >
            Ver Catálogo Completo
          </button>
        </div>

        <!-- Product Grid -->
        <div
          *ngIf="!loading() && productosFiltrados().length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          <article
            *ngFor="let prod of productosFiltrados()"
            class="group bg-[#0c0c0f] border border-zinc-800/90 hover:border-white transition-colors duration-300 flex flex-col"
          >
            <!-- Studio Lookbook Image -->
            <div
              class="relative aspect-[4/5] bg-black overflow-hidden cursor-pointer border-b border-zinc-800/80"
              (click)="selectedProducto.set(prod)"
            >
              <img
                [src]="prod.imagen_url || defaultImage"
                (error)="onImageError($event)"
                [alt]="prod.nombre"
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />

              <!-- Subtle bottom vignette for legibility -->
              <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

              <!-- Top-Left Impact Stamps -->
              <div class="absolute top-3 left-3 flex flex-col items-start gap-1.5">
                <span
                  *ngIf="getDiscountPercent(prod) > 0"
                  class="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-widest bg-white text-black"
                >
                  -{{ getDiscountPercent(prod) }}% OFF
                </span>
                <span
                  *ngIf="prod.destacado"
                  class="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest bg-black/90 text-white border border-white/40"
                >
                  "TOP DROP"
                </span>
              </div>

              <!-- Top-Right SKU -->
              <span
                *ngIf="prod.codigo"
                class="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-mono bg-black/80 text-zinc-300 border border-zinc-700"
              >
                {{ prod.codigo }}
              </span>

              <!-- Hover Quick-View Bar -->
              <div class="absolute inset-x-3 bottom-3 flex items-center justify-between opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <span class="px-3 py-1.5 bg-white text-black text-[10px] font-mono font-bold uppercase tracking-widest">
                  Vista Rápida +
                </span>
              </div>
            </div>

            <!-- Card Info -->
            <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-1.5">
                  <span class="truncate">{{ prod.categoria_nombre || 'General' }}</span>
                  <span *ngIf="getSavingsAmount(prod) > 0" class="text-white shrink-0">
                    AHORRAS {{ formatPrice(getSavingsAmount(prod)) }}
                  </span>
                </div>

                <h3
                  (click)="selectedProducto.set(prod)"
                  class="text-base sm:text-lg font-bold text-white group-hover:underline decoration-zinc-400 underline-offset-4 line-clamp-2 cursor-pointer leading-snug"
                >
                  {{ prod.nombre }}
                </h3>

                <p *ngIf="prod.descripcion" class="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                  {{ prod.descripcion }}
                </p>

                <div *ngIf="getTagsList(prod.etiquetas).length > 0" class="flex flex-wrap gap-1.5 mt-3.5">
                  <span
                    *ngFor="let tag of getTagsList(prod.etiquetas)"
                    class="px-2 py-0.5 bg-black border border-zinc-800 text-zinc-400 text-[10px] font-mono"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>

              <!-- Price Anchoring & Direct Conversion CTA -->
              <div class="mt-5 pt-4 border-t border-zinc-800/90 flex items-end justify-between gap-3">
                <div>
                  <span
                    *ngIf="prod.precio_anterior && prod.precio_anterior > prod.precio"
                    class="block text-[11px] font-mono text-zinc-500 line-through"
                  >
                    {{ formatPrice(prod.precio_anterior) }}
                  </span>
                  <span class="text-xl font-mono font-bold text-white tracking-tight leading-none">
                    {{ formatPrice(prod.precio) }}
                  </span>
                </div>

                <a
                  [href]="getProductWhatsappUrl(prod)"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-zinc-200 text-black text-[11px] font-mono font-bold uppercase tracking-wider transition-colors shrink-0"
                >
                  <span>Lo quiero</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </article>
        </div>
      </main>

      <!-- Conversion Banner Before Footer -->
      <section class="border-t border-zinc-800/90 bg-black">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span class="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">
              Atención Personalizada // Respuesta Rápida
            </span>
            <h3 class="font-display text-3xl sm:text-5xl uppercase tracking-wide text-white leading-none mt-1">
              ¿Buscas algo puntual o pedido al mayor?
            </h3>
            <p class="text-sm text-zinc-400 mt-2 max-w-xl">
              Escríbenos directo por WhatsApp y te confirmamos stock, tallas, referencias y envíos al instante.
            </p>
          </div>
          <a
            [href]="getGeneralWhatsappUrl()"
            target="_blank"
            rel="noopener"
            class="px-7 py-4 bg-white hover:bg-zinc-200 text-black text-xs font-mono font-bold uppercase tracking-[0.2em] transition-colors shrink-0"
          >
            Escribir por WhatsApp ↗
          </a>
        </div>
      </section>

      <!-- Product Detail Lookbook Modal -->
      <div
        *ngIf="selectedProducto() as prod"
        class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        (click)="selectedProducto.set(null)"
      >
        <div
          class="bg-[#0c0c0f] max-w-4xl w-full overflow-hidden border border-zinc-700 grid grid-cols-1 md:grid-cols-2 my-auto"
          (click)="$event.stopPropagation()"
        >
          <div class="relative aspect-square md:aspect-auto bg-black border-b md:border-b-0 md:border-r border-zinc-800">
            <img
              [src]="prod.imagen_url || defaultImage"
              (error)="onImageError($event)"
              [alt]="prod.nombre"
              class="w-full h-full object-cover"
            />
            <div class="absolute top-4 left-4 flex flex-col items-start gap-1.5">
              <span
                *ngIf="getDiscountPercent(prod) > 0"
                class="px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest bg-white text-black"
              >
                -{{ getDiscountPercent(prod) }}% OFF
              </span>
              <span
                *ngIf="prod.destacado"
                class="px-3 py-1 text-[10px] font-mono uppercase tracking-widest bg-black/85 text-white border border-white/40"
              >
                "TOP DROP"
              </span>
            </div>
          </div>

          <div class="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                  {{ prod.categoria_nombre || 'Catálogo' }}
                </span>
                <button
                  type="button"
                  (click)="selectedProducto.set(null)"
                  class="w-8 h-8 border border-zinc-700 hover:border-white flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
                  aria-label="Cerrar detalle"
                >
                  ✕
                </button>
              </div>

              <h3 class="font-display text-3xl sm:text-4xl tracking-wide text-white uppercase mt-3 leading-none">
                {{ prod.nombre }}
              </h3>

              <p *ngIf="prod.codigo" class="text-[11px] font-mono text-zinc-500 mt-2">
                REF // {{ prod.codigo }}
              </p>

              <div class="mt-5 p-4 bg-black border border-zinc-800 flex items-baseline justify-between gap-3">
                <div class="flex items-baseline gap-3">
                  <span class="text-2xl sm:text-3xl font-mono font-bold text-white">
                    {{ formatPrice(prod.precio) }}
                  </span>
                  <span
                    *ngIf="prod.precio_anterior && prod.precio_anterior > prod.precio"
                    class="text-sm font-mono text-zinc-500 line-through"
                  >
                    {{ formatPrice(prod.precio_anterior) }}
                  </span>
                </div>
                <span
                  *ngIf="getSavingsAmount(prod) > 0"
                  class="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-white text-black"
                >
                  -{{ formatPrice(getSavingsAmount(prod)) }}
                </span>
              </div>

              <p class="text-sm text-zinc-300 mt-5 leading-relaxed">
                {{ prod.descripcion || 'Producto disponible en nuestro catálogo oficial.' }}
              </p>

              <div *ngIf="getTagsList(prod.etiquetas).length > 0" class="flex flex-wrap gap-1.5 mt-5">
                <span
                  *ngFor="let tag of getTagsList(prod.etiquetas)"
                  class="px-2.5 py-1 bg-black border border-zinc-800 text-zinc-300 text-[11px] font-mono"
                >
                  {{ tag }}
                </span>
              </div>

              <div class="mt-6 pt-4 border-t border-zinc-800/80 space-y-1.5 text-[11px] font-mono text-zinc-400">
                <p>✓ DISPONIBLE PARA PEDIDO INMEDIATO</p>
                <p>✓ CONFIRMACIÓN Y ENVÍO DIRECTO POR WHATSAPP</p>
              </div>
            </div>

            <div class="mt-6 pt-5 border-t border-zinc-800 flex flex-col gap-2.5">
              <a
                [href]="getProductWhatsappUrl(prod)"
                target="_blank"
                rel="noopener"
                class="w-full py-3.5 px-4 bg-white hover:bg-zinc-200 text-black font-mono font-bold text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-colors"
              >
                <span>Separar por WhatsApp</span>
                <span aria-hidden="true">→</span>
              </a>
              <button
                type="button"
                (click)="selectedProducto.set(null)"
                class="w-full py-2.5 border border-zinc-800 hover:border-zinc-500 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
              >
                Seguir viendo el catálogo
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="border-t border-zinc-800/90 bg-[#050507] py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-zinc-500">
          <p class="uppercase tracking-[0.2em]">© 2026 {{ storeName }} // CATÁLOGO OFICIAL</p>
          <a
            [routerLink]="authService.isAuthenticated() ? '/admin' : '/admin/login'"
            class="uppercase tracking-[0.18em] text-zinc-400 hover:text-white transition-colors"
          >
            {{ authService.isAuthenticated() ? 'Panel Administrador →' : 'Acceso Admin →' }}
          </a>
        </div>
      </footer>
    </div>
  `,
})
export class CatalogoComponent implements OnInit {
  readonly catalogService = inject(CatalogService);
  readonly authService = inject(AuthService);

  readonly storeName = environment.storeName || 'Vitrina & Catálogo';
  readonly defaultImage =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

  categorias = signal<Categoria[]>([]);
  productos = signal<Producto[]>([]);
  loading = signal<boolean>(true);

  searchTerm = signal<string>('');
  selectedCategoryId = signal<number | null>(null);
  onlyFeatured = signal<boolean>(false);
  onlyDeals = signal<boolean>(false);
  sortBy = signal<'featured' | 'price-asc' | 'price-desc' | 'name-asc'>('featured');

  selectedProducto = signal<Producto | null>(null);
  spotlightIndex = signal<number>(0);

  readonly categoriasActivas = computed(() =>
    this.categorias().filter((c) => c.activo !== false)
  );

  readonly productosDisponibles = computed(() =>
    this.productos().filter((p) => p.disponible !== false)
  );

  readonly productosDisponiblesCount = computed(
    () => this.productosDisponibles().length
  );

  readonly ofertasCount = computed(
    () =>
      this.productosDisponibles().filter(
        (p) => p.precio_anterior && Number(p.precio_anterior) > Number(p.precio)
      ).length
  );

  readonly featuredList = computed(() => {
    const disponibles = this.productosDisponibles();
    const destacados = disponibles.filter((p) => !!p.destacado);
    return destacados.length > 0 ? destacados : disponibles.slice(0, 4);
  });

  readonly spotlightProducto = computed(() => {
    const list = this.featuredList();
    if (list.length === 0) return null;
    const idx = this.spotlightIndex() % list.length;
    return list[idx < 0 ? idx + list.length : idx];
  });

  readonly selectedCategory = computed(() => {
    const id = this.selectedCategoryId();
    if (!id) return null;
    return this.categorias().find((c) => c.id === id) || null;
  });

  readonly selectedCategoryName = computed(
    () => this.selectedCategory()?.nombre || null
  );

  readonly selectedCategoryDescription = computed(
    () => this.selectedCategory()?.descripcion || null
  );

  readonly productosFiltrados = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const catId = this.selectedCategoryId();
    const featured = this.onlyFeatured();
    const deals = this.onlyDeals();
    const sort = this.sortBy();

    let list = this.productosDisponibles();

    if (catId !== null) {
      list = list.filter((p) => Number(p.categoria_id) === Number(catId));
    }

    if (featured) {
      list = list.filter((p) => !!p.destacado);
    }

    if (deals) {
      list = list.filter(
        (p) => p.precio_anterior && Number(p.precio_anterior) > Number(p.precio)
      );
    }

    if (term) {
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(term) ||
          (p.descripcion || '').toLowerCase().includes(term) ||
          (p.codigo || '').toLowerCase().includes(term) ||
          (p.etiquetas || '').toLowerCase().includes(term) ||
          (p.categoria_nombre || '').toLowerCase().includes(term)
      );
    }

    return [...list].sort((a, b) => {
      if (sort === 'price-asc') return Number(a.precio) - Number(b.precio);
      if (sort === 'price-desc') return Number(b.precio) - Number(a.precio);
      if (sort === 'name-asc') return a.nombre.localeCompare(b.nombre);
      if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
      return b.id - a.id;
    });
  });

  ngOnInit(): void {
    this.cargarCatalogo();
  }

  cargarCatalogo(): void {
    this.loading.set(true);
    this.catalogService.getCategorias().subscribe((cats) => {
      this.categorias.set(cats);
    });

    this.catalogService.getProductos().subscribe({
      next: (prods) => {
        this.productos.set(prods);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  nextSpotlight(): void {
    const len = this.featuredList().length;
    if (len <= 1) return;
    this.spotlightIndex.set((this.spotlightIndex() + 1) % len);
  }

  prevSpotlight(): void {
    const len = this.featuredList().length;
    if (len <= 1) return;
    this.spotlightIndex.set((this.spotlightIndex() - 1 + len) % len);
  }

  selectCategoryAndScroll(catId: number | null): void {
    this.selectedCategoryId.set(catId);
    const el = document.getElementById('catalogo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getCategoryCoverImage(catId: number): string {
    const match = this.productosDisponibles().find(
      (p) => Number(p.categoria_id) === Number(catId) && !!p.imagen_url
    );
    return match?.imagen_url || this.defaultImage;
  }

  getCategoryProductCount(catId: number): number {
    return this.productosDisponibles().filter(
      (p) => Number(p.categoria_id) === Number(catId)
    ).length;
  }

  padZero(num: number): string {
    return String(num).padStart(2, '0');
  }

  getStoreInitials(): string {
    const words = this.storeName
      .replace(/&/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return this.storeName.slice(0, 2).toUpperCase();
  }

  hasActiveFilters(): boolean {
    return (
      !!this.searchTerm() ||
      this.selectedCategoryId() !== null ||
      this.onlyFeatured() ||
      this.onlyDeals()
    );
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.selectedCategoryId.set(null);
    this.onlyFeatured.set(false);
    this.onlyDeals.set(false);
    this.sortBy.set('featured');
  }

  getDiscountPercent(prod: Producto): number {
    const prev = Number(prod.precio_anterior || 0);
    const curr = Number(prod.precio || 0);
    if (!prev || prev <= curr) return 0;
    return Math.round(((prev - curr) / prev) * 100);
  }

  getSavingsAmount(prod: Producto): number {
    const prev = Number(prod.precio_anterior || 0);
    const curr = Number(prod.precio || 0);
    if (!prev || prev <= curr) return 0;
    return prev - curr;
  }

  getTagsList(etiquetas?: string): string[] {
    if (!etiquetas) return [];
    return etiquetas
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  formatPrice(value: number | string | null | undefined): string {
    const num = Number(value || 0);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);
  }

  onImageError(event: Event): void {
    const imgEl = event.target as HTMLImageElement;
    if (imgEl && imgEl.src !== this.defaultImage) {
      imgEl.src = this.defaultImage;
    }
  }

  getProductWhatsappUrl(prod: Producto): string {
    const phone = environment.whatsappNumber || '573000000000';
    const ref = prod.codigo ? ` (Ref: ${prod.codigo})` : '';
    const text = `Hola, vi el catálogo y me interesa el producto: *${prod.nombre}*${ref} con precio *${this.formatPrice(prod.precio)}*. ¿Está disponible?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  getGeneralWhatsappUrl(): string {
    const phone = environment.whatsappNumber || '573000000000';
    const text = `Hola, estoy viendo su catálogo digital de productos y me gustaría recibir asesoría.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }
}
