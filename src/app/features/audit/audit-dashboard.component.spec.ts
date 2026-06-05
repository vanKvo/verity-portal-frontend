import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { AuditDashboardComponent } from './audit-dashboard.component';
import { AuditService } from './services/audit.service';
import { AuthService } from '../../core/services/auth.service';
import { ActivatedRoute } from '@angular/router';

describe('AuditDashboardComponent', () => {
  let component: AuditDashboardComponent;
  let fixture: ComponentFixture<AuditDashboardComponent>;
  let auditServiceSpy: jest.Mocked<AuditService>;
  let authServiceSpy: jest.Mocked<AuthService>;

  const mockViolations = [
    {
      id: 'violation-1',
      employee_id: 'E001',
      hr_termination_date: '2026-05-01',
      last_system_login: '2026-05-15T10:00:00Z',
      system_name: 'Active Directory',
      ip_address: '192.168.1.50',
      status: 'OPEN' as const,
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-01T00:00:00Z'
    },
    {
      id: 'violation-2',
      employee_id: 'E002',
      hr_termination_date: '2026-04-15',
      last_system_login: '2026-04-20T11:00:00Z',
      system_name: 'Active Directory',
      ip_address: '192.168.1.60',
      status: 'RESOLVED' as const,
      resolution_reason: 'Approved extension',
      resolved_by: 'eco@verity.com',
      resolved_at: '2026-04-22T09:00:00Z',
      created_at: '2026-04-21T00:00:00Z',
      updated_at: '2026-04-22T09:00:00Z'
    }
  ];

  beforeEach(async () => {
    auditServiceSpy = {
      getViolations: jest.fn().mockReturnValue(of(mockViolations)),
      resolveViolation: jest.fn().mockReturnValue(of({ ...mockViolations[0], status: 'RESOLVED', resolution_reason: 'Approved reason', resolved_by: 'hr@verity.com' }))
    } as any;

    authServiceSpy = {
      hasRole: jest.fn().mockReturnValue(true),
      currentUser: signal({ email: 'hr@verity.com', roles: ['ROLE_HR'] })
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        AuditDashboardComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AuditService, useValue: auditServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuditDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load violations on init', () => {
    expect(component).toBeTruthy();
    expect(auditServiceSpy.getViolations).toHaveBeenCalled();
    expect(component.violations().length).toBe(2);
  });

  it('should compute open and resolved violations separately', () => {
    expect(component.openViolations().length).toBe(1);
    expect(component.openViolations()[0].id).toBe('violation-1');
    expect(component.resolvedViolations().length).toBe(1);
    expect(component.resolvedViolations()[0].id).toBe('violation-2');
  });

  it('should handle resolve action and open dialog overlay', () => {
    const violation = mockViolations[0];
    component.resolveViolation(violation);
    expect(component.resolvingViolation()).toBe(violation);
    expect(component.resolutionReason).toBe('');
  });

  it('should submit resolution successfully', () => {
    const violation = mockViolations[0];
    component.resolveViolation(violation);
    component.resolutionReason = 'Valid reason (min 5 chars)';
    
    // spy on window alert to prevent UI blocking in JSDOM
    component.submitResolution();

    expect(auditServiceSpy.resolveViolation).toHaveBeenCalledWith(violation.id, {
      resolution_reason: 'Valid reason (min 5 chars)'
    });
    expect(component.resolvingViolation()).toBeNull();
    expect(component.showSuccessDialog()).toBe(true);
    expect(component.successMessage).toContain('successfully resolved');
    expect(auditServiceSpy.getViolations).toHaveBeenCalledTimes(2); // Initial + reload
  });

  it('should block resolution submit if reason is too short', () => {
    const violation = mockViolations[0];
    component.resolveViolation(violation);
    component.resolutionReason = 'bad';
    
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    component.submitResolution();

    expect(auditServiceSpy.resolveViolation).not.toHaveBeenCalled();
    expect(component.resolvingViolation()).toBe(violation);

    alertSpy.mockRestore();
  });
});
