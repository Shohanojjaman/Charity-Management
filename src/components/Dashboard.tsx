import { motion } from 'motion/react';
import { Card } from './ui/card';
import { 
  TrendingUp, 
  Wallet, 
  Target as TargetIcon, 
  Heart, 
  Download, 
  Filter, 
  ChevronRight,
  FileJson,
  FileText
} from 'lucide-react';
import { CharityRecord, Target } from '../App';
import { format, startOfMonth, subMonths, isSameMonth } from 'date-fns';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  records: CharityRecord[];
  activeTarget: Target | null;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ records, activeTarget, setActiveTab }: DashboardProps) {
  const totalSpent = records.reduce((acc, record) => acc + record.amount, 0);
  const targetAmount = activeTarget?.targetAmount || 0;
  const progress = targetAmount > 0 ? Math.min(100, (totalSpent / targetAmount) * 100) : 0;

  const recentRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const handleExportReport = () => {
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
    link.setAttribute('download', `executive_report_${format(new Date(), 'yyyy_MM_dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text('Executive Stewardship Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report Period: ${format(new Date(), 'MMMM yyyy')}`, 14, 30);
    doc.text(`Total Stewardship: ৳${totalSpent.toLocaleString()}`, 14, 38);
    
    const tableData = records.map(r => [
      format(new Date(r.date), 'yyyy-MM-dd HH:mm'),
      r.title,
      `৳${r.amount.toLocaleString()}`,
      r.category || 'General',
      r.verified ? 'Verified' : 'Pending'
    ]);

    autoTable(doc, {
      head: [['Date', 'Initiative', 'Magnitude', 'Class', 'Status']],
      body: tableData,
      startY: 50,
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [73, 85, 179] }
    });

    doc.save(`executive_report_${format(new Date(), 'yyyy_MM_dd')}.pdf`);
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

  const stats = [
    {
      title: "Total Funds Spent",
      value: `৳${totalSpent.toLocaleString()}`,
      icon: Heart,
      color: "text-primary",
      bg: "bg-primary-container/30",
      trend: "Trajectory"
    },
    {
      title: "Remaining Balance",
      value: `৳${Math.max(0, targetAmount - totalSpent).toLocaleString()}`,
      icon: Wallet,
      color: "text-on-surface-variant",
      bg: "bg-surface-container-low",
      trend: null
    },
    {
      title: "Overall Target Amount",
      value: `৳${targetAmount.toLocaleString()}`,
      icon: TargetIcon,
      color: "text-secondary",
      bg: "bg-secondary-container/30",
      trend: null
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface headline-font">Executive Dashboard</h2>
          <p className="text-on-surface-variant font-medium mt-1">
            Welcome back. Here is the impact overview for <span className="text-primary font-bold">{format(new Date(), 'yyyy')} Stewardship</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handleExportReport}
                className="bg-surface-container-low dark:bg-surface-container-high text-on-surface px-6 py-4 rounded-2xl font-black headline-font flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm border border-surface-container-high dark:border-surface-container-low"
            >
                <FileJson className="w-5 h-5 text-primary" />
                CSV
            </button>
            <button 
                onClick={handleExportPDF}
                className="primary-gradient text-on-primary px-6 py-4 rounded-2xl font-black headline-font flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-ambient"
            >
                <FileText className="w-5 h-5" />
                Export PDF
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className={cn(
              "border-none shadow-ambient p-8 flex flex-col justify-between group hover:shadow-md transition-all rounded-[2rem]",
              index === 0 ? "primary-gradient text-on-primary md:col-span-1" : "bg-surface-container-lowest text-on-surface"
            )}
          >
            <div className="flex justify-between items-start">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center",
                index === 0 ? "bg-white/20 text-white" : `${stat.bg} ${stat.color}`
              )}>
                <stat.icon className="w-7 h-7" />
              </div>
              {stat.trend && (
                <span className={cn(
                  "text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase",
                  index === 0 ? "bg-white/20 text-white" : "bg-primary-container/20 text-primary"
                )}>
                  {stat.trend}
                </span>
              )}
            </div>
            <div className="mt-10">
              <p className={cn(
                "text-[10px] font-black mb-2 uppercase tracking-widest",
                index === 0 ? "text-on-primary/70" : "text-on-surface-variant"
              )}>{stat.title}</p>
              <h3 className="text-4xl font-black tracking-tight headline-font">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Trajectory & Recent */}
        <div className="lg:col-span-8 space-y-6">
           {/* Chart Card */}
           <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-ambient">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h4 className="text-xl font-extrabold headline-font tracking-tight">Financial Trajectory</h4>
                        <p className="text-xs text-on-surface-variant font-medium">Monthly Stewardship analysis.</p>
                    </div>
                    <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                        <TrendingUp className="w-4 h-4" />
                        Live Ledger
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={last6Months}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
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
                                fill="url(#colorAmount)" 
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
           </div>

           {/* Recent Contributions */}
           <div className="bg-surface-container-lowest rounded-[2rem] shadow-ambient overflow-hidden">
                <div className="p-8 border-b border-surface-container-low flex items-center justify-between">
                    <h4 className="text-2xl font-extrabold text-on-surface headline-font tracking-tight">Recent Chronicles</h4>
                    <button className="p-3 bg-surface-container-low hover:bg-surface-container-high rounded-xl transition-all text-on-surface-variant">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead>
                        <tr className="bg-surface-container-low/30">
                        <th className="px-8 py-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Chronology</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Recipient</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Magnitude</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                        {recentRecords.length > 0 ? recentRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-surface-container-low/20 transition-colors group">
                            <td className="px-8 py-6">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-on-surface">{format(new Date(record.date), 'MMM dd')}</span>
                                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">{format(new Date(record.date), 'HH:mm')}</span>
                            </div>
                            </td>
                            <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-extrabold text-on-surface tracking-tight">{record.title}</span>
                                {record.verified && (
                                    <div className="w-4 h-4 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                        <Heart className="w-2 h-2 fill-current" />
                                    </div>
                                )}
                            </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                            <span className="text-lg font-black text-primary headline-font tracking-tight">৳{record.amount.toLocaleString()}</span>
                            </td>
                        </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="px-8 py-12 text-center text-on-surface-variant font-black uppercase tracking-widest text-xs opacity-60">No discoveries.</td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                </div>
                <div className="p-8 bg-surface-container-low/30 flex justify-center border-t border-surface-container-low">
                    <button 
                        onClick={() => setActiveTab('history')}
                        className="text-sm font-black text-primary hover:text-primary-dim transition-all flex items-center gap-2 headline-font uppercase tracking-widest"
                    >
                        Review Master Ledger
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        {/* Right Column: Active Target */}
        <div className="lg:col-span-4">
          <div className="bg-surface-container-low rounded-[2rem] p-8 relative overflow-hidden h-full">
            <div className="relative z-10">
              <h4 className="text-xl font-extrabold mb-8 headline-font tracking-tight">Active Target</h4>
              {activeTarget ? (
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between mb-4 items-end">
                      <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Momentum</span>
                      <span className="text-primary font-black text-2xl headline-font">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-5 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full primary-gradient rounded-full shadow-ambient"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-lowest/60 backdrop-blur-md rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Spent</p>
                      <p className="text-xl font-extrabold text-primary headline-font">৳{totalSpent.toLocaleString()}</p>
                    </div>
                    <div className="bg-surface-container-lowest/60 backdrop-blur-md rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Goal</p>
                      <p className="text-xl font-extrabold text-on-surface headline-font">৳{targetAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto">
                    <TargetIcon className="w-10 h-10 text-on-surface-variant/30" />
                  </div>
                  <p className="text-on-surface-variant font-bold text-sm tracking-tight">No active milestone.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
