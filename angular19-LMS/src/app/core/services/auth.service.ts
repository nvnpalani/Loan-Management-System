import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUser = signal<any | null>(null);
  public isAuthenticated = signal<boolean>(false);

  private readonly TOKEN_KEY = 'auth_token';

  constructor(private http: HttpClient) {
    this.checkInitialAuth();
  }

  private checkInitialAuth(): void {
    const token = this.getToken();
    if (token) {
      this.isAuthenticated.set(true);
    }
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.isAuthenticated.set(true);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRole(): string | null {
    return this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  login(username: string, pass: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, { username, password: pass }).pipe(
      tap(response => {
        if (response && response.role) {
          // Backend returns role and data
          this.setToken(response.role); // Use role as a simple token
          this.currentUser.set(response.data);
        } else if (response && response.token) {
          this.setToken(response.token);
          this.currentUser.set(response.user);
        }
      })
    );
  }
}
