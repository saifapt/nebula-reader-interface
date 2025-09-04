import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
import { usePDFs } from '@/hooks/usePDFs';
import { PDFUploadConfirmation } from './PDFUploadConfirmation';

interface PDFUploadButtonProps {
  onPDFUploaded: (pdfData: any) => void;
  className?: string;
}

export const PDFUploadButton = ({ onPDFUploaded, className }: PDFUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadPDF, loading } = usePDFs();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      return;
    }

    setSelectedFile(file);
    setShowConfirmation(true);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    const result = await uploadPDF(selectedFile);
    if (result) {
      // Pass only the PDF metadata, not the file object
      onPDFUploaded(result);
    }

    // Reset input and state
    setSelectedFile(null);
    setShowConfirmation(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setShowConfirmation(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        onClick={handleClick}
        disabled={loading}
        className={`${className} relative z-[100]`}
        variant="outline"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 mr-2 border-2 border-t-transparent border-current rounded-full animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload PDF
          </>
        )}
      </Button>

      <PDFUploadConfirmation
        isOpen={showConfirmation}
        onClose={handleCancelUpload}
        onConfirm={handleConfirmUpload}
        fileName={selectedFile?.name || ''}
        isUploading={loading}
      />
    </>
  );
};