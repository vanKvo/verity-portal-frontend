import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedMapperComponent } from './shared-mapper.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('SharedMapperComponent', () => {
  let component: SharedMapperComponent;
  let fixture: ComponentFixture<SharedMapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedMapperComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
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
    // Set signal values
    component.headers.set(['Emp Name', 'Status']);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const selects = compiled.querySelectorAll('mat-select');
    expect(selects.length).toBe(2);
  });

  it('should update mappings signal on selection', () => {
    component.headers.set(['Emp Name']);
    fixture.detectChanges();

    component.updateMapping('Emp Name', 'employee_name');
    expect(component.mappings()['Emp Name']).toBe('employee_name');
  });

  it('should display visual indicators for required fields', async () => {
    component.requiredSchema.set([
      { field: 'employee_id', description: 'ID', required: true }
    ]);
    component.headers.set(['Emp ID']);
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
    component.headers.set(['Emp ID', 'Dept']);
    component.requiredSchema.set([
      { field: 'employee_id', description: 'ID', required: true }
    ]);
    
    // Mock suggestions from backend
    component.suggestions.set([
      { header: 'Emp ID', target: 'employee_id', confidence: 85 },
      { header: 'Dept', target: 'department', confidence: 50 }
    ]);

    component.applyAutofill();
    
    expect(component.mappings()['Emp ID']).toBe('employee_id');
    expect(component.mappings()['Dept']).toBeUndefined();
  });

  it('should display manual mapping prompt if required fields are missing', () => {
    component.headers.set(['Emp ID']); // Need headers to show prompt
    component.requiredSchema.set([
      { field: 'employee_id', description: 'ID', required: true }
    ]);
    component.mappings.set({}); // No mappings
    
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const prompt = compiled.querySelector('.manual-mapping-prompt');
    expect(prompt?.textContent).toContain('Some required fields could not be matched automatically');
  });
});
