import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  showPassword = false;
  errorMsg = '';
  isLoading = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
  
  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit() {
    this.errorMsg = '';
    
    if (!this.username || !this.password) {
      this.errorMsg = 'Please enter both username and password.';
      return;
    }

    this.isLoading = true;
    
    this.authService.login(this.username, this.password).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const role = this.authService.getRole();
        if (role === 'employee') {
          this.router.navigate(['/agent-dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err?.error?.message || 'Invalid username or password';
      }
    });
  }
}
