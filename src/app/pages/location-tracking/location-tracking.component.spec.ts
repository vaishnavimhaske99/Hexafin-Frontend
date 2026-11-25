import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationTrackingComponent } from './location-tracking.component';

describe('LocationTrackingComponent', () => {
  let component: LocationTrackingComponent;
  let fixture: ComponentFixture<LocationTrackingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LocationTrackingComponent]
    });
    fixture = TestBed.createComponent(LocationTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
