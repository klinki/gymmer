import {Component, OnInit} from '@angular/core';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms'
import {UserLogin} from "dexie-cloud-addon";
import {DatabaseService} from "../../database.service";
import { DexieAuthService } from "../../dexie-auth.service";
import { Profile } from '../../models';

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
  user: UserLogin | undefined;

  updateProfileForm = this.formBuilder.group({
    username: '',
    website: '',
    avatar_url: '',
  })

  constructor(
    private readonly authService: DexieAuthService,
    private readonly db: DatabaseService,
    private formBuilder: FormBuilder
  ) {}

  async ngOnInit(): Promise<void> {
    this.authService.user.subscribe(async user => {
      this.user = user;
      if (user && user.userId) {
        await this.getProfile(user.userId);
      }
    });
  }

  async getProfile(userId: string) {
    try {
      this.loading = true
      const profile = await this.db.profiles.get(userId);

      if (profile) {
        this.profile = profile;
        const { username, website, avatar_url } = this.profile
        this.updateProfileForm.patchValue({
          username,
          website,
          avatar_url,
        })
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
      const user = this.user;

      if (!user || !user.userId) {
        return;
      }

      const username = this.updateProfileForm.value.username as string
      const website = this.updateProfileForm.value.website as string
      const avatar_url = this.updateProfileForm.value.avatar_url as string

      await this.db.profiles.put({
        id: user.userId,
        username,
        website,
        avatar_url,
      })
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.loading = false
    }
  }

  async signOut() {
    this.authService.logout()
  }
}
