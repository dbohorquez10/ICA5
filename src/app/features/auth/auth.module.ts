import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { RegistroComponent } from './registro/registro.component';

@NgModule({
  declarations: [LoginComponent, RegistroComponent],
  imports: [CommonModule, RouterModule, AuthRoutingModule],
})
export class AuthModule {}
