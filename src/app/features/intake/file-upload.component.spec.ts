import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileUploadComponent } from './file-upload.component';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { of, throwError, Subject } from 'rxjs';
import { SharedMapperService } from './services/shared-mapper.service';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;
  let mapperServiceSpy: jest.Mocked<SharedMapperService>;
  let uploadSubject: Subject<any>;

  beforeEach(async () => {
    uploadSubject = new Subject<any>();
    mapperServiceSpy = {
      uploadFile: jest.fn().mockReturnValue(uploadSubject.asObservable())
    } as any;

    await TestBed.configureTestingModule({
      imports: [FileUploadComponent, MatIconModule, MatProgressSpinnerModule],
      providers: [
        { provide: SharedMapperService, useValue: mapperServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger native file input click when dropzone is clicked', () => {
    const inputSpy = jest.spyOn(component.fileInput.nativeElement, 'click');
    const dropzone = fixture.nativeElement.querySelector('.dropzone');
    dropzone.click();
    expect(inputSpy).toHaveBeenCalled();
  });

  it('should handle dragover and dragleave events to toggle isDragging state', () => {
    component.onDragOver({ preventDefault: () => {} } as any);
    expect(component.isDragging()).toBe(true);
    
    component.onDragLeave({ preventDefault: () => {} } as any);
    expect(component.isDragging()).toBe(false);
  });

  it('should handle file drop event, prevent default behavior, and trigger upload', () => {
    const dropzone = fixture.nativeElement.querySelector('.dropzone');
    const uploadSpy = jest.spyOn(component as any, 'onFileSelected');
    const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    
    const dragEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        files: [mockFile]
      }
    };
    
    component.onDrop(dragEvent as any);
    
    expect(dragEvent.preventDefault).toHaveBeenCalled();
    expect(uploadSpy).toHaveBeenCalledWith(mockFile);
  });

  it('should prevent upload and set errorMessage if file extension is invalid', () => {
    fixture.componentRef.setInput('allowedExtensions', ['.csv']);
    const mockFile = new File(['test'], 'malicious.exe', { type: 'application/x-msdownload' });
    
    (component as any).onFileSelected(mockFile);
    
    expect(component.errorMessage()).toContain('Invalid file extension');
    expect(mapperServiceSpy.uploadFile).not.toHaveBeenCalled();
  });

  it('should upload file and emit onUploadSuccess upon successful service response', () => {
    const successSpy = jest.spyOn(component.onUploadSuccess, 'emit');
    const mockFile = new File(['test'], 'valid.csv', { type: 'text/csv' });
    const mockResponse = {
      job_id: 'uuid-123',
      headers: ['id', 'name'],
      suggestions: []
    };

    component.uploadFile(mockFile);
    expect(component.isUploading()).toBe(true);

    uploadSubject.next(mockResponse);
    uploadSubject.complete();

    expect(successSpy).toHaveBeenCalledWith({
      job_id: mockResponse.job_id,
      headers: mockResponse.headers,
      suggestions: mockResponse.suggestions
    });
    expect(component.isUploading()).toBe(false);
  });

  it('should display MatProgressSpinner while uploading', () => {
    component.isUploading.set(true);
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should emit onUploadError and set errorMessage if service fails', () => {
    const errorSpy = jest.spyOn(component.onUploadError, 'emit');
    const mockFile = new File(['test'], 'valid.csv', { type: 'text/csv' });
    
    component.uploadFile(mockFile);
    expect(component.isUploading()).toBe(true);

    uploadSubject.error({ error: { detail: 'Server Error' } });

    expect(component.errorMessage()).toBe('Server Error');
    expect(errorSpy).toHaveBeenCalledWith('Server Error');
    expect(component.isUploading()).toBe(false);
  });
});
