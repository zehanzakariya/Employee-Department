import { TestBed } from '@angular/core/testing';

import { Dept } from './dept.service';

describe('Dept', () => {
  let service: Dept;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Dept);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
