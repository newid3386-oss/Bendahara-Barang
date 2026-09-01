import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { UniversalSearchModal } from './components/UniversalSearchModal';
import { GoogleSheetsIntegrationModal } from './components/GoogleSheetsIntegrationModal';
import { FirebaseCloudSyncModal } from './components/FirebaseCloudSyncModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { QRScannerModal } from './components/QRScannerModal';
import { PublicAssetVerificationModal } from './components/PublicAssetVerificationModal';
import { QRStickerModal } from './components/QRStickerModal';
import { DataReconciliationDialog } from './components/DataReconciliationDialog';
import { accountService } from './services/accountService';
import { classroomService } from './services/classroomService';
import { db } from './services/localStorageService';
import { Asset, ActivePage, User } from './types';
import { useTheme } from './utils/theme';

// Lazy loaded views to optimize bundle size
const SchoolPublicWebsite = lazy(() => import('./components/SchoolPublicWebsite').then(module => ({ default: module.SchoolPublicWebsite })));
const DashboardView = lazy(() => import('./components/DashboardView').then(module => ({ default: module.DashboardView })));
const MasterBarangView = lazy(() => import('./components/MasterBarangView').then(module => ({ default: module.MasterBarangView })));
const PenyediaView = lazy(() => import('./components/PenyediaView').then(module => ({ default: module.PenyediaView })));
const BarangMasukView = lazy(() => import('./components/BarangMasukView').then(module => ({ default: module.BarangMasukView })));
const BarangKeluarView = lazy(() => import('./components/BarangKeluarView').then(module => ({ default: module.BarangKeluarView })));
const PersediaanView = lazy(() => import('./components/PersediaanView').then(module => ({ default: module.PersediaanView })));
const StockLedgerView = lazy(() => import('./components/StockLedgerView').then(module => ({ default: module.StockLedgerView })));
const PengambilanATKView = lazy(() => import('./components/PengambilanATKView').then(module => ({ default: module.PengambilanATKView })));
const AsetView = lazy(() => import('./components/AsetView').then(module => ({ default: module.AsetView })));
const AssetLifecycleView = lazy(() => import('./components/AssetLifecycleView').then(module => ({ default: module.AssetLifecycleView })));
const MutasiView = lazy(() => import('./components/MutasiView').then(module => ({ default: module.MutasiView })));
const StockOpnameView = lazy(() => import('./components/StockOpnameView').then(module => ({ default: module.StockOpnameView })));
const PemeliharaanPenghapusanView = lazy(() => import('./components/PemeliharaanPenghapusanView').then(module => ({ default: module.PemeliharaanPenghapusanView })));
const ProcurementPlannerView = lazy(() => import('./components/ProcurementPlannerView').then(module => ({ default: module.ProcurementPlannerView })));
const DocumentCenterView = lazy(() => import('./components/DocumentCenterView').then(module => ({ default: module.DocumentCenterView })));
const LaporanView = lazy(() => import('./components/LaporanView').then(module => ({ default: module.LaporanView })));
const GoogleSheetsSyncView = lazy(() => import('./components/GoogleSheetsSyncView').then(module => ({ default: module.GoogleSheetsSyncView })));
const AuditControlView = lazy(() => import('./components/AuditControlView').then(module => ({ default: module.AuditControlView })));
const ConfigView = lazy(() => import('./components/ConfigView').then(module => ({ default: module.ConfigView })));
const PegawaiView = lazy(() => import('./components/PegawaiView').then(module => ({ default: module.PegawaiView })));
const ARKASSiPlahView = lazy(() => import('./components/ARKASSiPlahView').then(module => ({ default: module.ARKASSiPlahView })));
const DepresiasiAsetView = lazy(() => import('./components/DepresiasiAsetView').then(module => ({ default: module.DepresiasiAsetView })));
const MultiSchoolConsolidationView = lazy(() => import('./components/MultiSchoolConsolidationView').then(module => ({ default: module.MultiSchoolConsolidationView })));
const ClassroomApp = lazy(() => import('./components/ClassroomApp').then(module => ({ default: module.ClassroomApp })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(module => ({ default: module.AdminPanel })));

export default function App() {
  const { styles } = useTheme();
  const [viewMode, setViewMode] = useState<'app' | 'website' | 'classroom' | 'admin'>('website');
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Scanned / Public Verification State
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [scannedDriveUrl, setScannedDriveUrl] = useState<string | undefined>(undefined);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<Asset | null>(null);

  // Handle URL parameters for Dual-Mode QR Scanning & View Mode
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const scanParam = params.get('scan') || params.get('code');
      const driveParam = params.get('drive');
      const pageParam = params.get('page');
      const viewParam = params.get('view');

      if (viewParam === 'website' || viewParam === 'portal') {
        setViewMode('website');
      } else if (viewParam === 'app' || viewParam === 'dashboard') {
        setViewMode('app');
      }

      if (pageParam) {
        setActivePage(pageParam as ActivePage);
      }

      if (scanParam) {
        setScannedCode(scanParam);
        if (driveParam) {
          setScannedDriveUrl(decodeURIComponent(driveParam));
        }
      }
    } catch (e) {
      console.error('Error parsing scan URL parameters:', e);
    }
  }, []);

  useEffect(() => {
    // Check low stock count for notifications
    const lowStock = db.getStockSummary().filter((s) => s.STATUS === 'MINIMUM').length;
    const pendingApprovals = db
      .getBarangKeluar()
      .filter((k) => k.STATUS_TRANSAKSI === 'MENUNGGU_PERSETUJUAN').length;
    setNotificationCount(lowStock + pendingApprovals);
  }, [activePage, viewMode]);

  // Global keyboard shortcut for search (Ctrl+K / Cmd+K) and QR Scanner (Ctrl+Shift+S / Cmd+Shift+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K -> Universal Search
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      // Ctrl+Shift+S or Cmd+Shift+S -> QR Scanner
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setIsQRScannerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize Classroom & Admin account stores on first load
  useEffect(() => {
    accountService.initAccounts();
    classroomService.initClassroom();
  }, []);

  const handleOpenAssetInApp = (assetCode: string) => {
    const assets = db.getAssets();
    const found = assets.find((a) => a.KODE_ASET.toUpperCase() === assetCode.toUpperCase());
    if (found) {
      setSelectedAssetDetail(found);
      setActivePage('aset');
      setViewMode('app');
    }
  };

  const handleNavigate = (page: ActivePage | string) => {
    if (page === 'website_sekolah') {
      setViewMode('website');
      return;
    }
    setActivePage(page as ActivePage);
    setViewMode('app');
  };

  const renderActiveView = () => {
    switch (activePage as any) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={(page) => handleNavigate(page)}
            onOpenSheetsModal={() => setIsGoogleModalOpen(true)}
          />
        );
      case 'barang_masuk':
        return <BarangMasukView />;
      case 'barang_keluar':
        return <BarangKeluarView />;
      case 'pengambilan_atk':
        return <PengambilanATKView />;
      case 'persediaan':
        return <PersediaanView />;
      case 'stock_ledger':
        return <StockLedgerView />;
      case 'stock_opname':
        return <StockOpnameView />;
      case 'master':
      case 'master_barang':
        return <MasterBarangView />;
      case 'supplier':
      case 'penyedia':
        return <PenyediaView />;
      case 'aset':
        return <AsetView />;
      case 'depresiasi':
      case 'depresiasi_aset':
        return <DepresiasiAsetView />;
      case 'asset_lifecycle':
        return <AssetLifecycleView />;
      case 'mutasi':
        return <MutasiView />;
      case 'pemeliharaan':
      case 'penghapusan':
        return <PemeliharaanPenghapusanView />;
      case 'procurement_plan':
      case 'procurement_planner':
        return <ProcurementPlannerView />;
      case 'arkas':
      case 'arkas_siplah':
      case 'siplah':
        return <ARKASSiPlahView />;
      case 'multi_school':
      case 'consolidation':
        return <MultiSchoolConsolidationView />;
      case 'document_center':
        return <DocumentCenterView />;
      case 'laporan':
        return <LaporanView />;
      case 'google_sheets':
      case 'google_sheets_sync':
        return <GoogleSheetsSyncView onOpenModal={() => setIsGoogleModalOpen(true)} />;
      case 'audit':
      case 'control_center':
        return <AuditControlView />;
      case 'pegawai':
      case 'guru':
      case 'users':
        return <PegawaiView />;
      case 'config':
        return <ConfigView />;
      default:
        return (
          <DashboardView
            onNavigate={(page) => handleNavigate(page)}
            onOpenSheetsModal={() => setIsGoogleModalOpen(true)}
          />
        );
    }
  };

  // Classroom module — separate from SIPERSEDA
  if (viewMode === 'classroom') {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
        <ClassroomApp onLogout={() => setViewMode('website')} />
      </Suspense>
    );
  }

  // Admin management panel
  if (viewMode === 'admin') {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>}>
        <AdminPanel onLogout={() => setViewMode('website')} />
      </Suspense>
    );
  }

  // If currently in Public Website mode, display the official school portal
  if (viewMode === 'website') {
    return (
      <>
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>}>
          <SchoolPublicWebsite
            onEnterApp={(user?: User) => {
              if (user) db.setActiveUser(user);
              setViewMode('app');
            }}
            onEnterClassroom={() => setViewMode('classroom')}
            onEnterAdmin={() => setViewMode('admin')}
          />
        </Suspense>

        {/* Global Modals accessible if opened from website actions */}
        {scannedCode && (
          <PublicAssetVerificationModal
            isOpen={Boolean(scannedCode)}
            assetCode={scannedCode}
            driveUrl={scannedDriveUrl}
            onClose={() => {
              setScannedCode(null);
              setScannedDriveUrl(undefined);
            }}
            onOpenInApp={handleOpenAssetInApp}
          />
        )}
      </>
    );
  }

  return (
    <div className={`min-h-screen ${styles.bgApp} flex flex-col font-sans antialiased selection:bg-blue-900 selection:text-white`}>
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleSidebarMobile={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenGoogleSync={() => setIsGoogleModalOpen(true)}
        onOpenSheetsModal={() => setIsGoogleModalOpen(true)}
        onOpenFirebaseSync={() => setIsFirebaseModalOpen(true)}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenSchoolWebsite={() => setViewMode('website')}
        onLogout={() => setViewMode('website')}
        onNavigate={(page) => handleNavigate(page)}
        notificationCount={notificationCount}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activePage={activePage}
          onNavigate={(page) => {
            handleNavigate(page);
            setIsSidebarOpen(false);
          }}
          onOpenSchoolWebsite={() => setViewMode('website')}
          isOpen={isSidebarOpen}
          isMobileOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Suspense fallback={<div className="flex items-center justify-center h-full w-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div></div>}>
            {renderActiveView()}
          </Suspense>
        </main>
      </div>

      {/* Global Universal Search Modal */}
      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(page) => {
          handleNavigate(page);
          setIsSearchOpen(false);
        }}
      />

      {/* Global Google Sheets Sync & Apps Script Modal */}
      <GoogleSheetsIntegrationModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
      />

      {/* Global Firebase Firestore Cloud Sync Modal */}
      <FirebaseCloudSyncModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />

      {/* Global Gemini AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        onNavigate={(page) => {
          handleNavigate(page);
          setIsAIAssistantOpen(false);
        }}
      />

      {/* Global In-App QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onSelectAsset={(asset) => {
          setSelectedAssetDetail(asset);
          setActivePage('aset');
        }}
      />

      {/* Public Asset Verification & Dual-Mode Google Drive Modal */}
      {scannedCode && (
        <PublicAssetVerificationModal
          isOpen={Boolean(scannedCode)}
          assetCode={scannedCode}
          driveUrl={scannedDriveUrl}
          onClose={() => {
            setScannedCode(null);
            setScannedDriveUrl(undefined);
          }}
          onOpenInApp={handleOpenAssetInApp}
        />
      )}

      {/* Scanned Asset QR Details Modal */}
      {selectedAssetDetail && (
        <QRStickerModal
          isOpen={Boolean(selectedAssetDetail)}
          asset={selectedAssetDetail}
          onClose={() => setSelectedAssetDetail(null)}
        />
      )}

      {/* Connection & Offline Conflict Reconciliation Dialog */}
      <DataReconciliationDialog />
    </div>
  );
}
