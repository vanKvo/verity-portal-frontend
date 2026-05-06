import { Component, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';

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
  headers = signal<string[]>([]);
  suggestions = signal<any[]>([]); // Suggestions from backend
  
  // The current mappings: { original_header: target_field }
  mappings = signal<Record<string, string>>({});
  
  // Available target fields for the current schema
  targetFields = signal<string[]>([
    'first_name', 'last_name', 'email', 'citizenship', 'role', 'project_id', 'clearance_level'
  ]);

  // Check if all required fields are mapped (mock logic for now)
  isReady = computed(() => {
    const currentMappings = Object.values(this.mappings());
    return currentMappings.includes('first_name') && currentMappings.includes('last_name');
  });

  updateMapping(header: string, target: string) {
    this.mappings.update(prev => ({ ...prev, [header]: target }));
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
