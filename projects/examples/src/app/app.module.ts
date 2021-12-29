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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { WFormModule } from 'angular-wform';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './pages/login/login.component';
import { PageContentComponent } from './components/page-content/page-content.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PizzaComponent } from './pages/pizza/pizza.component';
import { CharacterComponent } from './pages/character/character.component';
import { SneackersComponent } from './pages/sneackers/sneackers.component';
import { MoviesComponent } from './pages/movies/movies.component';
import { CharacterProfileComponent } from './pages/character/profile/character-profile.component';
import { CharacterAbilitiesComponent } from './pages/character/abilities/character-abilities.component';
import { CharacterSkillsComponent } from './pages/character/skills/character-skills.component';
import { CharacterThingsComponent } from './pages/character/things/character-things.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    PizzaComponent,
    MoviesComponent,
    SneackersComponent,
    CharacterComponent,
    CharacterProfileComponent,
    CharacterAbilitiesComponent,
    CharacterSkillsComponent,
    CharacterThingsComponent,
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
    MatExpansionModule,
    MatTabsModule,
    MatTableModule,
    MatAutocompleteModule,

    WFormModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
