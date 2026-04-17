import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Target } from '../App';
import { 
  Target as TargetIcon, 
  Calendar, 
  Coins, 
  AlertCircle, 
  Plus,
  Flag,
  Trash2
} from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, Timestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import { Badge } from './ui/badge';

interface TargetManagerProps {
  activeTarget: Target | null;
  userId: string;
}

export default function TargetManager({ activeTarget, userId }: TargetManagerProps) {
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTarget) {
      alert("You already have an active target. Please complete it before creating a new one.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'targets'), {
        targetAmount: parseFloat(targetAmount),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        status: 'active',
        userId,
        createdAt: Timestamp.now()
      });
      setTargetAmount('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'targets');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteTarget = async () => {
    if (!activeTarget) return;
    try {
      await updateDoc(doc(db, 'targets', activeTarget.id), {
        status: 'completed'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'targets');
    }
  };

  const handleRemoveTarget = async () => {
    if (!activeTarget) return;
    
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'targets', activeTarget.id));
      setShowDeleteConfirm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'targets');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black tracking-tight text-on-surface headline-font">Target Management</h2>
        <p className="text-on-surface-variant text-lg max-w-2xl mx-auto font-medium">
          Define your impact goals. Set clear financial targets to stay motivated and track your charitable growth.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Active Target Status */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-on-surface headline-font flex items-center gap-2 px-2">
            <TargetIcon className="w-5 h-5 text-primary" />
            Current Status
          </h3>
          
          {activeTarget ? (
            <Card className="border-none shadow-ambient bg-surface-container-low p-6 sm:p-10 rounded-[2rem] relative overflow-hidden">
              <div className="relative z-10 space-y-10">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <Badge className="primary-gradient text-on-primary px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] border-none shadow-sm">
                    Active Goal
                  </Badge>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5 opacity-60">Target Amount</p>
                    <p className="text-3xl sm:text-4xl font-black text-on-surface headline-font tracking-tight">৳{activeTarget.targetAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-5 text-on-surface-variant bg-surface-container-lowest/40 p-4 rounded-2xl">
                    <Calendar className="w-6 h-6 text-primary" />
                    <div className="text-sm font-extrabold tracking-tight">
                      {format(new Date(activeTarget.startDate), 'MMM dd, yyyy')} — {format(new Date(activeTarget.endDate), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="flex items-center gap-5 text-on-surface-variant bg-surface-container-lowest/40 p-4 rounded-2xl">
                    <Flag className="w-6 h-6 text-secondary" />
                    <div className="text-sm font-extrabold tracking-tight">
                      Ends in <span className="text-on-surface">{Math.ceil((new Date(activeTarget.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}</span> days
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {showDeleteConfirm ? (
                    <div className="flex-1 flex gap-3">
                      <Button 
                        onClick={handleRemoveTarget}
                        disabled={isSubmitting}
                        className="flex-1 py-8 rounded-2xl font-black headline-font text-[10px] uppercase tracking-widest bg-error text-on-error hover:bg-error/90 transition-all shadow-ambient"
                      >
                        Confirm Decimation
                      </Button>
                      <Button 
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isSubmitting}
                        variant="ghost"
                        className="py-8 px-6 rounded-2xl font-black headline-font text-[10px] uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-all"
                      >
                        Abort
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button 
                        onClick={handleCompleteTarget}
                        className="flex-1 py-8 rounded-2xl font-black headline-font text-sm uppercase tracking-widest bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-all shadow-sm"
                      >
                        Mark as Completed
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="py-8 px-6 rounded-2xl font-black headline-font text-sm uppercase tracking-widest text-error hover:bg-error/10 transition-all border border-error/20"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            </Card>
          ) : (
            <Card className="border-2 border-dashed border-surface-variant/20 p-16 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-6 bg-surface-container-low/20">
              <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center shadow-inner">
                <AlertCircle className="w-10 h-10 text-on-surface-variant/20" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-extrabold text-on-surface headline-font tracking-tight">No Active Target</p>
                <p className="text-on-surface-variant text-sm font-medium max-w-[200px] mx-auto">Ready to initialize a new goal for your charitable journey?</p>
              </div>
            </Card>
          )}
        </div>

        {/* Create New Target Form */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-on-surface headline-font flex items-center gap-2">
            <Plus className="w-5 h-5 text-secondary" />
            New Target
          </h3>

          <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-6 sm:p-10 rounded-[2.5rem] shadow-ambient space-y-8">
            <div className="space-y-3">
              <Label htmlFor="targetAmount" className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant px-1 opacity-60">Amount to Steward (৳)</Label>
              <div className="relative group">
                <Coins className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-on-surface-variant/30 group-focus-within:text-primary transition-colors" />
                <Input
                  id="targetAmount"
                  type="number"
                  placeholder="0.00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  disabled={!!activeTarget}
                  className="pl-16 py-10 rounded-3xl bg-surface-container-low border-none focus:bg-surface-bright focus:ring-4 focus:ring-primary/5 transition-all font-black text-2xl headline-font disabled:opacity-30"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="startDate" className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant px-1 opacity-60">Start Chronology</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!!activeTarget}
                  className="py-10 rounded-2xl bg-surface-container-low border-none focus:bg-surface-bright focus:ring-4 focus:ring-primary/5 transition-all font-extrabold disabled:opacity-30"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="endDate" className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant px-1 opacity-60">End Chronology</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!!activeTarget}
                  className="py-10 rounded-2xl bg-surface-container-low border-none focus:bg-surface-bright focus:ring-4 focus:ring-primary/5 transition-all font-extrabold disabled:opacity-30"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || !!activeTarget}
              className="w-full py-10 rounded-2xl font-black headline-font text-base uppercase tracking-[0.2em] primary-gradient text-on-primary shadow-ambient transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
            >
              {isSubmitting ? 'Initializing...' : activeTarget ? 'Target Locked' : 'Initialize Target'}
            </Button>

            {activeTarget && (
              <p className="text-[10px] text-center text-error font-black uppercase tracking-widest bg-error-container/10 p-5 rounded-xl border border-error/5">
                Complete active target to unlock new goals.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
