import {inject, Injectable, NgZone} from '@angular/core';
import {createClient, SupabaseClient} from "@supabase/supabase-js";
import {environment} from "../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private readonly ngZone = inject(NgZone);

  private readonly _supabase: SupabaseClient;
  public get supabase() {
    return this._supabase;
  }

  constructor() {
    const isKarma = !!(window as any)['__karma__'];
    const options = isKarma ? { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } } : {};
    
    this._supabase = this.ngZone.runOutsideAngular(() =>
      createClient(environment.supabaseUrl, environment.supabaseKey, options)
    );
  }
}
