import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from './localStorageService';

export class PdfService {
  private addKopSurat(doc: jsPDF, pageWidth: number): number {
    const config = db.getConfig();
    const city = config.BA_DEFAULT_CITY || config.REPORT_SIGNATURE_CITY || 'Tangerang';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`PEMERINTAH KOTA ${city.toUpperCase()}`, pageWidth / 2, 14, { align: 'center' });
    doc.setFontSize(10.5);
    doc.text('DINAS PENDIDIKAN', pageWidth / 2, 19, { align: 'center' });
    doc.setFontSize(13);
    doc.text(`UPT SATUAN PENDIDIKAN ${config.SCHOOL_NAME.toUpperCase()}`, pageWidth / 2, 25, {
      align: 'center',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const subInfo = [
      `NPSN: ${config.SCHOOL_NPSN}`,
      config.ADDRESS,
      config.SCHOOL_EMAIL ? `Email: ${config.SCHOOL_EMAIL}` : '',
      config.SCHOOL_WEBSITE ? `Web: ${config.SCHOOL_WEBSITE}` : '',
    ]
      .filter(Boolean)
      .join('  |  ');
    doc.text(subInfo, pageWidth / 2, 30.5, { align: 'center' });

    // Double bottom border line for Kop Surat
    doc.setLineWidth(0.8);
    doc.line(14, 33.5, pageWidth - 14, 33.5);
    doc.setLineWidth(0.2);
    doc.line(14, 34.5, pageWidth - 14, 34.5);

    return 41; // Returns Y start position for content
  }

  private addOfficialSignatures(
    doc: jsPDF,
    startY: number,
    options?: {
      leftSigner?: { title: string; name: string; nip?: string };
      rightSigner?: { title: string; name: string; nip?: string };
      includeHeadmaster?: boolean;
    }
  ): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = startY;

    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 25;
    }

