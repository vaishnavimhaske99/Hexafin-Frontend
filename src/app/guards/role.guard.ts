import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// ==========================================
// ✅ canMatchRole — Infinite Loop थांबवण्यासाठी
// (जर role match नाही, तर Angular पुढचा route तपासतो)
// ==========================================
export const canMatchRole = (allowedRoles: string[]): CanMatchFn => {
  return () => {
    const authService = inject(AuthService);

    // लॉगिन नसेल तर route load करू नका
    if (!authService.isLoggedIn()) {
      return false;
    }

    const role = authService.getRole()?.toUpperCase();
    return role ? allowedRoles.includes(role) : false;
  };
};

// ==========================================
// ✅ roleGuard — जुन्या code साठी (CanActivateFn)
// (जर role match नाही, तर स्वतःच्या dashboard वर पाठव)
// ==========================================
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // 1. Login check
    if (!authService.isLoggedIn()) {
      return router.createUrlTree(['/login']);
    }

    // 2. Get current role
    const role = authService.getRole()?.toUpperCase();

    // 3. Allow if role matches
    if (role && allowedRoles.includes(role)) {
      return true;
    }

    // 4. ⚠️ Infinite loop टाळण्यासाठी — स्वतःच्या dashboard वर पाठव
    console.warn(
      `Access denied. Role "${role}" cannot access this route. Redirecting to own dashboard.`
    );

    switch (role) {
      case 'ADMIN':
        return router.createUrlTree(['/dashboard']);
      case 'MANAGER':
        return router.createUrlTree(['/manager-dashboard']);
      case 'TEAM_LEAD':
        return router.createUrlTree(['/team-lead-dashboard']);
      case 'SALES':
        return router.createUrlTree(['/user-dashboard']);
      default:
        return router.createUrlTree(['/login']);
    }
  };
};