import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.html',
  styleUrl: './upload.scss'
})
export class Upload {
  private apiService = inject(ApiService);

  selectedFile = signal<File | null>(null);
  uploading = signal(false);
  uploadProgress = signal(0);
  message = signal<string | null>(null);
  messageType = signal<'success' | 'error' | null>(null);
  isDragging = signal(false);
  preview = signal<string[]>([]);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  handleFile(file: File) {
    // Validate file
    const maxSize = 100 * 1024 * 1024; // 100 MB
    const allowedTypes = ['.csv', '.json', '.txt', '.log', '.jsonl', '.ndjson'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (file.size > maxSize) {
      this.showMessage('File size exceeds 100 MB limit', 'error');
      return;
    }

    if (!allowedTypes.includes(extension) && !file.name.match(/\.(csv|json|txt|log|jsonl|ndjson)$/i)) {
      this.showMessage(`Invalid file type. Allowed: CSV, JSON, JSONL, TXT, LOG`, 'error');
      return;
    }

    this.selectedFile.set(file);
    this.message.set(null);
    this.messageType.set(null);
    this.previewFile(file);
  }

  previewFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        // Validate file content based on type
        const validationResult = this.validateFileContent(content, extension);
        
        if (!validationResult.valid) {
          this.showMessage(validationResult.error || 'Invalid file format', 'error');
          this.selectedFile.set(null);
          this.preview.set([]);
          return;
        }
        
        // Show preview (first 10 lines)
        const lines = content.split('\n').slice(0, 10).filter(line => line.trim() !== '');
        this.preview.set(lines);
        
        if (validationResult.warning) {
          console.warn('File warning:', validationResult.warning);
        }
        
      } catch (error) {
        console.error('Preview error:', error);
        this.showMessage('Error reading file', 'error');
        this.selectedFile.set(null);
        this.preview.set([]);
      }
    };
    reader.readAsText(file);
  }

  validateFileContent(content: string, extension: string): { valid: boolean; error?: string; warning?: string } {
    if (!content || content.trim() === '') {
      return { valid: false, error: 'File is empty' };
    }

    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      return { valid: false, error: 'No valid content found in file' };
    }

    switch (extension) {
      case '.json':
        // Try to parse as standard JSON first
        try {
          JSON.parse(content);
          return { valid: true };
        } catch (e) {
          // If standard JSON fails, check if it's JSONL (JSON Lines format)
          const jsonLines = lines.filter(l => l.trim());
          if (jsonLines.length > 1) {
            // Try to parse each line as JSON
            let allLinesValid = true;
            let invalidLines: number[] = [];
            
            jsonLines.forEach((line, index) => {
              try {
                JSON.parse(line);
              } catch (err) {
                allLinesValid = false;
                invalidLines.push(index + 1);
              }
            });

            if (allLinesValid) {
              return { 
                valid: true, 
                warning: `Detected JSONL format (${jsonLines.length} objects). Consider renaming to .jsonl extension.` 
              };
            } else if (invalidLines.length > 0) {
              return {
                valid: false,
                error: `Invalid JSON. Not a valid single JSON object, and lines ${invalidLines.slice(0, 3).join(', ')} are not valid JSON either.`
              };
            }
          }
          
          return { 
            valid: false, 
            error: `Invalid JSON syntax: ${e instanceof Error ? e.message : 'Parse error'}` 
          };
        }

      case '.jsonl':
      case '.ndjson':
        // Validate JSONL: each line must be valid JSON
        let invalidLines: number[] = [];
        lines.forEach((line, index) => {
          try {
            JSON.parse(line);
          } catch (e) {
            invalidLines.push(index + 1);
          }
        });

        if (invalidLines.length > 0) {
          return {
            valid: false,
            error: `Invalid JSON at line(s): ${invalidLines.slice(0, 5).join(', ')}${invalidLines.length > 5 ? '...' : ''}`
          };
        }
        return { valid: true };

      case '.csv':
        // Validate CSV: check column consistency
        const csvLines = lines.filter(l => l.trim());
        if (csvLines.length < 2) {
          return { valid: false, error: 'CSV file must have at least a header and one data row' };
        }

        const headerColumns = csvLines[0].split(',').length;
        const inconsistentLines: number[] = [];

        csvLines.forEach((line, index) => {
          const columns = line.split(',').length;
          if (columns !== headerColumns) {
            inconsistentLines.push(index + 1);
          }
        });

        if (inconsistentLines.length > 0) {
          return {
            valid: false,
            error: `Inconsistent column count at line(s): ${inconsistentLines.slice(0, 5).join(', ')}`
          };
        }

        return { 
          valid: true,
          warning: `CSV detected with ${headerColumns} columns`
        };

      case '.txt':
      case '.log':
        // No strict validation for TXT/LOG files
        return { 
          valid: true,
          warning: `Plain text file with ${lines.length} lines`
        };

      default:
        return { valid: true };
    }
  }

  uploadFile() {
    const file = this.selectedFile();
    if (!file) {
      this.showMessage('Please select a file first', 'error');
      return;
    }

    this.uploading.set(true);
    this.uploadProgress.set(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      const currentProgress = this.uploadProgress();
      if (currentProgress < 90) {
        this.uploadProgress.set(currentProgress + 10);
      }
    }, 200);

    // Real API call to backend
    this.apiService.uploadFile(file).subscribe({
      next: (response) => {
        clearInterval(progressInterval);
        this.uploadProgress.set(100);
        this.uploading.set(false);
        this.showMessage(response.message || 'File uploaded successfully!', 'success');
        
        setTimeout(() => {
          this.resetForm();
        }, 3000);
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.uploading.set(false);
        this.uploadProgress.set(0);
        this.showMessage(error.error?.message || 'Upload failed. Please try again.', 'error');
      }
    });
  }

  showMessage(text: string, type: 'success' | 'error') {
    this.message.set(text);
    this.messageType.set(type);
  }

  resetForm() {
    this.selectedFile.set(null);
    this.message.set(null);
    this.messageType.set(null);
    this.uploadProgress.set(0);
    this.preview.set([]);
  }
}