    const config = db.getConfig();
    const city = config.BA_DEFAULT_CITY || config.REPORT_SIGNATURE_CITY || 'Tangerang';
    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${city}, ${todayStr}`, pageWidth - 18, currentY, { align: 'right' });
    currentY += 6;

    const left = options?.leftSigner || {
      title: 'Pengurus / Pengelola Barang,',
      name: config.WAREHOUSE_OFFICER || 'Budi Santoso, A.Md.',
      nip: config.WAREHOUSE_OFFICER_NIP || '19920311 201903 1 008',
    };

    const right = options?.rightSigner || {
      title: 'Bendahara Barang & BOS,',
      name: config.TREASURER || 'Siti Rahmawati, S.Pd.',
      nip: config.TREASURER_NIP || '19870921 201001 2 005',
    };

    const col1X = 42;
    const col2X = pageWidth - 42;

    doc.text(left.title, col1X, currentY, { align: 'center' });
    doc.text(right.title, col2X, currentY, { align: 'center' });
    currentY += 19;

    doc.setFont('helvetica', 'bold');
    doc.text(left.name, col1X, currentY, { align: 'center' });
    doc.text(right.name, col2X, currentY, { align: 'center' });
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    if (left.nip) {
      doc.text(left.nip.startsWith('NIP') ? left.nip : `NIP. ${left.nip}`, col1X, currentY, { align: 'center' });
    }
    if (right.nip) {
      doc.text(right.nip.startsWith('NIP') ? right.nip : `NIP. ${right.nip}`, col2X, currentY, { align: 'center' });
    }

    if (options?.includeHeadmaster !== false) {
      currentY += 7;
      if (currentY > pageHeight - 35) {
        doc.addPage();
        currentY = 25;
      }
      doc.setFontSize(9);
      doc.text('Mengetahui,', pageWidth / 2, currentY, { align: 'center' });
      currentY += 4.5;
      doc.text('Kepala UPT Satuan Pendidikan SD Negeri Tangerang 6', pageWidth / 2, currentY, { align: 'center' });
      currentY += 19;

      doc.setFont('helvetica', 'bold');
      doc.text(config.HEADMASTER || 'Hj. Sumarsih, S.Pd., M.M.', pageWidth / 2, currentY, { align: 'center' });
      currentY += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const headmasterNip = config.HEADMASTER_NIP || '19680412 199303 2 005';
      doc.text(headmasterNip.startsWith('NIP') ? headmasterNip : `NIP. ${headmasterNip}`, pageWidth / 2, currentY, {
        align: 'center',
      });
    }
  }

  // --- 1. Generic Berita Acara Generator ---
  public generateBeritaAcara(options: {
    title: string;
    docNo?: string;
    description: string;
    tableHeaders: string[];
    tableRows: (string | number)[][];
    footerText?: string;
    leftSigner?: { title: string; name: string; nip?: string };
    rightSigner?: { title: string; name: string; nip?: string };
    includeHeadmaster?: boolean;
  }): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.addKopSurat(doc, pageWidth);

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(options.title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    if (options.docNo) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(`Nomor: ${options.docNo}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 7;
    } else {
      currentY += 3;
    }

    // Paragraph Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const splitDesc = doc.splitTextToSize(options.description, pageWidth - 28);
    doc.text(splitDesc, 14, currentY);
    currentY += splitDesc.length * 4.5 + 4;

    // Table
    if (options.tableRows.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [options.tableHeaders],
        body: options.tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [22, 101, 52],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [23, 32, 27],
        },
        margin: { left: 14, right: 14 },
      });

      // @ts-expect-error autoTable adds lastAutoTable to doc
      currentY = doc.lastAutoTable.finalY + 6;
    }

    // Footer note
    if (options.footerText) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      const splitFooter = doc.splitTextToSize(options.footerText, pageWidth - 28);
      doc.text(splitFooter, 14, currentY);
      currentY += splitFooter.length * 4 + 6;
    }

    this.addOfficialSignatures(doc, currentY, {
      leftSigner: options.leftSigner,
      rightSigner: options.rightSigner,
      includeHeadmaster: options.includeHeadmaster !== false,
    });

    const safeTitle = options.title.replace(/[^A-Za-z0-9]/g, '_');
    doc.save(`${safeTitle}_${options.docNo || 'DOKUMEN'}.pdf`);
  }

  // --- 2. Kartu Stok PDF ---
  public generateKartuStokPDF(kodeBarang: string): void {
    const items = db.getItems();
    const item = items.find((i) => i.KODE_BARANG === kodeBarang);
    if (!item) return;

    const ledger = db.getStockLedger(kodeBarang);
    const summary = db.getStockSummary().find((s) => s.KODE_BARANG === kodeBarang);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.addKopSurat(doc, pageWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('KARTU PERSEDIAAN / KARTU STOK BARANG', pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Kode Barang   : ${item.KODE_BARANG}`, 14, currentY);
    doc.text(`Satuan              : ${item.JENIS_SATUAN}`, pageWidth - 70, currentY);
    currentY += 5;
    doc.text(`Nama Barang  : ${item.NAMA_BARANG}`, 14, currentY);
    doc.text(`Batas Minimum : ${item.BATAS_MINIMUM} ${item.JENIS_SATUAN}`, pageWidth - 70, currentY);
    currentY += 5;
    doc.text(`Lokasi             : ${item.LOKASI_DEFAULT}`, 14, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(`Stok Akhir       : ${summary?.STOK || 0} ${item.JENIS_SATUAN}`, pageWidth - 70, currentY);
    currentY += 7;

    const rows = ledger.map((l, idx) => [
      idx + 1,
      l.TANGGAL,
      l.REF_TYPE,
      l.NOMOR_DOKUMEN || '-',
      l.QTY_IN > 0 ? l.QTY_IN : '-',
      l.QTY_OUT > 0 ? l.QTY_OUT : '-',
      l.SALDO_SESUDAH,
      l.STATUS,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Tanggal', 'Aktivitas', 'No Dokumen', 'Masuk', 'Keluar', 'Saldo', 'Status']],
      body: rows.length > 0 ? rows : [['-', '-', 'Belum ada mutasi barang', '-', '-', '-', '0', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', cellWidth: 16 },
        5: { halign: 'center', cellWidth: 16 },
        6: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        7: { halign: 'center', cellWidth: 20 },
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable
    const endY = doc.lastAutoTable.finalY + 8;
    this.addOfficialSignatures(doc, endY);

    doc.save(`Kartu_Stok_${item.KODE_BARANG}.pdf`);
  }

  // --- 3. Laporan Bulanan Barang Keluar ---
  public generateLaporanBulananBK(yearMonth: string): void {
    const list = db.getBarangKeluar().filter(
      (bk) => bk.TANGGAL.startsWith(yearMonth) && bk.STATUS_TRANSAKSI === 'DISETUJUI'
    );
    const [year, month] = yearMonth.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, 1);
    const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.addKopSurat(doc, pageWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`LAPORAN REKAPITULASI PENGELUARAN BARANG`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Periode: ${monthName}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    const tableRows = list.map((b, i) => [
      i + 1,
      b.TANGGAL,
      b.NOMOR_DOKUMEN,
      b.KODE_BARANG,
      b.NAMA_BARANG,
      b.JUMLAH,
      b.JENIS_SATUAN,
      b.PENERIMA + (b.PENERIMA_NIP ? `\n(NIP. ${b.PENERIMA_NIP})` : ''),
      b.UNIT_RUANGAN,
      b.TUJUAN_PENGGUNAAN,
      b.PETUGAS,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          'No',
          'Tanggal',
          'No Dokumen',
          'Kode Barang',
          'Nama Barang',
          'Qty',
          'Satuan',
          'Penerima & NIP',
          'Unit/Ruangan',
          'Tujuan Penggunaan',
          'Petugas',
        ],
      ],
      body: tableRows.length > 0 ? tableRows : [['-', '-', '-', '-', 'Tidak ada data pada periode ini', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7.5,
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable
    const endY = doc.lastAutoTable.finalY + 8;
    this.addOfficialSignatures(doc, endY);

    doc.save(`Laporan_Barang_Keluar_${yearMonth}.pdf`);
  }

  // --- 4. Laporan Pengambilan ATK Keseluruhan ---
  public generateLaporanATKKeseluruhan(): void {
    const list = db.getPengambilanATK();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.addKopSurat(doc, pageWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('BUKU REKAPITULASI PENGAMBILAN ATK PEGAWAI & GURU', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    const rows = list.map((atk, idx) => [
      idx + 1,
      atk.NO,
      atk.TANGGAL,
      atk.NAMA_LENGKAP + (atk.NIP ? `\nNIP. ${atk.NIP}` : ''),
      atk.JABATAN || 'Guru',
      atk.NAMA_BARANG,
      atk.PETUGAS,
      atk.KETERANGAN || '-',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'No. Lap', 'Tanggal', 'Nama Pegawai & NIP', 'Jabatan', 'Nama Barang ATK', 'Petugas', 'Keterangan']],
      body: rows.length > 0 ? rows : [['-', '-', '-', '-', 'Belum ada data pengambilan ATK', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable
    const endY = doc.lastAutoTable.finalY + 8;
    this.addOfficialSignatures(doc, endY);

    doc.save('Laporan_Pengambilan_ATK_Keseluruhan.pdf');
  }

  // --- 5. Laporan Persediaan Barang ---
  public generateLaporanPersediaan(summaryList: any[], period: string = 'Bulan Berjalan'): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.addKopSurat(doc, pageWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('BUKU PERSEDIAAN BARANG HABIS PAKAI', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Periode: ${period}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    const rows = summaryList.map((s, idx) => [
      idx + 1,
      s.KODE_BARANG,
      s.NAMA_BARANG,
      s.JENIS_SATUAN,
      s.TOTAL_MASUK,
      s.TOTAL_KELUAR,
      s.TOTAL_ADJUSTMENT || 0,
      s.STOK,
      s.BATAS_MINIMUM,
      s.STATUS,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Kode Barang', 'Nama Barang', 'Satuan', 'Masuk', 'Keluar', 'Penyesuaian', 'Stok Akhir', 'Batas Min', 'Status']],
      body: rows.length > 0 ? rows : [['-', '-', 'Belum ada data persediaan', '-', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 24 },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center', fontStyle: 'bold' },
        8: { halign: 'center' },
        9: { halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable
    const endY = doc.lastAutoTable.finalY + 8;
    this.addOfficialSignatures(doc, endY);

    doc.save(`Laporan_Persediaan_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // --- 6. Laporan Aset & Inventaris / KIR ---
  public generateLaporanAset(assetList: any[], title: string = 'Laporan Inventaris Aset'): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.addKopSurat(doc, pageWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    const rows = assetList.map((a, idx) => [
      idx + 1,
      a.KODE_ASET,
      a.NAMA_BARANG,
      a.MERK || '-',
      a.JUMLAH || 1,
      a.JENIS_SATUAN || 'Unit',
      `Rp ${(a.TOTAL_NILAI || 0).toLocaleString('id-ID')}`,
      a.LOKASI || '-',
      a.PENANGGUNG_JAWAB || '-',
      a.KONDISI || 'BAIK',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Kode Register', 'Nama Aset', 'Merk / Spesifikasi', 'Qty', 'Satuan', 'Nilai Perolehan', 'Lokasi', 'Penanggung Jawab', 'Kondisi']],
      body: rows.length > 0 ? rows : [['-', '-', 'Belum ada data inventaris', '-', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable
    const endY = doc.lastAutoTable.finalY + 8;
    this.addOfficialSignatures(doc, endY);

    doc.save(`Laporan_Inventaris_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  public generateKartuStok(kodeBarang: string): void {
    this.generateKartuStokPDF(kodeBarang);
  }
}

export const pdfService = new PdfService();
