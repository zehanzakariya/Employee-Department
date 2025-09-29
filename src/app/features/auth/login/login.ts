import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LoginResponse } from '../../../core/models/auth.model';
import { Auth } from '../../../core/services/auth.service';
import { ErrorHandler } from '../../../core/services/error-handler';
import { UI_IMPORTS } from '../../../shared/ui-imports.ts/ui-imports.ts';

@Component({
  selector: 'app-login',
  imports: [...UI_IMPORTS],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private errorHandler = inject(ErrorHandler);

  busy = false;
  pending = false;

  form = this.fb.nonNullable.group({
    email: ['', [
      Validators.required,
      Validators.email,
    ]],
    password: ['', [
      Validators.required
    ]],
  });

  get f() {
    return this.form.controls;
  }

  submit() {
    if (this.form.invalid) {
      this.toastr.error('Please fix validation errors before submitting.', 'Error');
      return;
    }

    this.busy = true;
    this.pending = false;

    const payload = this.form.getRawValue();

    this.auth.login(payload).subscribe({
      next: (res: LoginResponse) => {
        this.auth.setSession(res.token);
        this.toastr.success('Login successful!', 'Success');

        if (this.auth.user?.role === 'Admin') {
          this.router.navigate([res.dashboardUrl || '/admin']);
        } else {
          this.router.navigate([res.dashboardUrl || '/employee']);
        }
      },
      error: (err) => {
        this.busy = false;
        // error handler for handling the HTTP error
        this.errorHandler.handleError(err, 'Login failed');
      },
    });
  }
}