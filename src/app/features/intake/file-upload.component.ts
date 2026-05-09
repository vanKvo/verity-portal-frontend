import { Component, signal, output, input, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { SharedMapperService } from './services/shared-mapper.service';
import { UploadResponse } from './models/intake.models';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  private mapperService = inject(SharedMapperService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  label = input<string>('Drag and drop file here or click to browse');
  allowedExtensions = input<string[]>(['.csv', '.xlsx', '.xls']);

  onUploadSuccess = output<UploadResponse>();
  onUploadError = output<string>();

  isDragging = signal(false);
  isUploading = signal(false);
  errorMessage = signal('');

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.onFileSelected(files[0]);
    }
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelectedFromInput(event: Event) {
    const element = event.target as HTMLInputElement;
    const files = element.files;
    if (files && files.length > 0) {
      this.onFileSelected(files[0]);
    }
  }

  private onFileSelected(file: File) {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!this.allowedExtensions().includes(ext)) {
      this.errorMessage.set(`Invalid file extension. Allowed: ${this.allowedExtensions().join(', ')}`);
      return;
    }
    this.uploadFile(file);
  }

  uploadFile(file: File) {
    this.errorMessage.set('');
    this.isUploading.set(true);

    const jobId = crypto.randomUUID();

    this.mapperService.uploadFile(file, jobId)
      .subscribe({
        next: (res) => {
          this.isUploading.set(false);
          this.onUploadSuccess.emit(res);
        },
        error: (err) => {
          this.isUploading.set(false);
          const msg = err.error?.detail || 'Upload failed. Please try again.';
          this.errorMessage.set(msg);
          this.onUploadError.emit(msg);
        }
      });
  }
}
