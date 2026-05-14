import { Component, signal, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SharedMapperService } from './services/shared-mapper.service';
import { IntakeSuggestion, ConfirmMappingResponse } from './models/intake.models';

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
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './shared-mapper.component.html',
  styleUrl: './shared-mapper.component.css'
})
export class SharedMapperComponent {
  private mapperService = inject(SharedMapperService);

  // Inputs/Signals
  jobId = input.required<string>();
  schemaType = input<string>();
  requiredSchema = input<SchemaField[]>([]);
  headers = input<string[]>([]);
  suggestions = input<IntakeSuggestion[]>([]); // Suggestions from backend

  // Outputs
  onConfirm = output<ConfirmMappingResponse>();

  // The current mappings: { original_header: target_field }
  mappings = signal<Record<string, string>>({});
  isProcessing = signal(false);

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

  /**
   * Returns system attributes that are not yet assigned to other headers.
   * This prevents double-mapping of the same system field.
   */
  getAvailableOptions(currentHeader: string): string[] {
    const allTargets = this.targetFields();
    const currentMappings = this.mappings();

    // Find all targets assigned to headers OTHER than the one we are currently looking at
    const otherAssignedTargets = Object.entries(currentMappings)
      .filter(([header, target]) => header !== currentHeader && target)
      .map(([_, target]) => target);

    return allTargets.filter(target => !otherAssignedTargets.includes(target));
  }

  submitMappings() {
    if (!this.isReady() || this.isProcessing()) return;

    this.isProcessing.set(true);
    this.mapperService.confirmMapping(this.jobId(), this.mappings(), this.schemaType())
      .subscribe({
        next: (res) => {
          this.isProcessing.set(false);
          this.onConfirm.emit(res);
        },
        error: (err) => {
          this.isProcessing.set(false);
          console.error('Data mapping failed', err);
        }
      });
  }
}
