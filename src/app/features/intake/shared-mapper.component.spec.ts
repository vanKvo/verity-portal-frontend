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
});
