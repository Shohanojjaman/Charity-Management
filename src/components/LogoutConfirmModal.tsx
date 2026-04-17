import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut, AlertTriangle } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-8 bg-surface-container-lowest dark:bg-surface-container-low border-surface-container-high dark:border-surface-container-low">
        <DialogHeader className="items-center text-center space-y-4">
          <div className="w-16 h-16 bg-error-container/20 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-error" />
          </div>
          <DialogTitle className="text-2xl font-black headline-font text-on-surface tracking-tight">
            Terminate Session?
          </DialogTitle>
          <DialogDescription className="text-on-surface-variant font-medium">
            Are you sure you want to log out of the Altruist Sanctuary? You will need to sign in again to manage your stewardship.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col gap-3 mt-6">
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            className="w-full py-6 rounded-2xl font-black headline-font text-sm uppercase tracking-widest shadow-lg shadow-error/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            confirm logout
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full py-6 rounded-2xl font-black headline-font text-sm uppercase tracking-widest hover:bg-surface-container-high/50 dark:hover:bg-surface-container-high/20"
          >
            Stay Signed In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
