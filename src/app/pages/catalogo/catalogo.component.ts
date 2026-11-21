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
    <div class="min-h-screen flex flex-col bg-[#050507] text-zinc-100 overflow-x-clip">
      <!-- Top Streetwear Marquee Ticker -->
      <div class="bg-white text-black overflow-hidden border-b border-zinc-800 py-1 sm:py-1.5 select-none">
        <div class="flex whitespace-nowrap animate-marquee font-mono text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.2em]">
          <span class="mx-4 sm:mx-6">CATÁLOGO OFICIAL 2026</span>
          <span class="mx-1.5">//</span>
          <span class="mx-4 sm:mx-6">STOCK ACTUALIZADO</span>
          <span class="mx-1.5">//</span>
          <span class="mx-4 sm:mx-6">PEDIDOS DIRECTOS POR WHATSAPP</span>
          <span class="mx-1.5">//</span>
          <span class="mx-4 sm:mx-6">SELECCIÓN POR CATEGORÍA</span>
          <span class="mx-1.5">//</span>
          <span class="mx-4 sm:mx-6">CATÁLOGO OFICIAL 2026</span>
          <span class="mx-1.5">//</span>
          <span class="mx-4 sm:mx-6">STOCK ACTUALIZADO</span>
          <span class="mx-1.5">//</span>
          <span class="mx-4 sm:mx-6">PEDIDOS DIRECTOS POR WHATSAPP</span>
          <span class="mx-1.5">//</span>
          <span class="mx-4 sm:mx-6">SELECCIÓN POR CATEGORÍA</span>
          <span class="mx-1.5">//</span>
        </div>
      </div>

      <!-- Compact Mobile-First Sticky Header -->
      <header class="sticky top-0 z-30 bg-[#050507]/95 backdrop-blur-md border-b border-zinc-800/90">
        <div class="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-20 flex items-center justify-between gap-2.5 sm:gap-4">
          <!-- Brand Mark -->
          <button
            type="button"
            (click)="resetFilters()"
            class="flex items-center gap-2.5 sm:gap-3 text-left min-w-0"
          >
            <div class="w-8 h-8 sm:w-10 sm:h-10 bg-white text-black flex items-center justify-center font-display text-xl sm:text-2xl tracking-wider leading-none pt-0.5 shrink-0">
              {{ getStoreInitials() }}
            </div>
            <div class="min-w-0">
              <h1 class="font-display text-xl sm:text-3xl tracking-[0.08em] text-white leading-none uppercase truncate">
                {{ storeName }}
              </h1>
              <p class="hidden sm:block text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500 mt-0.5">
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

          <!-- Header Actions -->
          <div class="flex items-center gap-2 sm:gap-5 shrink-0">
            <!-- Mobile Search Toggle Button -->
            <button
              type="button"
              (click)="mobileSearchOpen.set(!mobileSearchOpen())"
              [class]="mobileSearchOpen() || searchTerm()
                ? 'md:hidden w-9 h-9 border border-white bg-white text-black flex items-center justify-center transition-colors'
                : 'md:hidden w-9 h-9 border border-zinc-800 text-zinc-300 hover:border-white hover:text-white flex items-center justify-center transition-colors'"
              aria-label="Buscar en catálogo"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

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
              class="inline-flex items-center justify-center gap-1.5 h-9 sm:h-auto px-3 sm:px-4 sm:py-2.5 bg-white hover:bg-zinc-200 text-black text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider sm:tracking-widest transition-colors"
            >
              <svg class="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z"/>
              </svg>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        <!-- Collapsible Mobile Search Drawer -->
        <div *ngIf="mobileSearchOpen() || searchTerm()" class="md:hidden px-3.5 pb-3 pt-0.5 border-t border-zinc-900 bg-[#050507]">
          <div class="relative">
            <input
              type="text"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              placeholder="Buscar producto, categoría o código..."
              class="w-full pl-9 pr-9 py-2.5 bg-[#0c0c0f] border border-zinc-700 focus:border-white text-sm text-white placeholder-zinc-500 outline-none"
            />
            <svg class="w-4 h-4 text-zinc-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button
              type="button"
              (click)="searchTerm.set(''); mobileSearchOpen.set(false)"
              class="absolute right-2.5 top-2 w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white text-xs"
              aria-label="Cerrar búsqueda"
            >
              ✕
            </button>
          </div>
        </div>
      </header>

      <!-- HERO: Mobile-Optimized Drop Intro + Showcase -->
      <section class="relative border-b border-zinc-800/90 bg-grid-subtle overflow-hidden">
        <div class="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-12 lg:py-16">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            <!-- Left Copy -->
            <div class="lg:col-span-7">
              <div class="inline-flex items-center gap-2 px-2.5 py-1 border border-zinc-700 bg-black/80 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-300 mb-3.5 sm:mb-5">
                <span class="w-1.5 h-1.5 bg-white shrink-0"></span>
                <span>{{ productosDisponiblesCount() }} Piezas en Stock</span>
                <span *ngIf="catalogService.isOfflineDemo()" class="text-zinc-500">· DEMO</span>
              </div>

              <h2 class="font-display text-[2.65rem] sm:text-7xl lg:text-[5.25rem] uppercase tracking-wide text-white leading-[0.92]">
                NO ES UN CATÁLOGO MÁS.<br />
                <span class="text-zinc-500">ES TU PRÓXIMO DROP.</span>
              </h2>

              <p class="mt-3 sm:mt-5 text-[13px] sm:text-base text-zinc-400 max-w-xl leading-relaxed">
                Piezas escogidas por categoría, precios claros y pedido directo por WhatsApp sin vueltas.
              </p>

              <!-- Side-by-side thumb-friendly CTAs on mobile -->
              <div class="mt-5 sm:mt-7 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3">
                <a
                  href="#categorias"
                  class="px-3 sm:px-6 py-3 sm:py-3.5 bg-white hover:bg-zinc-200 text-black text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[0.12em] sm:tracking-[0.18em] transition-colors inline-flex items-center justify-center gap-1.5 text-center"
                >
                  <span>Categorías</span>
                  <span aria-hidden="true">↓</span>
                </a>
                <a
                  [href]="getGeneralWhatsappUrl()"
                  target="_blank"
                  rel="noopener"
                  class="px-3 sm:px-6 py-3 sm:py-3.5 border border-zinc-700 hover:border-white bg-black/70 text-white text-[11px] sm:text-xs font-mono uppercase tracking-[0.12em] sm:tracking-[0.18em] transition-colors inline-flex items-center justify-center gap-1.5 text-center"
                >
                  <span>WhatsApp</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>

            <!-- Right: Showcase Card -->
            <div class="lg:col-span-5" *ngIf="spotlightProducto() as spot">
              <div class="bg-[#0c0c0f] border border-zinc-800 group">
                <!-- Showcase Top Bar -->
                <div class="px-3.5 py-2 border-b border-zinc-800 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em]">
                  <span class="text-white font-bold">
                    EN VITRINA // {{ padZero(spotlightIndex() + 1) }}/{{ padZero(spotlightList().length) }}
                  </span>
                  <div class="flex items-center gap-1.5" *ngIf="spotlightList().length > 1">
                    <button
                      type="button"
                      (click)="prevSpotlight()"
                      class="w-8 h-8 sm:w-7 sm:h-7 border border-zinc-800 hover:border-white active:bg-white active:text-black text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
                      aria-label="Producto anterior"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      (click)="nextSpotlight()"
                      class="w-8 h-8 sm:w-7 sm:h-7 border border-zinc-800 hover:border-white active:bg-white active:text-black text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
                      aria-label="Siguiente producto"
                    >
                      →
                    </button>
                  </div>
                </div>

                <!-- Showcase Visual -->
                <div
                  class="relative aspect-[16/10] sm:aspect-[16/11] lg:aspect-[4/3] bg-black overflow-hidden cursor-pointer"
                  (click)="selectedProducto.set(spot)"
                >
                  <img
                    [src]="spot.imagen_url || defaultImage"
                    (error)="onImageError($event)"
                    [alt]="spot.nombre"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"></div>

                  <span
                    *ngIf="spot.codigo"
                    class="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/80 border border-zinc-700 text-zinc-300 font-mono text-[10px]"
                  >
                    {{ spot.codigo }}
                  </span>

                  <div class="absolute inset-x-0 bottom-0 p-3.5 sm:p-5">
                    <span class="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">
                      {{ spot.categoria_nombre || 'Colección' }}
                    </span>
                    <h3 class="font-display text-2xl sm:text-3xl tracking-wide text-white uppercase leading-tight mt-0.5 line-clamp-1">
                      {{ spot.nombre }}
                    </h3>
                  </div>
                </div>

                <!-- Showcase Footer Action -->
                <div class="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 bg-[#0c0c0f]">
                  <span class="text-lg sm:text-xl font-mono font-bold text-white">
                    {{ formatPrice(spot.precio) }}
                  </span>

                  <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      type="button"
                      (click)="selectedProducto.set(spot)"
                      class="px-3 py-2 border border-zinc-700 hover:border-white text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-zinc-200 transition-colors"
                    >
                      Ver
                    </button>
                    <a
                      [href]="getProductWhatsappUrl(spot)"
                      target="_blank"
                      rel="noopener"
                      class="px-3.5 py-2 bg-white hover:bg-zinc-200 text-black text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider transition-colors"
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

      <!-- VISUAL CATEGORY CATALOGS: Horizontal Swipe Carousel on Mobile, Grid on Desktop -->
      <section id="categorias" class="border-b border-zinc-800/90 bg-[#08080a] scroll-mt-14 sm:scroll-mt-20">
        <div class="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-7 sm:py-12">
          <div class="flex items-end justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <span class="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                01 // Desliza o elige tu línea
              </span>
              <h2 class="font-display text-3xl sm:text-5xl uppercase tracking-wide text-white leading-none mt-1">
                Categorías
              </h2>
            </div>

            <button
              type="button"
              (click)="selectCategoryAndScroll(null)"
              [class]="selectedCategoryId() === null
                ? 'px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-black text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider border border-white transition-colors shrink-0'
                : 'px-3 py-1.5 sm:px-4 sm:py-2 bg-transparent text-zinc-300 hover:text-white text-[10px] sm:text-[11px] font-mono uppercase tracking-wider border border-zinc-700 hover:border-white transition-colors shrink-0'"
            >
              Todos [{{ productosDisponiblesCount() }}]
            </button>
          </div>

          <!-- Mobile: Smooth Horizontal Snap Carousel | sm+: Grid -->
          <div class="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory -mx-3.5 px-3.5 sm:mx-0 sm:px-0 pb-1 sm:pb-0 no-scrollbar">
            <button
              *ngFor="let cat of categoriasActivas(); let idx = index"
              type="button"
              (click)="selectCategoryAndScroll(cat.id)"
              [class]="selectedCategoryId() === cat.id
                ? 'w-[72vw] max-w-[260px] sm:w-auto sm:max-w-none shrink-0 snap-start group relative text-left overflow-hidden border-2 border-white bg-black transition-all'
                : 'w-[72vw] max-w-[260px] sm:w-auto sm:max-w-none shrink-0 snap-start group relative text-left overflow-hidden border border-zinc-800 hover:border-zinc-400 bg-black transition-all'"
            >
              <div class="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden bg-zinc-950">
                <img
                  [src]="getCategoryCoverImage(cat.id)"
                  (error)="onImageError($event)"
                  [alt]="cat.nombre"
                  loading="lazy"
                  class="w-full h-full object-cover sm:grayscale sm:group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 opacity-70 sm:opacity-55 sm:group-hover:opacity-75"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15"></div>

                <!-- Top Row -->
                <div class="absolute top-2.5 inset-x-2.5 sm:top-3 sm:inset-x-3 flex items-center justify-between font-mono text-[9px] sm:text-[10px] uppercase tracking-widest">
                  <span class="px-1.5 sm:px-2 py-0.5 bg-black/85 border border-zinc-700 text-zinc-300">
                    CAT {{ padZero(idx + 1) }}
                  </span>
                  <span
                    [class]="selectedCategoryId() === cat.id
                      ? 'px-1.5 sm:px-2 py-0.5 bg-white text-black font-bold'
                      : 'px-1.5 sm:px-2 py-0.5 bg-black/85 text-white border border-zinc-700'"
                  >
                    {{ getCategoryProductCount(cat.id) }} PIEZAS
                  </span>
                </div>

                <!-- Bottom Row -->
                <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                  <h3 class="font-display text-2xl sm:text-3xl tracking-wide text-white uppercase leading-none">
                    {{ cat.nombre }}
                  </h3>
                  <p *ngIf="cat.descripcion" class="hidden sm:block text-[11px] text-zinc-400 mt-1.5 line-clamp-1">
                    {{ cat.descripcion }}
                  </p>
                  <div class="mt-2 sm:mt-3 flex items-center justify-between text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.16em]">
                    <span [class]="selectedCategoryId() === cat.id ? 'text-white font-bold' : 'text-zinc-300 sm:text-zinc-400 sm:group-hover:text-white'">
                      {{ selectedCategoryId() === cat.id ? '● ACTIVA' : 'VER CATÁLOGO' }}
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
      <main id="catalogo" class="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-7 sm:py-10 scroll-mt-14 sm:scroll-mt-20">
        <!-- Active Category Heading + Sort -->
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 sm:pb-6 border-b border-zinc-800/90">
          <div>
            <span class="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
              02 // Vitrinas &amp; Piezas Disponibles
            </span>
            <h2 class="font-display text-3xl sm:text-5xl uppercase tracking-wide text-white leading-none mt-1">
              {{ selectedCategoryName() ? selectedCategoryName() : 'Catálogo Completo' }}
            </h2>
            <p *ngIf="selectedCategoryDescription()" class="text-xs sm:text-sm text-zinc-400 mt-1.5">
              {{ selectedCategoryDescription() }}
            </p>
          </div>

          <select
            [ngModel]="sortBy()"
            (ngModelChange)="sortBy.set($event)"
            class="w-full sm:w-auto px-3.5 py-2.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider bg-[#0c0c0f] text-zinc-200 border border-zinc-800 focus:border-white outline-none cursor-pointer shrink-0"
          >
            <option value="recent">Orden: Más recientes</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
            <option value="name-asc">Nombre: A - Z</option>
          </select>
        </div>

        <!-- Quick Category Chips + Counter + Mobile Grid Toggle -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 sm:py-4 mb-4 sm:mb-6">
          <div class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto -mx-3.5 px-3.5 sm:mx-0 sm:px-0 pb-1 sm:pb-0 no-scrollbar">
            <button
              type="button"
              (click)="selectedCategoryId.set(null)"
              [class]="selectedCategoryId() === null
                ? 'px-3 py-1.5 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider bg-white text-black border border-white whitespace-nowrap shrink-0'
                : 'px-3 py-1.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-zinc-400 border border-zinc-800 hover:border-zinc-500 hover:text-white whitespace-nowrap shrink-0'"
            >
              Todos
            </button>
            <button
              *ngFor="let cat of categoriasActivas()"
              type="button"
              (click)="selectedCategoryId.set(cat.id)"
              [class]="selectedCategoryId() === cat.id
                ? 'px-3 py-1.5 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider bg-white text-black border border-white whitespace-nowrap shrink-0'
                : 'px-3 py-1.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-zinc-400 border border-zinc-800 hover:border-zinc-500 hover:text-white whitespace-nowrap shrink-0'"
            >
              {{ cat.nombre }}
            </button>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-3 text-[11px] font-mono text-zinc-500 shrink-0">
            <div class="flex items-center gap-3">
              <span>
                <strong class="text-white">{{ productosFiltrados().length }}</strong>
                {{ productosFiltrados().length === 1 ? 'PIEZA' : 'PIEZAS' }}
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

            <!-- Mobile 2-col vs 1-col switcher -->
            <div class="flex sm:hidden items-center border border-zinc-800 bg-[#0c0c0f]">
              <button
                type="button"
                (click)="mobileCols.set(2)"
                [class]="mobileCols() === 2
                  ? 'w-8 h-7 flex items-center justify-center bg-white text-black'
                  : 'w-8 h-7 flex items-center justify-center text-zinc-400'"
                aria-label="Vista en 2 columnas"
              >
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                  <rect x="1" y="1" width="6" height="6" />
                  <rect x="9" y="1" width="6" height="6" />
                  <rect x="1" y="9" width="6" height="6" />
                  <rect x="9" y="9" width="6" height="6" />
                </svg>
              </button>
              <button
                type="button"
                (click)="mobileCols.set(1)"
                [class]="mobileCols() === 1
                  ? 'w-8 h-7 flex items-center justify-center bg-white text-black'
                  : 'w-8 h-7 flex items-center justify-center text-zinc-400'"
                aria-label="Vista en 1 columna"
              >
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                  <rect x="1" y="2" width="14" height="5" />
                  <rect x="1" y="9" width="14" height="5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Loading Skeleton -->
        <div
          *ngIf="loading()"
          [class]="mobileCols() === 2
            ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5'"
        >
          <div *ngFor="let i of [1,2,3,4,5,6,7,8]" class="bg-[#0c0c0f] border border-zinc-800 animate-pulse">
            <div class="aspect-[4/5] bg-zinc-900"></div>
            <div class="p-3 sm:p-4 space-y-2.5">
              <div class="h-2.5 bg-zinc-800 w-1/3"></div>
              <div class="h-4 bg-zinc-800 w-3/4"></div>
              <div class="h-8 bg-zinc-800 w-full mt-3"></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          *ngIf="!loading() && productosFiltrados().length === 0"
          class="border border-zinc-800 bg-[#0c0c0f] p-8 sm:p-12 text-center max-w-lg mx-auto my-6"
        >
          <p class="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Sin coincidencias</p>
          <h3 class="font-display text-3xl text-white uppercase tracking-wide">
            No encontramos esa pieza
          </h3>
          <p class="text-xs sm:text-sm text-zinc-400 mt-2">
            Prueba otro filtro o vuelve a ver todas las categorías del catálogo.
          </p>
          <button
            type="button"
            (click)="resetFilters()"
            class="mt-5 px-5 py-3 bg-white hover:bg-zinc-200 text-black text-xs font-mono font-bold uppercase tracking-widest transition-colors"
          >
            Ver Catálogo Completo
          </button>
        </div>

        <!-- Product Grid: Mobile-First 2-Col (or 1-Col toggle) -->
        <div
          *ngIf="!loading() && productosFiltrados().length > 0"
          [class]="mobileCols() === 2
            ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5'"
        >
          <article
            *ngFor="let prod of productosFiltrados()"
            class="group bg-[#0c0c0f] border border-zinc-800/90 hover:border-white transition-colors duration-300 flex flex-col min-w-0"
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

              <div class="absolute inset-x-0 bottom-0 h-16 sm:h-24 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none"></div>

              <!-- Top-Right SKU -->
              <span
                *ngIf="prod.codigo"
                [class]="mobileCols() === 2
                  ? 'hidden sm:inline-block absolute top-3 right-3 px-2 py-0.5 text-[10px] font-mono bg-black/80 text-zinc-300 border border-zinc-700'
                  : 'absolute top-2.5 right-2.5 sm:top-3 sm:right-3 px-2 py-0.5 text-[10px] font-mono bg-black/80 text-zinc-300 border border-zinc-700'"
              >
                {{ prod.codigo }}
              </span>

              <!-- Desktop Hover Quick-View Bar -->
              <div class="hidden sm:flex absolute inset-x-3 bottom-3 items-center justify-between opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <span class="px-3 py-1.5 bg-white text-black text-[10px] font-mono font-bold uppercase tracking-widest">
                  Vista Rápida +
                </span>
              </div>
            </div>

            <!-- Card Body -->
            <div
              [class]="mobileCols() === 2
                ? 'p-2.5 sm:p-5 flex-1 flex flex-col justify-between'
                : 'p-4 sm:p-5 flex-1 flex flex-col justify-between'"
            >
              <div>
                <div class="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.14em] sm:tracking-[0.2em] text-zinc-500 mb-1 truncate">
                  {{ prod.categoria_nombre || 'General' }}
                </div>

                <h3
                  (click)="selectedProducto.set(prod)"
                  [class]="mobileCols() === 2
                    ? 'text-[13px] sm:text-lg font-bold text-white group-hover:underline decoration-zinc-400 underline-offset-4 line-clamp-2 cursor-pointer leading-snug'
                    : 'text-base sm:text-lg font-bold text-white group-hover:underline decoration-zinc-400 underline-offset-4 line-clamp-2 cursor-pointer leading-snug'"
                >
                  {{ prod.nombre }}
                </h3>

                <p
                  *ngIf="prod.descripcion"
                  [class]="mobileCols() === 2
                    ? 'hidden sm:block text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed'
                    : 'text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed'"
                >
                  {{ prod.descripcion }}
                </p>

                <div
                  *ngIf="getTagsList(prod.etiquetas).length > 0"
                  [class]="mobileCols() === 2
                    ? 'hidden sm:flex flex-wrap gap-1.5 mt-3.5'
                    : 'flex flex-wrap gap-1.5 mt-3'"
                >
                  <span
                    *ngFor="let tag of getTagsList(prod.etiquetas)"
                    class="px-2 py-0.5 bg-black border border-zinc-800 text-zinc-400 text-[10px] font-mono"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>

              <!-- Single Price & Direct Action -->
              <div
                [class]="mobileCols() === 2
                  ? 'mt-3 sm:mt-5 pt-2.5 sm:pt-4 border-t border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3'
                  : 'mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-zinc-800/90 flex items-center justify-between gap-3'"
              >
                <span
                  [class]="mobileCols() === 2
                    ? 'block text-sm sm:text-xl font-mono font-bold text-white tracking-tight leading-tight'
                    : 'block text-xl font-mono font-bold text-white tracking-tight leading-none'"
                >
                  {{ formatPrice(prod.precio) }}
                </span>

                <a
                  [href]="getProductWhatsappUrl(prod)"
                  target="_blank"
                  rel="noopener"
                  [class]="mobileCols() === 2
                    ? 'w-full sm:w-auto inline-flex items-center justify-center gap-1 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider transition-colors'
                    : 'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black text-[11px] font-mono font-bold uppercase tracking-wider transition-colors shrink-0'"
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
        <div class="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-9 sm:py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <span class="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
              Atención Directa // Respuesta Rápida
            </span>
            <h3 class="font-display text-3xl sm:text-5xl uppercase tracking-wide text-white leading-none mt-1">
              ¿Buscas algo puntual o al mayor?
            </h3>
            <p class="text-xs sm:text-sm text-zinc-400 mt-2 max-w-xl">
              Escríbenos por WhatsApp y te confirmamos disponibilidad, referencias y envíos al instante.
            </p>
          </div>
          <a
            [href]="getGeneralWhatsappUrl()"
            target="_blank"
            rel="noopener"
            class="w-full sm:w-auto text-center px-6 sm:px-7 py-3.5 sm:py-4 bg-white hover:bg-zinc-200 text-black text-xs font-mono font-bold uppercase tracking-[0.18em] transition-colors shrink-0"
          >
            Escribir por WhatsApp ↗
          </a>
        </div>
      </section>

      <!-- Mobile-First Bottom Sheet / Desktop Lookbook Modal -->
      <div
        *ngIf="selectedProducto() as prod"
        class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
        (click)="selectedProducto.set(null)"
      >
        <div
          class="bg-[#0c0c0f] w-full sm:max-w-4xl max-h-[92dvh] flex flex-col md:grid md:grid-cols-2 border-t sm:border border-zinc-700 overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <!-- Scrollable Content Area on Mobile -->
          <div class="overflow-y-auto md:overflow-visible flex-1 md:contents">
            <!-- Product Image -->
            <div class="relative aspect-[4/3] sm:aspect-square md:aspect-auto bg-black border-b md:border-b-0 md:border-r border-zinc-800 shrink-0">
              <img
                [src]="prod.imagen_url || defaultImage"
                (error)="onImageError($event)"
                [alt]="prod.nombre"
                class="w-full h-full object-cover"
              />

              <!-- Floating Mobile Close Button over Image -->
              <button
                type="button"
                (click)="selectedProducto.set(null)"
                class="md:hidden absolute top-3 right-3 w-9 h-9 bg-black/85 border border-zinc-600 text-white flex items-center justify-center text-sm"
                aria-label="Cerrar detalle"
              >
                ✕
              </button>
            </div>

            <!-- Product Info -->
            <div class="p-4 sm:p-8 flex flex-col justify-between md:overflow-y-auto">
              <div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500">
                    {{ prod.categoria_nombre || 'Catálogo' }}
                  </span>
                  <button
                    type="button"
                    (click)="selectedProducto.set(null)"
                    class="hidden md:flex w-8 h-8 border border-zinc-700 hover:border-white items-center justify-center text-zinc-300 hover:text-white transition-colors"
                    aria-label="Cerrar detalle"
                  >
                    ✕
                  </button>
                </div>

                <h3 class="font-display text-3xl sm:text-4xl tracking-wide text-white uppercase mt-2 sm:mt-3 leading-none">
                  {{ prod.nombre }}
                </h3>

                <p *ngIf="prod.codigo" class="text-[10px] sm:text-[11px] font-mono text-zinc-500 mt-1.5">
                  REF // {{ prod.codigo }}
                </p>

                <div class="mt-4 p-3.5 sm:p-4 bg-black border border-zinc-800">
                  <span class="text-2xl sm:text-3xl font-mono font-bold text-white">
                    {{ formatPrice(prod.precio) }}
                  </span>
                </div>

                <p class="text-xs sm:text-sm text-zinc-300 mt-4 leading-relaxed">
                  {{ prod.descripcion || 'Producto disponible en nuestro catálogo oficial.' }}
                </p>

                <div *ngIf="getTagsList(prod.etiquetas).length > 0" class="flex flex-wrap gap-1.5 mt-4">
                  <span
                    *ngFor="let tag of getTagsList(prod.etiquetas)"
                    class="px-2 py-1 bg-black border border-zinc-800 text-zinc-300 text-[10px] sm:text-[11px] font-mono"
                  >
                    {{ tag }}
                  </span>
                </div>

                <div class="mt-5 pt-4 border-t border-zinc-800/80 space-y-1 text-[10px] sm:text-[11px] font-mono text-zinc-400">
                  <p>✓ DISPONIBLE PARA PEDIDO INMEDIATO</p>
                  <p>✓ CONFIRMACIÓN Y ENVÍO DIRECTO POR WHATSAPP</p>
                </div>
              </div>

              <!-- Desktop Modal Actions -->
              <div class="hidden md:flex mt-6 pt-5 border-t border-zinc-800 flex-col gap-2.5">
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

          <!-- Sticky Bottom Thumb CTA on Mobile -->
          <div class="md:hidden border-t border-zinc-800 bg-[#050507] p-3 pb-safe flex items-center gap-2 shrink-0">
            <button
              type="button"
              (click)="selectedProducto.set(null)"
              class="px-3.5 py-3 border border-zinc-700 text-[11px] font-mono uppercase text-zinc-300 shrink-0"
            >
              Cerrar
            </button>
            <a
              [href]="getProductWhatsappUrl(prod)"
              target="_blank"
              rel="noopener"
              class="flex-1 py-3 px-4 bg-white active:bg-zinc-200 text-black font-mono font-bold text-[11px] uppercase tracking-[0.14em] flex items-center justify-center gap-1.5"
            >
              <span>Separar por WhatsApp</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="border-t border-zinc-800/90 bg-[#050507] py-7">
        <div class="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] sm:text-[11px] font-mono text-zinc-500 text-center sm:text-left">
          <p class="uppercase tracking-[0.18em]">© 2026 {{ storeName }} // CATÁLOGO OFICIAL</p>
          <a
            [routerLink]="authService.isAuthenticated() ? '/admin' : '/admin/login'"
            class="uppercase tracking-[0.18em] text-zinc-400 hover:text-white transition-colors py-1"
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
  sortBy = signal<'recent' | 'price-asc' | 'price-desc' | 'name-asc'>('recent');

  mobileSearchOpen = signal<boolean>(false);
  mobileCols = signal<1 | 2>(2);

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

  readonly spotlightList = computed(() => this.productosDisponibles().slice(0, 6));

  readonly spotlightProducto = computed(() => {
    const list = this.spotlightList();
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
    const sort = this.sortBy();

    let list = this.productosDisponibles();

    if (catId !== null) {
      list = list.filter((p) => Number(p.categoria_id) === Number(catId));
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
    const len = this.spotlightList().length;
    if (len <= 1) return;
    this.spotlightIndex.set((this.spotlightIndex() + 1) % len);
  }

  prevSpotlight(): void {
    const len = this.spotlightList().length;
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
    return !!this.searchTerm() || this.selectedCategoryId() !== null;
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.mobileSearchOpen.set(false);
    this.selectedCategoryId.set(null);
    this.sortBy.set('recent');
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
