import { TestBed } from '@angular/core/testing';

import { Admin } from './admin.service';

describe('Admin', () => {
  let service: Admin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Admin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
