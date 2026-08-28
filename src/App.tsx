import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { MasterBarangView } from './components/MasterBarangView';
import { PenyediaView } from './components/PenyediaView';
import { BarangMasukView } from './components/BarangMasukView';
import { BarangKeluarView } from './components/BarangKeluarView';
import { PersediaanView } from './components/PersediaanView';
import { StockLedgerView } from './components/StockLedgerView';
import { PengambilanATKView } from './components/PengambilanATKView';
import { AsetView } from './components/AsetView';
import { AssetLifecycleView } from './components/AssetLifecycleView';
import { MutasiView } from './components/MutasiView';
import { StockOpnameView } from './components/StockOpnameView';
import { PemeliharaanPenghapusanView } from './components/PemeliharaanPenghapusanView';
import { ProcurementPlannerView } from './components/ProcurementPlannerView';
import { DocumentCenterView } from './components/DocumentCenterView';
import { LaporanView } from './components/LaporanView';
import { GoogleSheetsSyncView } from './components/GoogleSheetsSyncView';
import { AuditControlView } from './components/AuditControlView';
import { ConfigView } from './components/ConfigView';
import { PegawaiView } from './components/PegawaiView';
import { ARKASSiPlahView } from './components/ARKASSiPlahView';
import { DepresiasiAsetView } from './components/DepresiasiAsetView';
import { MultiSchoolConsolidationView } from './components/MultiSchoolConsolidationView';
import { UniversalSearchModal } from './components/UniversalSearchModal';
import { GoogleSheetsIntegrationModal } from './components/GoogleSheetsIntegrationModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { QRScannerModal } from './components/QRScannerModal';
import { PublicAssetVerificationModal } from './components/PublicAssetVerificationModal';
import { QRStickerModal } from './components/QRStickerModal';
import { db } from './services/localStorageService';
import { Asset, ActivePage } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Scanned / Public Verification State
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [scannedDriveUrl, setScannedDriveUrl] = useState<string | undefined>(undefined);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<Asset | null>(null);

  // Handle URL parameters for Dual-Mode QR Scanning
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const scanParam = params.get('scan') || params.get('code');
      const driveParam = params.get('drive');
      const pageParam = params.get('page');

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
  }, [activePage]);

  // Global keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenAssetInApp = (assetCode: string) => {
    const assets = db.getAssets();
    const found = assets.find((a) => a.KODE_ASET.toUpperCase() === assetCode.toUpperCase());
    if (found) {
      setSelectedAssetDetail(found);
      setActivePage('aset');
    }
  };

  const renderActiveView = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={(page) => setActivePage(page)}
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
            onNavigate={(page) => setActivePage(page)}
            onOpenSheetsModal={() => setIsGoogleModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col font-sans antialiased selection:bg-emerald-900 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleSidebarMobile={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenGoogleSync={() => setIsGoogleModalOpen(true)}
        onOpenSheetsModal={() => setIsGoogleModalOpen(true)}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onNavigate={(page) => setActivePage(page)}
        notificationCount={notificationCount}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activePage={activePage}
          onNavigate={(page) => {
            setActivePage(page);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          isMobileOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Universal Search Modal */}
      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(page) => {
          setActivePage(page);
          setIsSearchOpen(false);
        }}
      />

      {/* Global Google Sheets Sync & Apps Script Modal */}
      <GoogleSheetsIntegrationModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
      />

      {/* Global Gemini AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        onNavigate={(page) => {
          setActivePage(page);
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

      {/* Public Asset Verification & Dual-Mode Google Drive Modal (Triggered when QR is scanned externally) */}
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
    </div>
  );
}
