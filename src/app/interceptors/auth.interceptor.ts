import { Injectable } from '@angular/core';

import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    const token = this.authService.getToken();

    const isApiRequest = request.url.startsWith(
      'http://localhost:8080/api/'
    );

    const isPublicAuthRequest =
      request.url.includes('/api/auth/login') ||
      request.url.includes('/api/auth/signup');

    if (token && isApiRequest && !isPublicAuthRequest) {

      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

    }

    return next.handle(request);
  }
}