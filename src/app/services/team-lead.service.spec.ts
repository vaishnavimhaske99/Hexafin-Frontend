import { TestBed } from '@angular/core/testing';

import { TeamLeadService } from './team-lead.service';

describe('TeamLeadService', () => {
  let service: TeamLeadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TeamLeadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
