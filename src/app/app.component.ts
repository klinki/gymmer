import {Component, NgZone} from '@angular/core';
import {ActivatedRoute, ActivatedRouteSnapshot, Router} from "@angular/router";
import {SupabaseAuthService} from "./supabase-auth.service";
import {Location} from "@angular/common";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'gymmer';

  constructor(
    private zone: NgZone,
    private router: Router,
    private authService: SupabaseAuthService,
    private activatedRoute: ActivatedRoute,
    private location: Location
  ) {
    this.setupListener()
  }

  async setupListener() {
    console.log(this.activatedRoute.snapshot.fragment);
    console.log(this.location.path(true));
    const fragment = this.location.path(true)?.replace('#', '');
    const searchParams = new URLSearchParams(fragment);

    const access = searchParams.get('access_token') ?? ''; // openUrl.split('#access_token=').pop().split('&')[0]
    const refresh = searchParams.get('refresh_token') ?? ''; // openUrl.split('&refresh_token=').pop().split('&')[0]

    if (access?.length != 0 && refresh?.length != 0) {
      await this.authService.setSession(access, refresh);
    }
  }
}
