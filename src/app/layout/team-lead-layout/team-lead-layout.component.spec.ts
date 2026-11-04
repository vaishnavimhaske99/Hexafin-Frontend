import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamLeadLayoutComponent } from './team-lead-layout.component';

describe('TeamLeadLayoutComponent', () => {
  let component: TeamLeadLayoutComponent;
  let fixture: ComponentFixture<TeamLeadLayoutComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TeamLeadLayoutComponent]
    });
    fixture = TestBed.createComponent(TeamLeadLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
