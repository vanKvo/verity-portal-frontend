import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of } from 'rxjs';
import { AuthResponse, User } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:8000/auth';

  // Signals for state management
  private _user = signal<User | null>(this.loadUserFromStorage());
  currentUser = computed(() => this._user());
  isAuthenticated = computed(() => !!this._user());
  userRoles = computed(() => this._user()?.roles || []);

  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }

  login(credentials: { email: string; password: string }): any {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, formData).pipe(
      tap(response => this.handleAuthSuccess(response, credentials.email)),
      catchError(error => {
        console.error('Login failed', error);
        throw error;
      })
    );
  }

  guestLogin() {
    return this.http.post<AuthResponse>(`${this.apiUrl}/guest-login`, {}).pipe(
      tap(response => this.handleAuthSuccess(response, 'guest@verity.com')),
      catchError(error => {
        console.error('Guest login failed', error);
        throw error;
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private handleAuthSuccess(response: AuthResponse, email: string) {
    const user: User = { email, roles: response.roles };
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user', JSON.stringify(user));
    this._user.set(user);
    this.router.navigate(['/dashboard']);
  }

  private loadUserFromStorage(): User | null {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }
}
