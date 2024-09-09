import { Component } from '@angular/core';
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {SupabaseAuthService} from "../../supabase-auth.service";

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
