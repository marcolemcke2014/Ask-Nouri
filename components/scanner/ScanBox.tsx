/**
 * Scanner viewfinder component
 */
import React, { useCallback, useState } from 'react';
import { Camera, Upload } from 'lucide-react';

type ScanBoxProps = {
  onCapture: () => void;
  onUpload: (file: File) => void;
  isScanning?: boolean;
  height?: 'small' | 'medium' | 'large';
};

export default function ScanBox({
  onCapture,
  onUpload,
  isScanning = false,
  height = 'medium'
}: ScanBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const heightClass = {
    small: 'aspect-[4/3]',
    medium: 'aspect-square',
    large: 'aspect-[3/4]'
  }[height];
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  }, [onUpload]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  }, [onUpload]);
  
  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="flex-1 w-full flex items-center justify-center">
      <div 
        className={`relative w-[85%] max-w-[500px] ${heightClass} scan-box border-2 border-dashed ${isDragging ? 'border-primary bg-primary/10' : 'border-transparent'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Scan frame with corner elements */}
        <div 
          className="w-full h-full relative"
          onClick={onCapture}
          aria-label="Scan area"
          role="button"
          tabIndex={0}
        >
          {/* Top-left corner */}
          <div className="absolute top-0 left-0 z-10">
            <div className="h-[60px] w-[4px] bg-primary"></div>
            <div className="absolute top-0 left-0 h-[4px] w-[60px] bg-primary"></div>
          </div>
          
          {/* Top-right corner */}
          <div className="absolute top-0 right-0 z-10">
            <div className="h-[60px] w-[4px] bg-primary absolute right-0"></div>
            <div className="absolute top-0 right-0 h-[4px] w-[60px] bg-primary"></div>
          </div>
          
          {/* Bottom-left corner */}
          <div className="absolute bottom-0 left-0 z-10">
            <div className="h-[60px] w-[4px] bg-primary"></div>
            <div className="absolute bottom-0 left-0 h-[4px] w-[60px] bg-primary"></div>
          </div>
          
          {/* Bottom-right corner */}
          <div className="absolute bottom-0 right-0 z-10">
            <div className="h-[60px] w-[4px] bg-primary absolute right-0"></div>
            <div className="absolute bottom-0 right-0 h-[4px] w-[60px] bg-primary"></div>
          </div>
          
          {/* Moving scan line */}
          {isScanning && (
            <div className="scanner-line animate-scan-line"></div>
          )}
          
          {/* Overlay when dragging */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center z-20">
              <Upload className="h-12 w-12 text-primary" />
            </div>
          )}
          
          {/* Help text */}
          <div className="absolute bottom-5 left-0 right-0 text-center text-xs text-muted-foreground flex flex-col items-center gap-1">
            <Camera className="h-5 w-5" />
            <span>Tap to scan or drag an image</span>
          </div>
        </div>
        
        {/* Hidden file input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
        
        {/* Upload button */}
        <button 
          className="absolute bottom-0 right-0 mb-4 mr-4 p-2 bg-primary text-primary-foreground rounded-full shadow z-20"
          onClick={triggerFileUpload}
          aria-label="Upload image"
        >
          <Upload className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
} 