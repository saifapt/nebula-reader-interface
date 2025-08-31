import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
import { usePDFs } from '@/hooks/usePDFs';

interface PDFUploadButtonProps {
  onPDFUploaded: (pdfData: any) => void;
  className?: string;
}

export const PDFUploadButton = ({ onPDFUploaded, className }: PDFUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadPDF, loading } = usePDFs();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      return;
    }

    const result = await uploadPDF(file);
    if (result) {
      onPDFUploaded({ ...result, file });
    }

    // Reset input
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
        className={className}
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
    </>
  );
};