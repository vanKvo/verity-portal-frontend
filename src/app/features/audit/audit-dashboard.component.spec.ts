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
});
