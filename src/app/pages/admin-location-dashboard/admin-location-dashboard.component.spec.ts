import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLocationDashboardComponent } from './admin-location-dashboard.component';

describe('AdminLocationDashboardComponent', () => {
  let component: AdminLocationDashboardComponent;
  let fixture: ComponentFixture<AdminLocationDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminLocationDashboardComponent]
    });
    fixture = TestBed.createComponent(AdminLocationDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
