import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center px-4">
      <div class="w-full max-w-md bg-[#111113] border border-zinc-800 p-8">
        <div class="flex items-center justify-between mb-8">
          <a
            routerLink="/"
            class="text-[11px] font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
          >
            ← Catálogo
          </a>
          <span class="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest border border-zinc-700 text-zinc-300">
            Admin
          </span>
        </div>

        <h1 class="text-2xl font-bold uppercase tracking-tight text-white">
          Iniciar Sesión
        </h1>
        <p class="text-sm text-zinc-400 mt-1.5">
          Administra tus categorías, precios y productos del catálogo.
        </p>

        <div
          *ngIf="errorMessage()"
          class="mt-5 p-3.5 border border-white/30 bg-zinc-950 text-zinc-200 text-xs font-mono"
        >
          {{ errorMessage() }}
        </div>

        <form (ngSubmit)="onSubmit()" class="mt-6 space-y-4">
          <div>
            <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              placeholder="admin@catalogo.com"
              class="w-full px-3.5 py-3 bg-black border border-zinc-800 text-white text-sm placeholder-zinc-600 focus:border-white outline-none transition-colors"
            />
          </div>

          <div>
            <label class="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              placeholder="••••••••"
              class="w-full px-3.5 py-3 bg-black border border-zinc-800 text-white text-sm placeholder-zinc-600 focus:border-white outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-3.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-mono font-bold text-xs uppercase tracking-widest transition-colors mt-2"
          >
            {{ loading() ? 'Verificando...' : 'Entrar al Panel' }}
          </button>
        </form>

        <div class="mt-6 pt-5 border-t border-zinc-800 text-xs font-mono text-zinc-500 space-y-1">
          <p class="text-zinc-400 uppercase text-[10px] tracking-wider">Acceso por defecto</p>
          <p>Usuario: <span class="text-zinc-200">admin&#64;catalogo.com</span></p>
          <p>Clave: <span class="text-zinc-200">admin123</span></p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = 'admin@catalogo.com';
  password = 'admin123';
  loading = signal<boolean>(false);
  errorMessage = signal<string>('');

  onSubmit(): void {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err?.error?.message ||
            'No se pudo conectar con el servidor o las credenciales son incorrectas.'
        );
      },
    });
  }
}
