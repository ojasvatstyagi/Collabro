import React, { useRef, useState } from "react";
import { Upload, Camera, X } from "lucide-react";
import { cn } from "../../utils/cn";

interface FileUploadProps {
  currentImage?: string;
  onImageChange: (file: File | null) => void;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  currentImage,
  onImageChange,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageChange(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeImage = () => {
    setPreview(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "relative h-32 w-32 cursor-pointer overflow-hidden rounded-full border-2 border-dashed transition-all",
          isDragging
            ? "border-brand-orange bg-brand-orange/10"
            : "border-gray-300 hover:border-brand-orange dark:border-gray-600 dark:hover:border-brand-orange"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Profile preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
              className="absolute -right-2 -top-2 rounded-full bg-brand-red p-1 text-white shadow-md hover:bg-brand-red/80"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
            <Upload className="h-8 w-8 mb-2" />
            <span className="text-xs text-center">Upload Photo</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default FileUpload;