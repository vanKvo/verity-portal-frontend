import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { AuditDashboardComponent } from './audit-dashboard.component';

describe('AuditDashboardComponent', () => {
  let component: AuditDashboardComponent;
  let fixture: ComponentFixture<AuditDashboardComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AuditDashboardComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuditDashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // Mock URL methods for JSDOM
    window.URL.createObjectURL = jest.fn(() => 'mock-url');
    window.URL.revokeObjectURL = jest.fn();

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should run audit and update violations signal', () => {
    component.hrJobId.set('job-1');
    component.accessJobId.set('job-2');
    fixture.detectChanges();
    
    component.runAudit();
    
    const req = httpMock.expectOne('http://localhost:8000/audit/leaver-mover');
    expect(req.request.method).toBe('POST');
    req.flush({ violations: [{ employee_id: 'EMP001', risk_level: 'HIGH' }] });
    
    expect(component.violations().length).toBe(1);
    expect(component.violations()[0].employee_id).toBe('EMP001');
  });

  it('should handle export csv trigger', () => {
    component.violations.set([{ employee_id: 'EMP001' }]);
    fixture.detectChanges();
    
    component.exportCsv();
    
    const req = httpMock.expectOne('http://localhost:8000/audit/export/csv');
    expect(req.request.method).toBe('POST');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['csv content'], { type: 'text/csv' }));
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
    component.accessJobId.set('job-2');
    fixture.detectChanges();

    const snackBarSpy = jest.spyOn((component as any).snackBar, 'open');
    
    component.runAudit();
    
    const req = httpMock.expectOne('http://localhost:8000/audit/leaver-mover');
    req.flush(
      { error: 'Validation Failed', message: 'Custom Backend Error' },
      { status: 400, statusText: 'Bad Request' }
    );
    
    expect(snackBarSpy).toHaveBeenCalledWith('Custom Backend Error', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  });
});
