import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; // ✅ नवीन
import {
  UserService,
  UserResponseDTO,
  UserRole
} from '../../services/user.service';

interface TreeNode extends UserResponseDTO {
  children: TreeNode[];
}

@Component({
  selector: 'app-my-organization',
  templateUrl: './my-organization.component.html',
  styleUrls: ['./my-organization.component.css']
})
export class MyOrganizationComponent implements OnInit {

  users: UserResponseDTO[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  // Modal State
  showModal = false;
  modalParent: UserResponseDTO | null = null;
  modalParentLabel = '';
  modalSelectedUserId: number | null = null;
  modalSelectedRole: UserRole | null = null;
  modalError = '';
  modalWarning = '';

  // Hierarchy Rules
  private readonly allowedChildren: Record<UserRole, UserRole[]> = {
    ADMIN: ['MANAGER'],
    MANAGER: ['TEAM_LEAD', 'SALES'],
    TEAM_LEAD: ['SALES'],
    SALES: []
  };

  private readonly defaultChildRole: Record<UserRole, UserRole | null> = {
    ADMIN: 'MANAGER',
    MANAGER: 'SALES',
    TEAM_LEAD: 'SALES',
    SALES: null
  };

  // ✅ Router इंजेक्ट करा
  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  // ===========================
  // DATA LOADING
  // ===========================
  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Failed to load users.';
      }
    });
  }

  // ===========================
  // TREE BUILDING
  // ===========================
  get adminRoots(): UserResponseDTO[] {
    return this.users.filter(u => u.role === 'ADMIN');
  }

  childrenOf(parentId: number): TreeNode[] {
    return this.users
      .filter(u => u.reportsToId === parentId)
      .map(u => ({
        ...u,
        children: this.childrenOf(u.id)
      }));
  }

  get unassignedUsers(): UserResponseDTO[] {
    return this.users.filter(
      u => u.role !== 'ADMIN' && u.reportsToId === null
    );
  }

  // ===========================
  // HELPERS
  // ===========================
  displayName(user: UserResponseDTO): string {
    const first = user.firstName || '';
    const last = user.lastName || '';
    return `${first} ${last}`.trim() || user.email;
  }

  roleLabel(role: UserRole): string {
    return role.replace('_', ' ');
  }

  canHaveChildren(user: UserResponseDTO): boolean {
    return this.allowedChildren[user.role].length > 0;
  }

  availableRolesForParent(): UserRole[] {
    if (!this.modalParent) return [];
    return this.allowedChildren[this.modalParent.role];
  }

  // ✅ नवीन: Profile उघडण्यासाठी
  openProfile(userId: number): void {
    this.router.navigate(['/users', userId, 'profile']);
  }

  // ===========================
  // MODAL ACTIONS
  // ===========================
  openAddUnder(parent: UserResponseDTO): void {
    if (!this.canHaveChildren(parent)) return;
    this.modalParent = parent;
    this.modalParentLabel = this.displayName(parent);
    this.modalSelectedUserId = null;
    this.modalSelectedRole = this.defaultChildRole[parent.role];
    this.modalError = '';
    this.modalWarning = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalParent = null;
    this.modalParentLabel = '';
    this.modalSelectedUserId = null;
    this.modalSelectedRole = null;
    this.modalError = '';
    this.modalWarning = '';
  }

  get eligibleUsersForModal(): UserResponseDTO[] {
    if (!this.modalParent) return [];
    const parentId = this.modalParent.id;

    return this.users.filter(u => {
      if (u.id === parentId) return false;
      if (u.role === 'ADMIN') return false;
      if (u.reportsToId !== null) return false;
      if (this.isAncestorOf(u.id, parentId)) return false;
      return true;
    });
  }

  private isAncestorOf(candidateId: number, nodeId: number): boolean {
    let current = this.users.find(u => u.id === nodeId);
    while (current && current.reportsToId !== null) {
      if (current.reportsToId === candidateId) return true;
      current = this.users.find(u => u.id === current!.reportsToId);
    }
    return false;
  }

  onUserSelected(): void {
    this.modalWarning = '';
    this.modalError = '';
    if (!this.modalSelectedUserId) return;

    const selected = this.users.find(u => u.id === this.modalSelectedUserId);
    if (!selected) return;

    const validRoles = this.availableRolesForParent();
    if (!validRoles.includes(selected.role)) {
      this.modalWarning =
        `Selected user is currently ${this.roleLabel(selected.role)}. ` +
        `Role will be updated to ${validRoles[0]} on save.`;
      this.modalSelectedRole = validRoles[0];
    } else {
      this.modalSelectedRole = selected.role;
    }
  }

  saveModal(): void {
    if (!this.modalParent) return;

    if (!this.modalSelectedUserId || !this.modalSelectedRole) {
      this.modalError = 'Please select a user and role.';
      return;
    }

    this.saving = true;
    this.modalError = '';

    this.userService.updateHierarchy(this.modalSelectedUserId, {
      role: this.modalSelectedRole,
      reportsToId: this.modalParent.id
    }).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'Hierarchy updated successfully.';
        this.closeModal();
        this.loadUsers();
        this.clearSuccessLater();
      },
      error: (err) => {
        this.saving = false;
        this.modalError = err?.error?.message || 'Failed to update hierarchy.';
      }
    });
  }

  // ===========================
  // UNASSIGN USER
  // ===========================
  unlinkUser(user: UserResponseDTO): void {
    if (user.role === 'ADMIN') {
      this.errorMessage = 'ADMIN is a top-level role and cannot be unassigned.';
      this.clearSuccessLater();
      return;
    }

    const confirmed = confirm(
      `Remove ${this.displayName(user)} from their current supervisor?`
    );
    if (!confirmed) return;

    this.userService.updateHierarchy(user.id, {
      role: user.role,
      reportsToId: null
    }).subscribe({
      next: () => {
        this.successMessage = `${this.displayName(user)} is now unassigned.`;
        this.loadUsers();
        this.clearSuccessLater();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to unassign user.';
        this.clearSuccessLater();
      }
    });
  }

  private clearSuccessLater(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 4000);
  }
}