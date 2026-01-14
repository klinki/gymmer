import {Injectable} from '@angular/core';
import {DatabaseService} from "./database.service";
import {Observable} from "rxjs";
import {UserLogin} from "dexie-cloud-addon";

@Injectable({
  providedIn: 'root'
})
export class DexieAuthService {
  constructor(private db: DatabaseService) {}

  get user(): Observable<UserLogin> {
    return this.db.cloud.currentUser;
  }

  async login(email: string) {
    await this.db.cloud.login({ email });
  }

  logout() {
    this.db.cloud.logout();
  }
}
