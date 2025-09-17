import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms'
import { AuthSession } from '@supabase/supabase-js'
import {Profile, SupabaseAuthService} from "../../supabase-auth.service";

@Component({
    selector: 'app-account',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './account.component.html',
    styleUrl: './account.component.scss'
})
export class AccountComponent implements OnInit {
  loading = false;
  profile!: Profile;
  session: AuthSession | null = null;

  updateProfileForm = this.formBuilder.group({
    username: '',
    website: '',
    avatar_url: '',
  })

  constructor(
    private readonly supabase: SupabaseAuthService,
    private formBuilder: FormBuilder
  ) {}

  async ngOnInit(): Promise<void> {
    this.supabase.authChanges((_, session) => (this.session = session))

    await this.getProfile()

    const { username, website, avatar_url } = this.profile
    this.updateProfileForm.patchValue({
      username,
      website,
      avatar_url,
    })
  }

  async getProfile() {
    try {
      this.loading = true
      const user = this.session?.user;

      if (!user) {
        return;
      }

      const { data: profile, error, status } = await this.supabase.profile(user);

      if (error && status !== 406) {
        throw error;
      }

      if (profile) {
        this.profile = profile;
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      this.loading = false
    }
  }

  async updateProfile(): Promise<void> {
    try {
      this.loading = true
      const user = this.session?.user;

      if (!user) {
        return;
      }

      const username = this.updateProfileForm.value.username as string
      const website = this.updateProfileForm.value.website as string
      const avatar_url = this.updateProfileForm.value.avatar_url as string

      const { error } = await this.supabase.updateProfile({
        id: user.id,
        username,
        website,
        avatar_url,
      })
      if (error) throw error
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.loading = false
    }
  }

  async signOut() {
    await this.supabase.signOut()
  }
}

