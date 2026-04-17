import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { DollarSign, Calendar, FileText, Sparkles, Building2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface ContributionFormProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ContributionForm({ userId, onSuccess, onCancel }: ContributionFormProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verified, setVerified] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !date) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'charity_records'), {
        title,
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        note,
        userId,
        verified,
        recipientId: 'general',
        category: 'General',
        createdAt: Timestamp.now()
      });
      setTitle('');
      setAmount('');
      setNote('');
      if (onSuccess) onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'charity_records');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Amount Display */}
      <div className="text-center space-y-2 mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-60">Contribution Magnitude</p>
        <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-black headline-font text-primary/40">৳</span>
            <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,000"
                className="w-48 bg-transparent border-none text-6xl font-black headline-font text-on-surface placeholder:text-on-surface-variant/20 focus:ring-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
            />
        </div>
      </div>

      <div className="space-y-6">
        {/* Cause / Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant px-1">Initiative / Cause</Label>
          <div className="relative group">
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40 transition-colors group-focus-within:text-primary" />
            <Input
              id="title"
              placeholder="e.g. Community Food Bank"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="pl-12 py-7 rounded-2xl bg-surface-container-low border-none focus:bg-surface-bright focus:ring-4 focus:ring-primary/5 transition-all font-bold text-on-surface"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant px-1">Chronology Date</Label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40 pointer-events-none transition-colors group-focus-within:text-primary" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-12 py-7 rounded-2xl bg-surface-container-low border-none focus:bg-surface-bright focus:ring-4 focus:ring-primary/5 transition-all font-bold text-on-surface"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant px-1">Verification Status</Label>
              <button 
                type="button"
                onClick={() => setVerified(!verified)}
                className="w-full bg-surface-container-low py-7 px-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-surface-container-high transition-colors"
              >
                <span className={cn("text-xs font-black tracking-widest uppercase transition-colors", verified ? "text-primary" : "text-on-surface/50")}>
                    {verified ? 'Certified Record' : 'Unverified Intent'}
                </span>
                <div className={cn("w-10 h-6 rounded-full relative p-1 transition-all duration-300", verified ? "bg-primary" : "bg-surface-container-high border border-on-surface/10")}>
                    <motion.div 
                        animate={{ x: verified ? 16 : 0 }}
                        className="w-4 h-4 bg-white rounded-full shadow-sm" 
                    />
                </div>
              </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note" className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant px-1">Context Notes</Label>
          <div className="relative group">
            <FileText className="absolute left-4 top-4 w-5 h-5 text-on-surface-variant/40 transition-colors group-focus-within:text-primary" />
            <Textarea
              id="note"
              placeholder="Record the purpose and resonance of this gift..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="pl-12 pt-4 min-h-[120px] rounded-3xl bg-surface-container-low border-none focus:bg-surface-bright focus:ring-4 focus:ring-primary/5 transition-all font-medium text-on-surface"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 space-y-4">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full primary-gradient text-on-primary py-10 rounded-[2rem] font-black headline-font text-lg uppercase tracking-[0.3em] shadow-ambient transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting ? 'Architecting Pact...' : 'Commit to Record'}
        </Button>
        {onCancel && (
            <Button 
                type="button" 
                variant="ghost" 
                onClick={onCancel}
                className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high"
            >
                Archive Intent
            </Button>
        )}
      </div>
    </form>
  );
}
