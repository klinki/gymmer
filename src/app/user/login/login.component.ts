import { Component } from '@angular/core';
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {SupabaseAuthService} from "../../supabase-auth.service";

/**
 * Component for user authentication using email-based login.
 *
 * This component provides a simple authentication interface that allows users to:
 * - Enter their email address for authentication
 * - Receive a login link via email (magic link authentication)
 * - Handle authentication errors and success states
 * - Reset the form after successful submission
 *
 * The component uses Supabase's magic link authentication system, which sends
 * a secure login link to the user's email address instead of requiring a password.
 *
 * @route /account/login
 */
@Component({
  selector: 'app-login',
  standalone: true,
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
    private readonly supabase: SupabaseAuthService,
    private readonly formBuilder: FormBuilder
  ) {}

  async onSubmit(): Promise<void> {
    try {
      this.loading = true;
      const email = this.signInForm.value.email as string;
      const { data, error } = await this.supabase.signIn(email);

      if (error)
        throw error;

      alert('Check your email for the login link!');
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
