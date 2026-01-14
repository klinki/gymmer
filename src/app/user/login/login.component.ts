import { Component } from '@angular/core';
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {DexieAuthService} from "../../dexie-auth.service";

/**
 * Component for user authentication using email-based login.
 *
 * This component provides a simple authentication interface that allows users to:
 * - Enter their email address for authentication
 * - Handle authentication errors and success states
 * - Reset the form after successful submission
 *
 * The component uses Dexie Cloud authentication system.
 *
 * @route /account/login
 */
@Component({
    selector: 'app-login',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
  loading = false;

  signInForm = this.formBuilder.group({
    email: '',
  });

  constructor(
    private readonly authService: DexieAuthService,
    private readonly formBuilder: FormBuilder
  ) {}

  async onSubmit(): Promise<void> {
    try {
      this.loading = true;
      const email = this.signInForm.value.email as string;
      await this.authService.login(email);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      this.signInForm.reset();
      this.loading = false;
    }
  }
}
