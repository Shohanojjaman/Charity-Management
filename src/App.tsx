/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from 'firebase/auth';
import { db, auth, OperationType, handleFirestoreError } from './lib/firebase';
import { cn } from './lib/utils';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Target as TargetIcon, 
  LogOut, 
  LogIn,
  Heart,
  TrendingUp,
  Wallet,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Progress } from './components/ui/progress';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import CharityList from './components/CharityList';
import TargetManager from './components/TargetManager';
import AddRecordModal from './components/AddRecordModal';
import ContributionForm from './components/ContributionForm';
import BottomNav from './components/BottomNav';
import LogoutConfirmModal from './components/LogoutConfirmModal';

export interface CharityRecord {
  id: string;
  title: string;
  amount: number;
  date: string;
  note?: string;
  userId: string;
  verified: boolean;
  recipientId: string;
  category?: string;
}

export interface Target {
  id: string;
  targetAmount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed';
  userId: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<CharityRecord[]>([]);
  const [activeTarget, setActiveTarget] = useState<Target | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      setActiveTarget(null);
      return;
    }

    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    // Fetch records
    const qRecords = query(
      collection(db, 'charity_records'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubRecords = onSnapshot(qRecords, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CharityRecord));
      setRecords(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'charity_records');
    });

    // Fetch active target
    const qTargets = query(
      collection(db, 'targets'),
      where('userId', '==', user.uid),
      where('status', '==', 'active')
    );

    const unsubTargets = onSnapshot(qTargets, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Target));
      setActiveTarget(data[0] || null);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'targets');
    });

    return () => {
      unsubRecords();
      unsubTargets();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => setIsLogoutModalOpen(true);
  const confirmLogout = () => {
    signOut(auth);
    setIsLogoutModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="p-4 bg-primary-container/30 rounded-2xl">
              <Heart className="w-12 h-12 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface headline-font">Altruist</h1>
            <p className="text-on-surface-variant font-medium">Manage your donations and reach your impact goals.</p>
          </div>
          <Button onClick={handleLogin} size="lg" className="w-full primary-gradient text-on-primary py-6 text-lg rounded-2xl shadow-ambient transition-all hover:scale-[1.02] active:scale-[0.98]">
            <LogIn className="mr-2 h-5 w-5" /> Sign in with Google
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn(
        "min-h-screen text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container pb-20 lg:pb-0 transition-colors duration-300",
        theme === 'dark' ? 'dark' : ''
    )}>
      <div className="hidden lg:block">
        <Sidebar 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            theme={theme}
            toggleTheme={toggleTheme}
            onLogout={handleLogout}
        />
      </div>
      
      <TopBar 
        user={user} 
        onLogout={handleLogout} 
        activeTab={activeTab} 
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="lg:ml-64 pt-20 lg:pt-16 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Dashboard records={records} activeTarget={activeTarget} setActiveTab={setActiveTab} />
              </motion.div>
            )}
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <CharityList records={records} activeTarget={activeTarget} />
              </motion.div>
            )}
            {activeTab === 'targets' && (
              <motion.div
                key="targets"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TargetManager activeTarget={activeTarget} userId={user.uid} />
              </motion.div>
            )}
            {activeTab === 'entry' && (
              <motion.div
                key="entry"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-2xl mx-auto py-8 space-y-8"
              >
                <div className="text-center px-4 space-y-2">
                  <h3 className="text-3xl font-black headline-font text-on-surface tracking-tighter">Enter Strategy.</h3>
                  <p className="text-on-surface-variant text-sm font-medium">Initialize a specific act of financial stewardship.</p>
                </div>
                <div className="bg-surface-container-lowest p-6 sm:p-10 rounded-[2.5rem] shadow-ambient">
                  <ContributionForm userId={user.uid} onSuccess={() => setActiveTab('history')} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile FAB - Hidden on history tab as per design guidelines */}
      {activeTab !== 'history' && activeTab !== 'entry' && (
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-primary to-primary-dim text-on-primary rounded-full shadow-xl shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
      )}

      {/* Desktop FAB */}
      {activeTab !== 'history' && activeTab !== 'entry' && (
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="hidden lg:flex fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-primary to-primary-dim text-on-primary rounded-full shadow-xl shadow-primary/20 items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <AddRecordModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        userId={user.uid} 
      />

      <LogoutConfirmModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={confirmLogout} 
      />
    </div>
  );
}
