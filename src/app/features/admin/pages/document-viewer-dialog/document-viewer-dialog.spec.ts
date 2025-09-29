import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentViewerDialog } from './document-viewer-dialog';

describe('DocumentViewerDialog', () => {
  let component: DocumentViewerDialog;
  let fixture: ComponentFixture<DocumentViewerDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentViewerDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentViewerDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
