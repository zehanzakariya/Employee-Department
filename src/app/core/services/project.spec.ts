import { TestBed } from '@angular/core/testing';
import { from } from 'rxjs';

import { projectService } from './project.service';   



describe('Project', () => {
  let service: projectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(projectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
