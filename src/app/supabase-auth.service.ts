import {inject, Injectable, NgZone} from '@angular/core'
import {
  AuthChangeEvent,
  AuthSession,
  createClient, RealtimeChannel,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import {BehaviorSubject, Observable, skipWhile} from "rxjs";
import {SupabaseService} from "./supabase.service";

export interface Profile {
  id?: string
  username: string
  website: string
  avatar_url: string
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseAuthService {
  private supabase = inject(SupabaseService);
  _session: AuthSession | null = null

  // Supabase user state
  private _$user = new BehaviorSubject<User | null | undefined>(undefined);
  public $user = this._$user.pipe(skipWhile(_ => typeof _ === 'undefined')) as Observable<User | null>;
  private user_id?: string;

  // Profile state
  private _$profile = new BehaviorSubject<Profile | null | undefined>(undefined);
  $profile = this._$profile.pipe(skipWhile(_ => typeof _ === 'undefined')) as Observable<Profile | null>;
  private profile_subscription?: RealtimeChannel;

  constructor() {
    // Initialize Supabase user
    // Get initial user from the current session, if exists
    this.supabase.supabase.auth.getUser().then(({ data, error }) => {
      console.log({ data, error});
      this._$user.next(data && data.user && !error ? data.user : null);

      // After the initial value is set, listen for auth state changes
      this.supabase.supabase.auth.onAuthStateChange((event, session) => {
        this._$user.next(session?.user ?? null);
      });
    });

    // Initialize the user's profile
    // The state of the user's profile is dependent on their being a user. If no user is set, there shouldn't be a profile.
    this.$user.subscribe(user => {
      if (user) {
        // We only make changes if the user is different
        if (user.id !== this.user_id) {
          const user_id = user.id;
          this.user_id = user_id;

          // One-time API call to Supabase to get the user's profile
          this.supabase.supabase
            .from('profiles')
            .select('*')
            .match({ id: user_id })
            .single()
            .then(res => {

              // Update our profile BehaviorSubject with the current value
              this._$profile.next(res.data ?? null);

              // Listen to any changes to our user's profile using Supabase Realtime
              this.profile_subscription = this.supabase.supabase
                .channel('public:profiles')
                .on('postgres_changes', {
                  event: '*',
                  schema: 'public',
                  table: 'profiles',
                  filter: 'id=eq.' + user.id
                }, (payload: any) => {

                  // Update our profile BehaviorSubject with the newest value
                  this._$profile.next(payload.new);

                })
                .subscribe()
            });
        }
      }
      else {
        // If there is no user, update the profile BehaviorSubject, delete the user_id, and unsubscribe from Supabase Realtime
        this._$profile.next(null);
        delete this.user_id;
        if (this.profile_subscription) {
          this.supabase.supabase.removeChannel(this.profile_subscription).then(res => {
            console.log('Removed profile channel subscription with status: ', res);
          });
        }
      }
    });
  }

  ngOnDestroy(): void {
    // perform clean up.
  }

  get session() {
    this.supabase.supabase.auth.getSession().then(({ data }) => {
      this._session = data.session
    })
    return this._session;
  }

  setSession(access: string, refresh: string) {
    return this.supabase.supabase.auth.setSession({
      access_token: access,
      refresh_token: refresh
    });
  }

  profile(user: User) {
    return this.supabase
      .supabase
      .from('profiles')
      .select(`username, website, avatar_url`)
      .eq('id', user.id)
      .single()
  }

  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.supabase.auth.onAuthStateChange(callback)
  }

  signIn(email: string) {
    return this.supabase.supabase.auth.signInWithOtp({ email })
  }

  signOut() {
    return this.supabase.supabase.auth.signOut()
  }

  updateProfile(profile: Profile) {
    const update = {
      ...profile,
      updated_at: new Date(),
    }

    return this.supabase.supabase.from('profiles').upsert(update)
  }

  downLoadImage(path: string) {
    return this.supabase.supabase.storage.from('avatars').download(path)
  }

  uploadAvatar(filePath: string, file: File) {
    return this.supabase.supabase.storage.from('avatars').upload(filePath, file)
  }
}
