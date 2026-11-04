import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyLeadsComponent } from './my-leads.component';

describe('MyLeadsComponent', () => {
  let component: MyLeadsComponent;
  let fixture: ComponentFixture<MyLeadsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyLeadsComponent]
    });
    fixture = TestBed.createComponent(MyLeadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
