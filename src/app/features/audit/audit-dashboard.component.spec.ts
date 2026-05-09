import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AuditDashboardComponent } from './audit-dashboard.component';
import { AuditService } from './services/audit.service';

describe('AuditDashboardComponent', () => {
  let component: AuditDashboardComponent;
  let fixture: ComponentFixture<AuditDashboardComponent>;
  let auditServiceSpy: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditServiceSpy = {
      runAudit: jest.fn().mockReturnValue(of({ violations: [] })),
      exportCsv: jest.fn().mockReturnValue(of(new Blob())),
      exportPdf: jest.fn().mockReturnValue(of(new Blob()))
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        AuditDashboardComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AuditService, useValue: auditServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuditDashboardComponent);
    component = fixture.componentInstance;

    // Mock URL methods for JSDOM
    window.URL.createObjectURL = jest.fn(() => 'mock-url');
    window.URL.revokeObjectURL = jest.fn();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should run audit and update violations signal', () => {
    component.hrJobId.set('job-1');
    component.itJobId.set('job-2');
    fixture.detectChanges();

    const mockViolations = [{ employee_id: 'EMP001', risk_level: 'HIGH' }];
    auditServiceSpy.runAudit.mockReturnValue(of({ violations: mockViolations }));

    component.runAudit();

    expect(auditServiceSpy.runAudit).toHaveBeenCalledWith('job-1', 'job-2');
    expect(component.violations().length).toBe(1);
    expect(component.violations()[0].employee_id).toBe('EMP001');
  });

  it('should handle export csv trigger', () => {
    component.violations.set([{ employee_id: 'EMP001' }]);
    fixture.detectChanges();

    auditServiceSpy.exportCsv.mockReturnValue(of(new Blob(['csv content'])));
    
    component.exportCsv();

    expect(auditServiceSpy.exportCsv).toHaveBeenCalledWith([{ employee_id: 'EMP001' }]);
  });

  it('should contain a mat-stepper with 3 steps', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const stepper = compiled.querySelector('mat-stepper');
    expect(stepper).toBeTruthy();

    // MatStepper headers usually have the mat-step-header class
    const stepHeaders = compiled.querySelectorAll('.mat-step-header');
    expect(stepHeaders.length).toBe(3);
  });

  it('should prevent moving to step 2 if HR mappings are incomplete', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const nextButtons = compiled.querySelectorAll('button[matStepperNext]');

    // Initially index is 0
    expect(component.stepper.selectedIndex).toBe(0);

    // Simulate clicking next on Step 1
    (nextButtons[0] as HTMLElement).click();
    fixture.detectChanges();

    // Index should still be 0 because isReady() is false (no jobId set)
    expect(component.stepper.selectedIndex).toBe(0);
  });

  it('should display a snackbar error message if the backend returns a structured error', () => {
    // Set up a scenario where runAudit fails
    component.hrJobId.set('job-1');
    component.itJobId.set('job-2');
    fixture.detectChanges();

    const snackBarSpy = jest.spyOn((component as any).snackBar, 'open');
    const errorResponse = { error: { message: 'Custom Backend Error' } };
    auditServiceSpy.runAudit.mockReturnValue(throwError(() => errorResponse));

    component.runAudit();

    expect(snackBarSpy).toHaveBeenCalledWith('Custom Backend Error', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  });

  it('should display FileUploadComponent initially for Step 1', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const uploadComponent = compiled.querySelector('app-file-upload');
    expect(uploadComponent).toBeTruthy();
    const mapperComponent = compiled.querySelector('app-shared-mapper');
    expect(mapperComponent).toBeFalsy();
  });

  it('should hide FileUploadComponent for HR record and show SharedMapperComponent upon successful upload event', () => {
    fixture.detectChanges();
    const uploadData = {
      jobId: 'new-job-id',
      headers: ['col1', 'col2'],
      suggestions: []
    };

    component.handleHrUpload(uploadData);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const uploadComponents = compiled.querySelectorAll('app-file-upload');
    // Only Step 2's upload component should remain
    expect(uploadComponents.length).toBe(1);

    const mapperComponent = compiled.querySelector('app-shared-mapper');
    expect(mapperComponent).toBeTruthy();
    expect(component.hrJobId()).toBe('new-job-id');
  });

  it('should hide FileUploadComponent for IT record and show SharedMapperComponent upon successful upload event', () => {
    fixture.detectChanges();
    const uploadData = {
      jobId: 'new-job-id',
      headers: ['col1', 'col2'],
      suggestions: []
    };

    component.handleItUpload(uploadData);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const uploadComponents = compiled.querySelectorAll('app-file-upload');
    // Only Step 2's upload component should remain
    expect(uploadComponents.length).toBe(1);

    const mapperComponent = compiled.querySelector('app-shared-mapper');
    expect(mapperComponent).toBeTruthy();
    expect(component.itJobId()).toBe('new-job-id');
  });
});
