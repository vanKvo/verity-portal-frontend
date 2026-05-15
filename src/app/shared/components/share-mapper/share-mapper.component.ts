import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

export interface TargetAttribute {
  key: string;
  label: string;
  required: boolean;
}

@Component({
  selector: 'app-share-mapper',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './share-mapper.component.html',
  styleUrl: './share-mapper.component.css'
})
export class ShareMapperComponent implements OnInit {
  @Input() headers: string[] = [];
  @Input() targetAttributes: TargetAttribute[] = [];
  @Output() mapped = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  mapping: { [key: string]: string } = {};

  ngOnInit() {
    // Attempt auto-mapping based on name similarity
    this.targetAttributes.forEach(attr => {
      const match = this.headers.find(h =>
        h.toLowerCase() === attr.key.toLowerCase() ||
        h.toLowerCase() === attr.label.toLowerCase()
      );
      this.mapping[attr.key] = match || '';
    });
  }

  onMappingChange() {
    // Optional: real-time validation or feedback
  }

  isMappingValid(): boolean {
    return this.targetAttributes
      .filter(attr => attr.required)
      .every(attr => !!this.mapping[attr.key]);
  }

  confirmMapping() {
    this.mapped.emit(this.mapping);
  }

  cancel() {
    this.cancelled.emit();
  }
}
