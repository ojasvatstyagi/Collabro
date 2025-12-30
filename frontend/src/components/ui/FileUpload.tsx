import React, { useRef, useState } from "react";
import { Upload, Camera, X } from "lucide-react";
import { cn } from "../../utils/cn";

interface FileUploadProps {
  user?: any;
  currentImage?: string;
  onImageChange: (file: File | null) => void;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  user,
  currentImage,
  onImageChange,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [preview]);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setImageError(false);
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
    setImageError(false);
  };

  return (
    <div className={cn("relative group rounded-full", className)}>
      <div
        className={cn(
          "relative h-full w-full cursor-pointer overflow-hidden rounded-full transition-all flex items-center justify-center",
          (!preview || imageError) && "border-2 border-dashed",
          (!preview || imageError) && (isDragging
            ? "border-brand-orange bg-brand-orange/10"
            : "border-gray-300 hover:border-brand-orange dark:border-gray-600 dark:hover:border-brand-orange"),
          (preview && !imageError) && "border-0"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview && !imageError ? (
          <>
            <img
              src={preview}
              alt="Profile"
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-8 w-8 text-white/90" />
            </div>
          </>
        ) : preview && imageError ? (
          // Fallback for broken image but we have a preview URL/state
          <div className="flex h-full w-full items-center justify-center bg-brand-orange/10 text-brand-orange">
            <span className="text-4xl font-bold">
              {user?.firstname?.[0] || user?.username?.[0] || "?"}
            </span>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-8 w-8 text-white/90" />
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-gray-400 hover:text-brand-orange transition-colors">
            <Upload className="h-6 w-6 mb-1" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-center px-2">Upload</span>
          </div>
        )}
      </div>

      {preview && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeImage();
          }}
          className="absolute 0 top-0 right-0 z-10 rounded-full bg-white p-1.5 text-red-500 shadow-sm border border-gray-100 hover:bg-gray-50 dark:bg-brand-dark-light dark:border-gray-700 dark:text-red-400 transition-transform hover:scale-110"
          title="Remove image"
        >
          <X className="h-3 w-3" />
        </button>
      )}

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