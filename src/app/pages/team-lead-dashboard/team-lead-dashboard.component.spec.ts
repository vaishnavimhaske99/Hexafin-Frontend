import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamLeadDashboardComponent } from './team-lead-dashboard.component';

describe('TeamLeadDashboardComponent', () => {
  let component: TeamLeadDashboardComponent;
  let fixture: ComponentFixture<TeamLeadDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TeamLeadDashboardComponent]
    });
    fixture = TestBed.createComponent(TeamLeadDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
