import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { WFormModule } from 'angular-wform';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './pages/login/login.component';
import { PageContentComponent } from './components/page-content/page-content.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PizzaComponent } from './pages/pizza/pizza.component';
import { SuperComponent } from './pages/super/super.component';
import { SnickersComponent } from './pages/snickers/snickers.component';
import { MoviesComponent } from './pages/movies/movies.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    PizzaComponent,
    MoviesComponent,
    SnickersComponent,
    SuperComponent,
    PageContentComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,

    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatSelectModule,
    MatMenuModule,

    WFormModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
