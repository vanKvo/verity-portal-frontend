import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedMapperComponent } from './shared-mapper.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { of } from 'rxjs';
import { SharedMapperService } from './services/shared-mapper.service';

describe('SharedMapperComponent', () => {
  let component: SharedMapperComponent;
  let fixture: ComponentFixture<SharedMapperComponent>;
  let mapperServiceSpy: jest.Mocked<SharedMapperService>;

  beforeEach(async () => {
    mapperServiceSpy = {
      confirmMapping: jest.fn().mockReturnValue(of({ status: 'success' }))
    } as any;

    await TestBed.configureTestingModule({
      imports: [SharedMapperComponent],
      providers: [
        { provide: SharedMapperService, useValue: mapperServiceSpy },
        provideAnimationsAsync()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SharedMapperComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render dropdowns for each header', () => {
    // Set input values
    fixture.componentRef.setInput('headers', ['Emp Name', 'Status']);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const selects = compiled.querySelectorAll('mat-select');
    expect(selects.length).toBe(2);
  });

  it('should update mappings signal on selection', () => {
    fixture.componentRef.setInput('headers', ['Emp Name']);
    fixture.detectChanges();

    component.updateMapping('Emp Name', 'employee_name');
    expect(component.mappings()['Emp Name']).toBe('employee_name');
  });

  it('should display visual indicators for required fields', async () => {
    fixture.componentRef.setInput('requiredSchema', [
      { field: 'employee_id', description: 'ID', required: true }
    ]);
    fixture.componentRef.setInput('headers', ['Emp ID']);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector('mat-select') as HTMLElement;
    select.click(); // Open the select to render options
    fixture.detectChanges();
    await fixture.whenStable();

    const requiredIndicator = document.querySelector('.required-asterisk');
    expect(requiredIndicator).toBeTruthy();
    expect(requiredIndicator?.textContent).toContain('*');
  });

  it('should autofill mappings when confidence > 70', () => {
    fixture.componentRef.setInput('headers', ['Emp ID', 'Dept']);
    fixture.componentRef.setInput('requiredSchema', [
      { field: 'employee_id', description: 'ID', required: true }
    ]);

    // Mock suggestions from backend
    fixture.componentRef.setInput('suggestions', [
      { header: 'Emp ID', target: 'employee_id', confidence: 85 },
      { header: 'Dept', target: 'department', confidence: 50 }
    ]);

    component.applyAutofill();

    expect(component.mappings()['Emp ID']).toBe('employee_id');
    expect(component.mappings()['Dept']).toBeUndefined();
  });

  it('should display manual mapping prompt if required fields are missing', () => {
    fixture.componentRef.setInput('headers', ['Emp ID']); // Need headers to show prompt
    fixture.componentRef.setInput('requiredSchema', [
      { field: 'employee_id', description: 'ID', required: true }
    ]);
    // mappings is still a signal, so we can't set it via setInput if it's not an @Input()
    // but in shared-mapper.component.ts it's: mappings = signal<Record<string, string>>({});
    component.mappings.set({}); // This is fine

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const prompt = compiled.querySelector('.manual-mapping-prompt');
    expect(prompt?.textContent).toContain('Some required fields could not be matched automatically');
  });

  it('should accept headers and suggestions as inputs instead of internal signals', () => {
    fixture.componentRef.setInput('headers', ['Input Header']);
    fixture.componentRef.setInput('suggestions', [{ header: 'Input Header', target: 'target', confidence: 100 }]);
    fixture.detectChanges();

    expect(component.headers()).toEqual(['Input Header']);
    expect(component.suggestions()).toEqual([{ header: 'Input Header', target: 'target', confidence: 100 }]);
  });

  it('should call confirmMapping on mapperService with correct parameters', () => {
    fixture.componentRef.setInput('jobId', 'test-job-id');
    fixture.componentRef.setInput('schemaType', 'HR_ROSTER');
    fixture.componentRef.setInput('requiredSchema', [{ field: 'target', description: 'desc', required: true }]);
    component.mappings.set({ 'header1': 'target' });
    
    fixture.detectChanges();
    component.submitMappings();
    
    expect(mapperServiceSpy.confirmMapping).toHaveBeenCalledWith('test-job-id', { 'header1': 'target' }, 'HR_ROSTER');
  });
});
