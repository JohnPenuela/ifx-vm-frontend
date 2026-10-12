import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  public readonly authService = inject(AuthService);
  public readonly themeService = inject(ThemeService);

  public loginForm: FormGroup = this.fb.group({
    email: ['admin@ifxcorp.com', [Validators.required, Validators.email]],
    password: ['Admin2026*!', [Validators.required, Validators.minLength(6)]]
  });

  public onSubmit(): void {
    if (this.loginForm.invalid || this.authService.isAuthenticating()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authService.login(this.loginForm.value).subscribe();
  }

  public fillAsAdmin(): void {
    this.loginForm.patchValue({
      email: 'admin@ifxcorp.com',
      password: 'Admin2026*!'
    });
  }

  public fillAsClient(): void {
    this.loginForm.patchValue({
      email: 'cliente@ifxcorp.com',
      password: 'Cliente2026*!'
    });
  }

  get f() {
    return this.loginForm.controls;
  }
}