import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Upload, X } from 'lucide-react';

interface PDFUploadConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
  isUploading: boolean;
}

export const PDFUploadConfirmation = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  fileName, 
  isUploading 
}: PDFUploadConfirmationProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Confirm PDF Upload
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to upload this PDF file?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-3 p-4 bg-surface-light rounded-lg border border-border">
          <FileText className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <p className="font-medium text-sm">{fileName}</p>
            <p className="text-xs text-muted-foreground">PDF Document</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isUploading}
            className="bg-primary hover:bg-primary/90"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-t-transparent border-current rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Confirm Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};