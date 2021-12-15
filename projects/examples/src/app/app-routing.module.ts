import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { MoviesComponent } from './pages/movies/movies.component';
import { PizzaComponent } from './pages/pizza/pizza.component';
import { SnickersComponent } from './pages/snickers/snickers.component';
import { CharacterComponent } from './pages/character/character.component';

const routes: Routes = [{
  path: '',
  redirectTo: 'login',
  pathMatch: 'full',
}, {
  component: LoginComponent,
  path: 'login',
},  {
  component: PizzaComponent,
  path: 'pizza',
}, {
  component: MoviesComponent,
  path: 'movies',
}, {
  component: SnickersComponent,
  path: 'snickers',
}, {
  component: CharacterComponent,
  path: 'character',
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
