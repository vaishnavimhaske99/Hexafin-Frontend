import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesUsersComponent } from './sales-users.component';

describe('SalesUsersComponent', () => {
  let component: SalesUsersComponent;
  let fixture: ComponentFixture<SalesUsersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SalesUsersComponent]
    });
    fixture = TestBed.createComponent(SalesUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
