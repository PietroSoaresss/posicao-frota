import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarComponent } from './shell/sidebar/sidebar.component';
import { TopbarComponent } from './shell/topbar/topbar.component';
import { AuthService } from './core/services/auth.service';
import { DataService } from './core/services/data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <router-outlet *ngIf="isLoginRoute"></router-outlet>

    <div class="pv-app" *ngIf="!isLoginRoute">
      <app-sidebar></app-sidebar>
      <div class="pv-main">
        <app-topbar></app-topbar>
        <div class="pv-content">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class App implements OnInit {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);

  isLoginRoute = this.router.url.includes('/login');

  async ngOnInit() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.isLoginRoute = event.urlAfterRedirects.includes('/login');
      });

    if (this.auth.isAuthenticated()) {
      await this.data.syncAll();
    }
  }
}
