import { Component, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';

export interface SchemaField {
  field: string;
  description: string;
  required: boolean;
}

@Component({
  selector: 'app-shared-mapper',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './shared-mapper.component.html',
  styleUrl: './shared-mapper.component.css'
})
export class SharedMapperComponent {
  private http = inject(HttpClient);
  
  // Inputs/Signals
  jobId = input.required<string>();
  requiredSchema = input<SchemaField[]>([]);
  headers = signal<string[]>([]);
  suggestions = signal<any[]>([]); // Suggestions from backend
  
  // The current mappings: { original_header: target_field }
  mappings = signal<Record<string, string>>({});
  
  // Available target fields for the current schema
  targetFields = computed(() => this.requiredSchema().map(f => f.field));

  // Check if all required fields are mapped
  missingRequiredFields = computed(() => {
    const currentMappedTargets = Object.values(this.mappings());
    return this.requiredSchema()
      .filter(f => f.required && !currentMappedTargets.includes(f.field))
      .map(f => f.field);
  });

  isReady = computed(() => this.missingRequiredFields().length === 0);

  applyAutofill() {
    const newMappings: Record<string, string> = { ...this.mappings() };
    this.suggestions().forEach(s => {
      if (s.confidence > 70) {
        newMappings[s.header] = s.target;
      }
    });
    this.mappings.set(newMappings);
  }

  updateMapping(header: string, target: string) {
    this.mappings.update(prev => ({ ...prev, [header]: target }));
  }

  isRequired(field: string): boolean {
    return this.requiredSchema().find(f => f.field === field)?.required ?? false;
  }

  submitMappings() {
    if (!this.isReady()) return;
    
    this.http.post(`http://localhost:8000/intake/confirm/${this.jobId()}`, this.mappings())
      .subscribe({
        next: (res) => console.log('Mapping confirmed', res),
        error: (err) => console.error('Mapping failed', err)
      });
  }
}
