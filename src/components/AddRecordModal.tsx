import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from './ui/dialog';
import { Heart } from 'lucide-react';
import ContributionForm from './ContributionForm';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function AddRecordModal({ isOpen, onClose, userId }: AddRecordModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] p-0 overflow-y-auto max-h-[90vh] sm:max-h-none border-none sm:rounded-[2.5rem] shadow-ambient bg-surface-container-lowest">
        <div className="primary-gradient p-8 text-on-primary relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
              <Heart className="w-7 h-7 fill-on-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black headline-font tracking-tight">Financial Covenant</DialogTitle>
              <DialogDescription className="text-on-primary/70 font-medium">Codify a new act of transformative impact.</DialogDescription>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="p-6 sm:p-10 bg-surface-container-lowest">
          <ContributionForm 
            userId={userId} 
            onSuccess={onClose} 
            onCancel={onClose} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
