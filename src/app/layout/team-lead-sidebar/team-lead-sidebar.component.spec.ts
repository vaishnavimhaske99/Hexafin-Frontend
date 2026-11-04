import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamLeadSidebarComponent } from './team-lead-sidebar.component';

describe('TeamLeadSidebarComponent', () => {
  let component: TeamLeadSidebarComponent;
  let fixture: ComponentFixture<TeamLeadSidebarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TeamLeadSidebarComponent]
    });
    fixture = TestBed.createComponent(TeamLeadSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
