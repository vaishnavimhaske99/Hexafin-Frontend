import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesUserLeadsComponent } from './sales-user-leads.component';

describe('SalesUserLeadsComponent', () => {
  let component: SalesUserLeadsComponent;
  let fixture: ComponentFixture<SalesUserLeadsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SalesUserLeadsComponent]
    });
    fixture = TestBed.createComponent(SalesUserLeadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
