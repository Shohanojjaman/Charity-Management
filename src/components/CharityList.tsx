import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  ArrowDown,
  Calendar,
  Calendar as CalendarIcon,
  PlusCircle,
  TrendingUp,
  Target as TargetIcon,
  GraduationCap,
  Activity,
  Droplets
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { CharityRecord, Target } from '../App';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { startOfMonth, subMonths, isSameMonth } from 'date-fns';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { Trash2, AlertCircle, FileJson, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CharityListProps {
  records: CharityRecord[];
  activeTarget: Target | null;
}

type SortKey = 'date' | 'title' | 'amount' | 'category';
interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

export default function CharityList({ records, activeTarget }: CharityListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 5;

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const filteredRecords = records
    .filter(record => 
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.note?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      
      const multiplier = sortConfig.direction === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * multiplier;
      }
      
      return ((aValue as number) - (bValue as number)) * multiplier;
    });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  const periodTotal = records.reduce((acc, r) => acc + r.amount, 0);

  const handleDeleteRecord = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'charity_records', id));
      setRecordToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `charity_records/${id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Title', 'Amount', 'Category', 'Note', 'Verified'];
    const csvContent = [
      headers.join(','),
      ...records.map(r => [
        format(new Date(r.date), 'yyyy-MM-dd HH:mm'),
        `"${r.title.replace(/"/g, '""')}"`,
        r.amount,
        `"${(r.category || 'General').replace(/"/g, '""')}"`,
        `"${(r.note || '').replace(/"/g, '""')}"`,
        r.verified ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ledger_export_${format(new Date(), 'yyyy_MM_dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Stewardship Master Ledger', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on ${format(new Date(), 'PPpp')}`, 14, 30);
    
    const tableData = records.map(r => [
      format(new Date(r.date), 'MMM dd, yyyy'),
      r.title,
      r.category || 'General',
      `৳${r.amount.toLocaleString()}`,
      r.verified ? 'Verified' : 'Pending'
    ]);

    autoTable(doc, {
      head: [['Date', 'Initiative', 'Class', 'Magnitude', 'Status']],
      body: tableData,
      startY: 40,
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [73, 85, 179] }
    });

    doc.save(`stewardship_report_${format(new Date(), 'yyyy_MM_dd')}.pdf`);
  };

  // Chart Data Integration
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const date = startOfMonth(subMonths(new Date(), 5 - i));
    const amount = records
      .filter(r => isSameMonth(new Date(r.date), date))
      .reduce((acc, r) => acc + r.amount, 0);
    return {
      name: format(date, 'MMM'),
      amount
    };
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="max-w-xl">
          <nav className="flex text-[10px] font-black text-on-surface-variant mb-4 tracking-[0.2em] uppercase gap-2">
            <span>Archives</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Ledger</span>
          </nav>
          <h2 className="text-3xl lg:text-4xl font-black headline-font text-on-surface tracking-tight mb-4">Financial history.</h2>
          <p className="text-on-surface-variant text-sm lg:text-lg leading-relaxed font-medium">
            A comprehensive record of active stewardship and contribution trends.
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="w-full lg:w-auto bg-surface-container-lowest p-6 lg:p-8 rounded-[2rem] shadow-ambient flex flex-col sm:flex-row gap-6 lg:gap-10 items-center justify-center">
          <div className="text-center w-full sm:w-auto">
            <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant mb-2 font-black opacity-50">Period Total</p>
            <p className="text-3xl lg:text-4xl font-black headline-font text-primary">৳{periodTotal.toLocaleString()}</p>
          </div>
          <div className="hidden sm:block w-px h-12 bg-surface-container-low"></div>
          <div className="flex gap-8 w-full sm:w-auto justify-center">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant mb-2 font-black opacity-50">Growth</p>
              <p className="text-lg lg:text-xl font-black headline-font text-secondary">--</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant mb-2 font-black opacity-50">Records</p>
              <p className="text-lg lg:text-xl font-black headline-font text-on-surface">{records.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Panel */}
      <section className="space-y-6">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search donors or initiatives..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-lowest border-none rounded-[1.5rem] py-6 pl-16 pr-6 shadow-sm focus:ring-4 focus:ring-primary/5 transition-all outline-none font-bold text-on-surface"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide py-2">
          {['All Types', 'Individual', 'Corporate', 'Government', 'Grants'].map((type, i) => (
            <Button 
              key={type}
              variant={i === 0 ? 'default' : 'ghost'}
              className={cn(
                "rounded-full px-6 py-6 font-black text-[10px] uppercase tracking-[0.15em] transition-all whitespace-nowrap",
                i === 0 ? "primary-gradient text-on-primary shadow-ambient" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              {type}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-surface-container-low px-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-on-surface-variant opacity-60">Recent Stewardship</h3>
          <div className="flex items-center gap-4">
            <button 
              onClick={exportToCSV}
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1.5 transition-all active:scale-95"
            >
              <FileJson className="w-3.5 h-3.5" />
              CSV
            </button>
            <button 
              onClick={exportToPDF}
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1.5 transition-all active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>
          </div>
        </div>
      </section>

      {/* Table & List Section */}
      <section className="bg-surface-container-lowest rounded-[2rem] shadow-ambient overflow-hidden">
        {/* Mobile Card List */}
        <div className="lg:hidden p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {currentRecords.length > 0 ? currentRecords.map((record) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={record.id} 
                className="bg-surface-container-low/20 p-5 rounded-3xl flex items-center justify-between group hover:bg-surface-container-low/40 transition-colors relative"
              >
                {recordToDelete === record.id ? (
                  <div className="absolute inset-0 bg-error/95 z-20 rounded-3xl flex items-center justify-between px-6 animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center gap-3 text-on-error">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Confirm Erasure?</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDeleteRecord(record.id)}
                        disabled={isDeleting}
                        className="bg-white/20 hover:bg-white/30 text-white rounded-xl font-black text-[9px] uppercase tracking-widest"
                      >
                        {isDeleting ? '...' : 'Yes'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setRecordToDelete(null)}
                        disabled={isDeleting}
                        className="text-white font-black text-[9px] uppercase tracking-widest"
                      >
                        No
                      </Button>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest text-primary flex items-center justify-center shadow-sm">
                    <span className="font-black text-lg">{record.title[0]}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-on-surface tracking-tight">{record.title}</span>
                    <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-widest opacity-60">
                      {record.category || 'Contribution'} • {format(new Date(record.date), 'MMM dd')}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <span className="text-base font-black text-on-surface headline-font">৳{record.amount.toLocaleString()}</span>
                    {record.verified && <div className="text-[8px] font-black text-primary uppercase tracking-widest mt-0.5 animate-pulse">Certified</div>}
                  </div>
                  <button 
                    onClick={() => setRecordToDelete(record.id)}
                    className="p-2 text-on-surface-variant/40 hover:text-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="py-20 text-center opacity-40">
                <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No discoveries found.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th 
                  className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant cursor-pointer group select-none"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    Chronology
                    <ArrowDown className={cn(
                      "w-3 h-3 text-primary transition-all",
                      sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? 'rotate-180' : 'rotate-0') : "opacity-0 group-hover:opacity-40"
                    )} />
                  </div>
                </th>
                <th 
                  className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant cursor-pointer group select-none"
                  onClick={() => handleSort('title')}
                >
                   <div className="flex items-center gap-1">
                    Entity / Initiative
                    <ArrowDown className={cn(
                        "w-3 h-3 text-primary transition-all",
                        sortConfig.key === 'title' ? (sortConfig.direction === 'asc' ? 'rotate-180' : 'rotate-0') : "opacity-0 group-hover:opacity-40"
                    )} />
                  </div>
                </th>
                <th 
                  className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant cursor-pointer group select-none"
                  onClick={() => handleSort('category')}
                >
                    <div className="flex items-center gap-1">
                        Class
                        <ArrowDown className={cn(
                            "w-3 h-3 text-primary transition-all",
                            sortConfig.key === 'category' ? (sortConfig.direction === 'asc' ? 'rotate-180' : 'rotate-0') : "opacity-0 group-hover:opacity-40"
                        )} />
                    </div>
                </th>
                <th 
                  className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant text-right cursor-pointer group select-none"
                  onClick={() => handleSort('amount')}
                >
                    <div className="flex items-center justify-end gap-1">
                        Magnitude
                        <ArrowDown className={cn(
                            "w-3 h-3 text-primary transition-all",
                            sortConfig.key === 'amount' ? (sortConfig.direction === 'asc' ? 'rotate-180' : 'rotate-0') : "opacity-0 group-hover:opacity-40"
                        )} />
                    </div>
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant">Stewardship</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              <AnimatePresence mode="popLayout">
                {currentRecords.length > 0 ? currentRecords.map((record) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={record.id} 
                    className="hover:bg-surface-container-low/20 transition-colors group relative"
                  >
                    <td className="px-8 py-7 font-extrabold text-on-surface text-sm tracking-tight">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-on-surface text-sm tracking-tight">{record.title}</span>
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60 mt-0.5">{record.note || 'Certified entry'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <Badge variant="secondary" className="bg-surface-container-low text-on-surface-variant px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border-none group-hover:bg-surface-container-lowest transition-colors">
                        {record.category || 'General'}
                      </Badge>
                    </td>
                    <td className="px-8 py-7 text-right font-black text-on-surface text-lg headline-font">
                      ৳{record.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.15em]">
                        <span className={cn(
                          "w-2.5 h-2.5 rounded-full shadow-[0_0_12px_rgba(73,85,179,0.4)]",
                          record.verified ? "bg-primary animate-pulse" : "bg-secondary"
                        )}></span>
                        {record.verified ? 'Verified' : 'Pending Review'}
                      </div>
                    </td>
                    <td className="px-8 py-7 text-right">
                      {recordToDelete === record.id ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            disabled={isDeleting}
                            onClick={() => handleDeleteRecord(record.id)}
                            className="h-8 rounded-lg px-3 font-black text-[9px] uppercase tracking-widest"
                          >
                            {isDeleting ? '...' : 'Confirm'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            disabled={isDeleting}
                            onClick={() => setRecordToDelete(null)}
                            className="h-8 rounded-lg px-3 font-black text-[9px] uppercase tracking-widest text-on-surface-variant"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setRecordToDelete(record.id)}
                          className="p-3 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-error/10 hover:text-error transition-all text-on-surface-variant shadow-sm"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-on-surface-variant font-black uppercase tracking-widest text-xs opacity-60">
                      No contributions discovered in the ledger.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-8 py-8 flex items-center justify-between bg-surface-container-low/10">
          <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">
            Displaying <span className="text-on-surface">{filteredRecords.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredRecords.length)}</span> of <span className="text-on-surface">{filteredRecords.length}</span> contributions
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="w-10 h-10 rounded-xl hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? 'default' : 'ghost'}
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "w-10 h-10 rounded-xl font-black text-xs leading-none transition-all",
                  currentPage === i + 1 
                    ? "primary-gradient text-on-primary shadow-ambient" 
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                )}
              >
                {i + 1}
              </Button>
            ))}
            <Button 
              variant="ghost" 
              size="icon" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="w-10 h-10 rounded-xl hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Insights Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-surface-container-lowest p-10 rounded-[2rem] shadow-ambient flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-black headline-font mb-2 text-on-surface tracking-tight">Contribution Trajectory</h3>
            <p className="text-on-surface-variant text-sm font-medium mb-8">Quarterly analysis of growth and consistency across active initiatives.</p>
          </div>
          <div className="h-64 w-full relative z-10 px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last6Months}>
                <defs>
                  <linearGradient id="colorAmountHistory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4955B3" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4955B3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#6b7280' }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontWeight: 800 }}
                  cursor={{ stroke: '#4955B3', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#4955B3" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorAmountHistory)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mt-6 relative z-10">
            <span>July</span><span>August</span><span>September</span><span>October</span><span className="text-primary font-black">Target</span>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>

        <div className="bg-surface-container-lowest p-6 sm:p-10 rounded-[2rem] shadow-ambient relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-black headline-font mb-4 text-on-surface tracking-tight">Active Milestone</h3>
            <p className="text-on-surface-variant text-sm font-medium mb-8">Strategic impact tracking for the current initiative.</p>
            
            {activeTarget ? (
              <div className="space-y-8">
                <div className="bg-surface-container-low/50 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Current Funding</span>
                      <span className="text-2xl font-black text-primary headline-font">৳124,500</span>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black text-[10px] px-3 py-1 rounded-lg uppercase tracking-widest">Phase 2</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '83%' }} className="h-full primary-gradient rounded-full" />
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-primary">83% Funded</span>
                      <span className="text-on-surface-variant">৳25,500 Remaining</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-surface-container-low/30 p-5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">12 Days Remaining</span>
                  </div>
                  <Badge variant="outline" className="border-surface-container-high text-on-surface-variant font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg bg-surface-container-lowest">Ends Oct 31</Badge>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-6 bg-surface-container-low/20 rounded-[2rem] border-2 border-dashed border-surface-variant/20">
                <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Plus className="w-10 h-10 text-on-surface-variant/20" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-extrabold text-on-surface headline-font tracking-tight">Project Ready</p>
                  <p className="text-on-surface-variant text-sm font-medium max-w-[240px] mx-auto">Complete your active target to initialize a new strategic milestone.</p>
                </div>
              </div>
            )}
            
            <Button 
               disabled={!!activeTarget}
               className="w-full mt-10 py-10 rounded-2xl font-black headline-font text-base uppercase tracking-[0.2em] bg-surface-container-low text-on-surface-variant/40 shadow-sm border border-surface-container-high disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <MoreVertical className="w-5 h-5 opacity-40 rotate-90" />
                Initialize New Milestone
              </div>
            </Button>
          </div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
        </div>
      </section>
    </div>
  );
}
