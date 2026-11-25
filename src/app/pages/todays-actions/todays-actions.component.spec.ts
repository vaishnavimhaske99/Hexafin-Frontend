import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodaysActionsComponent } from './todays-actions.component';

describe('TodaysActionsComponent', () => {
  let component: TodaysActionsComponent;
  let fixture: ComponentFixture<TodaysActionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TodaysActionsComponent]
    });
    fixture = TestBed.createComponent(TodaysActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
