import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { SuspendedScreen } from './components/Auth/SuspendedScreen';
import { Header } from './components/Layout/Header';
import { RejectedAlertBanner } from './components/Layout/RejectedAlertBanner';
import { MobileBottomNav, type MobileTab } from './components/Layout/MobileBottomNav';
import { StatsDashboard } from './components/Dashboard/StatsDashboard';
import { DailyReportForm } from './components/DailyReport/DailyReportForm';
import { PayoutCyclesSection } from './components/Reports/PayoutCyclesSection';
import { ReportHistoryTable } from './components/History/ReportHistoryTable';
import { RiderProfileModal } from './components/Profile/RiderProfileModal';
import { StorageService } from './services/storage';
import { FirebaseService } from './services/firebase';
import type { DailyReport, PayoutCycle } from './types';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isSuspended } = useAuth();
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('report');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedEditDate, setSelectedEditDate] = useState<string | undefined>(undefined);

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [cycles, setCycles] = useState<PayoutCycle[]>([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const loadData = () => {
    if (user?.uid) {
      FirebaseService.getDailyReports(user.uid).then((rtdbReportsList) => {
        const sorted = (rtdbReportsList || []).sort((a, b) => b.date.localeCompare(a.date));
        setReports(sorted);
        const userCycles = StorageService.getPayoutCycles(user.uid, sorted);
        setCycles(userCycles);
      });
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadData();

      // Subscribe to Firebase Realtime Database daily reports for live updates
      const unsub = FirebaseService.subscribeDailyReports(user.uid, (rtdbReportsMap) => {
        const rtdbReportsList = rtdbReportsMap ? Object.values(rtdbReportsMap).sort((a, b) => b.date.localeCompare(a.date)) : [];
        setReports(rtdbReportsList);
        const userCycles = StorageService.getPayoutCycles(user.uid, rtdbReportsList);
        setCycles(userCycles);
      });
      return () => {
        unsub();
      };
    } else {
      setReports([]);
      setCycles([]);
    }
  }, [user?.uid]);

  const handleMobileTabChange = (tab: MobileTab) => {
    setActiveMobileTab(tab);
    if (tab === 'profile') {
      setShowProfileModal(true);
      return;
    }

    const sectionIdMap: Record<MobileTab, string | null> = {
      dashboard: 'stats-section',
      report: 'report-section',
      payouts: 'payouts-section',
      history: 'history-section',
      profile: null
    };

    const targetId = sectionIdMap[tab];
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  if (isSuspended) {
    return <SuspendedScreen />;
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: '90px' }}>
      <Header onOpenProfile={() => setShowProfileModal(true)} />

      <main className="app-container" style={{ paddingTop: '16px' }}>
        {/* 1. Admin Rejected Alert Message Bar (Upper Top below Header) */}
        <RejectedAlertBanner
          reports={reports}
          onSelectReportToEdit={(date) => setSelectedEditDate(date)}
        />

        {/* 2. Welcome Header Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Welcome, {user?.name ? user.name.split(' ')[0] : (user?.partnerId || 'Partner')} 👋
            </h1>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Daily parcel reporting, provisional earnings & payout tracker.
            </p>
          </div>
        </div>

        {/* 3. Daily Report Entry Form */}
        <div id="report-section" style={{ marginBottom: '20px' }}>
          <DailyReportForm
            user={user!}
            onReportSubmitted={loadData}
            selectedEditDate={selectedEditDate}
          />
        </div>

        {/* 4. Stats Dashboard Section */}
        <div id="stats-section" style={{ marginBottom: '10px' }}>
          <StatsDashboard reports={reports} cycles={cycles} />
        </div>

        {/* 5. Report Work History Table & Mobile Cards */}
        <div style={{ marginBottom: '10px' }}>
          <ReportHistoryTable
            reports={reports}
            onDataChanged={loadData}
            onSelectReportToEdit={(date) => setSelectedEditDate(date)}
          />
        </div>

        {/* 6. Bi-Monthly Payout Statements & Reports Section (Bottom) */}
        <div id="payouts-section">
          <PayoutCyclesSection user={user!} cycles={cycles} reports={reports} />
        </div>
      </main>

      {/* Mobile Compact Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeMobileTab}
        setActiveTab={handleMobileTabChange}
        unreadCount={0}
      />

      {/* Rider Profile Modal */}
      {showProfileModal && user && (
        <RiderProfileModal user={user} onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <div className="background-glow-mesh">
        <div className="glow-orb-1" />
        <div className="glow-orb-2" />
      </div>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
