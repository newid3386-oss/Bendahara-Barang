import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from './localStorageService';
import { qrService } from './qrService';

export interface BeritaAcaraOptions {
  title: string;
  docNo?: string;
  description: string;
  tableHeaders: string[];
  tableRows: (string | number)[][];
  footerText?: string;
  leftSigner?: { title: string; name: string; nip?: string };
  rightSigner?: { title: string; name: string; nip?: string };
  centerSigner?: { title: string; name: string; nip?: string };
  includeHeadmaster?: boolean;

  // Paper & Layout settings
  paperSize?: 'a4' | 'f4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;

  // Kop Surat Customization
  kopSurat?: {
    show?: boolean;
    alignment?: 'center' | 'left' | 'dual_logo';
    logoMode?: 'dual' | 'school' | 'city' | 'none';
    line1?: string;
    line2?: string;
    line3?: string;
    line4?: string;
    cityLogoUrl?: string;
    schoolLogoUrl?: string;
    borderStyle?: 'double' | 'single' | 'bold' | 'none';
  };

  // Document Styling & Themes
  styling?: {
    fontFamily?: 'helvetica' | 'times' | 'courier';
    themeColor?: 'emerald' | 'navy' | 'monochrome' | 'slate' | 'amber';
    tableDensity?: 'compact' | 'normal' | 'spacious';
    watermark?: string;
    includeVerificationQR?: boolean;
    verificationQRText?: string;
  };

  // Automatic Page Numbering
  pageNumbering?: {
    enabled?: boolean;
    position?: 'bottom_center' | 'bottom_right' | 'top_right';
    format?: 'halaman_x_dari_y' | 'hal_x_per_y' | 'page_x_of_y' | 'simple_number';
  };

  // Header & Footer Styling
  headerFooter?: {
    enabled?: boolean;
    showHeaderOnAllPages?: boolean;
    runningHeader?: string;
    runningFooter?: string;
    style?: 'formal_line' | 'minimal' | 'boxed' | 'none';
    showTimestamp?: boolean;
    documentCode?: string;
  };

  // Signature options & Digital Signatures (Base64 Data URLs)
  signatures?: {
    city?: string;
    dateStr?: string;
    layout?: 'triangle' | 'side_by_side' | 'horizontal_3';
    leftSignatureImage?: string;
    rightSignatureImage?: string;
    centerSignatureImage?: string;
  };

  // Execution options
  autoSave?: boolean;
  skipDownload?: boolean;
}

export class PdfService {
  private getThemeRgb(theme: string = 'emerald'): [number, number, number] {
    switch (theme) {
      case 'navy':
        return [30, 58, 138];
      case 'monochrome':
        return [15, 23, 42];
      case 'slate':
        return [51, 65, 85];
      case 'amber':
        return [146, 64, 14];
      case 'emerald':
      default:
        return [22, 101, 52];
    }
  }

  private addKopSurat(
    doc: jsPDF,
    pageWidth: number,
    kopOptions?: BeritaAcaraOptions['kopSurat'],
    fontFamily: string = 'helvetica'
  ): number {
    if (kopOptions && kopOptions.show === false) {
      return 15; // Margin top without kop
    }

    const config = db.getConfig();
    const city = config.BA_DEFAULT_CITY || config.REPORT_SIGNATURE_CITY || 'Tangerang';

    const alignment = kopOptions?.alignment || 'dual_logo';
    const logoMode = kopOptions?.logoMode || (alignment === 'dual_logo' ? 'dual' : 'school');

    const line1 = kopOptions?.line1 || `PEMERINTAH KOTA ${city.toUpperCase()}`;
    const line2 = kopOptions?.line2 || 'DINAS PENDIDIKAN';
    const line3 =
      kopOptions?.line3 ||
      `UPT SATUAN PENDIDIKAN ${config.SCHOOL_NAME ? config.SCHOOL_NAME.toUpperCase() : 'SD NEGERI TANGERANG 6'}`;

    const subInfo =
      kopOptions?.line4 ||
      [
        `NPSN: ${config.SCHOOL_NPSN || '20606621'}`,
        config.ADDRESS || 'Jl. Perintis Kemerdekaan No. 6',
        config.SCHOOL_EMAIL ? `Email: ${config.SCHOOL_EMAIL}` : '',
        config.SCHOOL_WEBSITE ? `Web: ${config.SCHOOL_WEBSITE}` : '',
      ]
        .filter(Boolean)
        .join('  |  ');

    const borderStyle = kopOptions?.borderStyle || 'double';

    // Left & Right Logo Draw Box dimensions
    const leftMargin = 14;
    const rightMargin = pageWidth - 14;
    const logoWidth = 18;
    const logoHeight = 18;
    const logoY = 12;

    // Draw Left Logo (Pemda/City or School) if enabled
    if (logoMode === 'dual' || logoMode === 'city') {
      this.drawLogoPlaceholderOrImage(
        doc,
        leftMargin,
        logoY,
        logoWidth,
        logoHeight,
        'city',
        kopOptions?.cityLogoUrl || config.CITY_LOGO_URL
      );
    }

    // Draw Right Logo (School / Tutwuri) if dual logo mode
    if (logoMode === 'dual' || logoMode === 'school') {
      const rightX = rightMargin - logoWidth;
      this.drawLogoPlaceholderOrImage(
        doc,
        logoMode === 'dual' ? rightX : leftMargin,
        logoY,
        logoWidth,
        logoHeight,
        'school',
        kopOptions?.schoolLogoUrl || config.SCHOOL_LOGO_URL
      );
    }

    // Text Positioning
    let textCenterX = pageWidth / 2;
    let textAlign: 'center' | 'left' = 'center';

    if (alignment === 'left') {
      textCenterX = logoMode !== 'none' ? leftMargin + logoWidth + 4 : leftMargin;
      textAlign = 'left';
    }

    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(line1, textCenterX, 14, { align: textAlign });

    doc.setFontSize(10.5);
    doc.text(line2, textCenterX, 19, { align: textAlign });

    doc.setFontSize(12.5);
    doc.text(line3, textCenterX, 25, { align: textAlign });

    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    if (textAlign === 'left') {
      const splitSub = doc.splitTextToSize(subInfo, pageWidth - textCenterX - 14);
      doc.text(splitSub, textCenterX, 30);
    } else {
      doc.text(subInfo, textCenterX, 30.5, { align: 'center' });
    }

    // Border line beneath Kop Surat
    const lineY = 34;
    doc.setDrawColor(30, 41, 59);

    if (borderStyle === 'double') {
      doc.setLineWidth(0.8);
      doc.line(leftMargin, lineY, rightMargin, lineY);
      doc.setLineWidth(0.2);
      doc.line(leftMargin, lineY + 1, rightMargin, lineY + 1);
    } else if (borderStyle === 'bold') {
      doc.setLineWidth(0.9);
      doc.line(leftMargin, lineY, rightMargin, lineY);
    } else if (borderStyle === 'single') {
      doc.setLineWidth(0.3);
      doc.line(leftMargin, lineY, rightMargin, lineY);
    }

    return lineY + 7; // Returns Y start position for content
  }

  private drawLogoPlaceholderOrImage(
    doc: jsPDF,
    x: number,
    y: number,
    w: number,
    h: number,
    type: 'city' | 'school',
    url?: string
  ): void {
    // If URL is valid data URL or base64, jsPDF can embed directly
    if (url && (url.startsWith('data:image') || url.startsWith('blob:'))) {
      try {
        doc.addImage(url, 'PNG', x, y, w, h);
        return;
      } catch {
        // Fallback to vector badge
      }
    }

    // Vector Emblem drawing on PDF
    doc.saveGraphicsState();
    if (type === 'city') {
      // Draw Shield Emblem for Pemda
      doc.setFillColor(30, 58, 138); // Navy
      doc.setDrawColor(20, 40, 100);
      doc.setLineWidth(0.3);

      // Rounded Shield Top
      doc.roundedRect(x + 1, y + 1, w - 2, h - 2, 2, 2, 'FD');

      // Inner Star & Ribbons in Gold/White
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.text('KOTA', x + w / 2, y + h / 2 - 1, { align: 'center' });
      doc.setFontSize(5);
      doc.text('TGR', x + w / 2, y + h / 2 + 3, { align: 'center' });
    } else {
      // Draw Tut Wuri Handayani / School Emblem
      doc.setFillColor(22, 101, 52); // Emerald
      doc.setDrawColor(15, 80, 40);
      doc.setLineWidth(0.3);

      // Circle Emblem
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = Math.min(w, h) / 2 - 1;
      doc.circle(cx, cy, r, 'FD');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.text('TUT WURI', cx, cy - 1, { align: 'center' });
      doc.setFontSize(4.5);
      doc.text('HANDAYANI', cx, cy + 2.5, { align: 'center' });
    }
    doc.restoreGraphicsState();
  }

  private addOfficialSignatures(
    doc: jsPDF,
    startY: number,
    options?: {
      leftSigner?: { title: string; name: string; nip?: string };
      rightSigner?: { title: string; name: string; nip?: string };
      centerSigner?: { title: string; name: string; nip?: string };
      includeHeadmaster?: boolean;
      city?: string;
      dateStr?: string;
      layout?: 'triangle' | 'side_by_side' | 'horizontal_3';
      leftSignatureImage?: string;
      rightSignatureImage?: string;
      centerSignatureImage?: string;
      fontFamily?: string;
    }
  ): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const fontFamily = options?.fontFamily || 'helvetica';
    let currentY = startY;

    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = 25;
    }

    const config = db.getConfig();
    const city = options?.city || config.BA_DEFAULT_CITY || config.REPORT_SIGNATURE_CITY || 'Tangerang';
    const todayStr =
      options?.dateStr ||
      new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`${city}, ${todayStr}`, pageWidth - 18, currentY, { align: 'right' });
    currentY += 6;

    const left = options?.leftSigner || {
      title: 'Pihak Pertama (Pengurus Barang),',
      name: config.WAREHOUSE_OFFICER || 'Budi Santoso, A.Md.',
      nip: config.WAREHOUSE_OFFICER_NIP || '19920311 201903 1 008',
    };

    const right = options?.rightSigner || {
      title: 'Pihak Kedua (Penerima),',
      name: config.TREASURER || 'Siti Rahmawati, S.Pd.',
      nip: config.TREASURER_NIP || '19870921 201001 2 005',
    };

    const layout = options?.layout || 'triangle';

    if (layout === 'horizontal_3') {
      // 3 Columns in one row
      const colW = (pageWidth - 28) / 3;
      const c1X = 14 + colW * 0.5;
      const c2X = 14 + colW * 1.5;
      const c3X = 14 + colW * 2.5;

      const center = options?.centerSigner || {
        title: `Kepala UPT Satuan Pendidikan`,
        name: config.HEADMASTER || 'Hj. Sumarsih, S.Pd., M.M.',
        nip: config.HEADMASTER_NIP || '19680412 199303 2 005',
      };

      doc.text(left.title, c1X, currentY, { align: 'center' });
      doc.text(right.title, c2X, currentY, { align: 'center' });
      doc.text(center.title, c3X, currentY, { align: 'center' });

      // Embed digital signatures if available
      if (options?.leftSignatureImage) {
        try {
          doc.addImage(options.leftSignatureImage, 'PNG', c1X - 12, currentY + 2, 24, 13);
        } catch (e) {
          console.warn('Failed drawing left signature', e);
        }
      }
      if (options?.rightSignatureImage) {
        try {
          doc.addImage(options.rightSignatureImage, 'PNG', c2X - 12, currentY + 2, 24, 13);
        } catch (e) {
          console.warn('Failed drawing right signature', e);
        }
      }
      if (options?.centerSignatureImage) {
        try {
          doc.addImage(options.centerSignatureImage, 'PNG', c3X - 12, currentY + 2, 24, 13);
        } catch (e) {
          console.warn('Failed drawing center signature', e);
        }
      }

      currentY += 19;

      doc.setFont(fontFamily, 'bold');
      doc.text(left.name, c1X, currentY, { align: 'center' });
      doc.text(right.name, c2X, currentY, { align: 'center' });
      doc.text(center.name, c3X, currentY, { align: 'center' });
      currentY += 4.5;

      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(8);
      if (left.nip && left.nip !== '-') doc.text(left.nip.startsWith('NIP') ? left.nip : `NIP. ${left.nip}`, c1X, currentY, { align: 'center' });
      if (right.nip && right.nip !== '-') doc.text(right.nip.startsWith('NIP') ? right.nip : `NIP. ${right.nip}`, c2X, currentY, { align: 'center' });
      if (center.nip && center.nip !== '-') doc.text(center.nip.startsWith('NIP') ? center.nip : `NIP. ${center.nip}`, c3X, currentY, { align: 'center' });
      return;
    }

    // Default Triangle or Side by Side layout
    const col1X = 46;
    const col2X = pageWidth - 46;

    doc.text(left.title, col1X, currentY, { align: 'center' });
    doc.text(right.title, col2X, currentY, { align: 'center' });

    // Embed left & right digital signatures
    if (options?.leftSignatureImage) {
      try {
        doc.addImage(options.leftSignatureImage, 'PNG', col1X - 15, currentY + 1, 30, 15);
      } catch (e) {
        console.warn('Failed drawing left signature', e);
      }
    }
    if (options?.rightSignatureImage) {
      try {
        doc.addImage(options.rightSignatureImage, 'PNG', col2X - 15, currentY + 1, 30, 15);
      } catch (e) {
        console.warn('Failed drawing right signature', e);
      }
    }

    currentY += 19;

    doc.setFont(fontFamily, 'bold');
    doc.text(left.name, col1X, currentY, { align: 'center' });
    doc.text(right.name, col2X, currentY, { align: 'center' });
    currentY += 4.5;

    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(8.5);
    if (left.nip && left.nip !== '-') {
      doc.text(left.nip.startsWith('NIP') ? left.nip : `NIP. ${left.nip}`, col1X, currentY, {
        align: 'center',
      });
    }
    if (right.nip && right.nip !== '-') {
      doc.text(right.nip.startsWith('NIP') ? right.nip : `NIP. ${right.nip}`, col2X, currentY, {
        align: 'center',
      });
    }

    if (layout === 'triangle' && options?.includeHeadmaster !== false) {
      currentY += 8;
      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = 25;
      }
      const centerSigner = options?.centerSigner || {
        title: `Kepala UPT Satuan Pendidikan ${config.SCHOOL_NAME || 'SD Negeri Tangerang 6'}`,
        name: config.HEADMASTER || 'Hj. Sumarsih, S.Pd., M.M.',
        nip: config.HEADMASTER_NIP || '19680412 199303 2 005',
      };

      doc.setFontSize(9);
      doc.text('Mengetahui,', pageWidth / 2, currentY, { align: 'center' });
      currentY += 4.5;
      doc.text(centerSigner.title, pageWidth / 2, currentY, { align: 'center' });

      // Embed center (headmaster) digital signature
      if (options?.centerSignatureImage) {
        try {
          doc.addImage(options.centerSignatureImage, 'PNG', pageWidth / 2 - 15, currentY + 1, 30, 15);
        } catch (e) {
          console.warn('Failed drawing headmaster signature', e);
        }
      }

      currentY += 19;

      doc.setFont(fontFamily, 'bold');
      doc.text(centerSigner.name, pageWidth / 2, currentY, { align: 'center' });
      currentY += 4.5;

      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(8.5);
      const headmasterNip = centerSigner.nip || config.HEADMASTER_NIP || '19680412 199303 2 005';
      if (headmasterNip && headmasterNip !== '-') {
        doc.text(
          headmasterNip.startsWith('NIP') ? headmasterNip : `NIP. ${headmasterNip}`,
          pageWidth / 2,
          currentY,
          { align: 'center' }
        );
      }
    }
  }

  private applyHeaderFooterAndPageNumbers(
    doc: jsPDF,
    options: BeritaAcaraOptions
  ): void {
    const totalPages = doc.getNumberOfPages();
    const fontFamily = options.styling?.fontFamily || 'helvetica';
    const config = db.getConfig();
    const schoolName = config.SCHOOL_NAME || 'SD NEGERI TANGERANG 6';

    const hfOpt = options.headerFooter;
    const isHfEnabled = hfOpt?.enabled !== false;
    const runningHeader = hfOpt?.runningHeader || (isHfEnabled ? `Dokumen Resmi Inventaris — ${schoolName}` : '');
    const runningFooter = hfOpt?.runningFooter || (isHfEnabled ? `Sistem Informasi Persediaan & Aset Sekolah (SIPERSEDA)` : '');
    const showHeaderOnAll = hfOpt?.showHeaderOnAllPages ?? false;
    const hfStyle = hfOpt?.style || 'formal_line';
    const showTimestamp = hfOpt?.showTimestamp !== false;
    const documentCode = hfOpt?.documentCode || (options.docNo ? `No: ${options.docNo}` : '');

    const pnOpt = options.pageNumbering;
    const isPnEnabled = pnOpt?.enabled !== false;
    const pnPosition = pnOpt?.position || 'bottom_center';
    const pnFormat = pnOpt?.format || 'halaman_x_dari_y';

    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.saveGraphicsState();

      // 1. Running Header
      if (isHfEnabled && runningHeader && (p > 1 || showHeaderOnAll)) {
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);

        if (hfStyle === 'boxed') {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, 5, pageWidth - 28, 7, 'F');
          doc.text(runningHeader, 16, 9.5);
          if (documentCode) {
            doc.text(documentCode, pageWidth - 16, 9.5, { align: 'right' });
          }
        } else {
          doc.text(runningHeader, 14, 8.5);
          if (documentCode) {
            doc.text(documentCode, pageWidth - 14, 8.5, { align: 'right' });
          }
          if (hfStyle === 'formal_line') {
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.25);
            doc.line(14, 10.5, pageWidth - 14, 10.5);
          }
        }
      }

      // 2. Running Footer
      if (isHfEnabled && runningFooter) {
        if (hfStyle === 'formal_line') {
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.25);
          doc.line(14, pageHeight - 11, pageWidth - 14, pageHeight - 11);
        }

        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(runningFooter, 14, pageHeight - 7);

        if (showTimestamp && pnPosition !== 'bottom_right') {
          const nowStr = new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
          doc.text(`Tercetak: ${nowStr}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
        }
      }

      // 3. Page Numbering
      if (isPnEnabled) {
        let pageStr = '';
        if (pnFormat === 'halaman_x_dari_y') {
          pageStr = `Halaman ${p} dari ${totalPages}`;
        } else if (pnFormat === 'hal_x_per_y') {
          pageStr = `Hal. ${p}/${totalPages}`;
        } else if (pnFormat === 'page_x_of_y') {
          pageStr = `Page ${p} of ${totalPages}`;
        } else {
          pageStr = `${p}`;
        }

        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);

        if (pnPosition === 'bottom_center') {
          doc.text(pageStr, pageWidth / 2, pageHeight - 7, { align: 'center' });
        } else if (pnPosition === 'bottom_right') {
          doc.text(pageStr, pageWidth - 14, pageHeight - 7, { align: 'right' });
        } else if (pnPosition === 'top_right') {
          doc.text(pageStr, pageWidth - 14, 8.5, { align: 'right' });
        }
      }

      doc.restoreGraphicsState();
    }
  }

  private addWatermark(doc: jsPDF, text: string): void {
    if (!text) return;
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.saveGraphicsState();
      doc.setTextColor(226, 232, 240); // Light subtle slate
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(48);

      // Draw rotated watermark text across center
      doc.text(text.toUpperCase(), pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45,
      });
      doc.restoreGraphicsState();
    }
  }

  // --- 1. Enhanced Berita Acara Generator with full paper sizes & Kop Surat ---
  public async generateBeritaAcara(options: BeritaAcaraOptions): Promise<jsPDF> {
    // Format selection
    const paperSize = options.paperSize || 'a4';
    let format: string | [number, number] = 'a4';
    if (paperSize === 'f4') {
      format = [215, 330]; // Folio / F4 standard in mm
    } else if (paperSize === 'letter') {
      format = 'letter';
    } else if (paperSize === 'legal') {
      format = 'legal';
    }

    const orientation = options.orientation || 'portrait';
    const doc = new jsPDF({ orientation, unit: 'mm', format });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const fontFamily = options.styling?.fontFamily || 'helvetica';
    const themeRgb = this.getThemeRgb(options.styling?.themeColor || 'emerald');

    // 1. Kop Surat
    let currentY = this.addKopSurat(doc, pageWidth, options.kopSurat, fontFamily);

    // 2. Document Title
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(options.title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    // Document Number
    if (options.docNo) {
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(9.5);
      doc.text(`Nomor: ${options.docNo}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 7;
    } else {
      currentY += 3;
    }

    // 3. Opening Legal Clause
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    const splitDesc = doc.splitTextToSize(options.description, pageWidth - 28);
    doc.text(splitDesc, 14, currentY);
    currentY += splitDesc.length * 4.5 + 4;

    // 4. Transaction Table
    if (options.tableRows && options.tableRows.length > 0) {
      const tableDensity = options.styling?.tableDensity || 'normal';
      const cellPadding = tableDensity === 'compact' ? 1.5 : tableDensity === 'spacious' ? 3.5 : 2.5;
      const fontSize = tableDensity === 'compact' ? 7.5 : 8.5;

      autoTable(doc, {
        startY: currentY,
        head: [options.tableHeaders],
        body: options.tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: themeRgb,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: fontSize + 0.5,
          halign: 'center',
          font: fontFamily,
          cellPadding,
        },
        bodyStyles: {
          fontSize,
          textColor: [23, 32, 27],
          font: fontFamily,
          cellPadding,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 14, right: 14 },
      });

      // @ts-expect-error autoTable adds lastAutoTable to doc
      currentY = doc.lastAutoTable.finalY + 6;
    }

    // 5. Closing Clause
    if (options.footerText) {
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const splitFooter = doc.splitTextToSize(options.footerText, pageWidth - 28);
      doc.text(splitFooter, 14, currentY);
      currentY += splitFooter.length * 4 + 6;
    }

    // 6. Signatures
    this.addOfficialSignatures(doc, currentY, {
      leftSigner: options.leftSigner,
      rightSigner: options.rightSigner,
      centerSigner: options.centerSigner,
      includeHeadmaster: options.includeHeadmaster !== false,
      city: options.signatures?.city,
      dateStr: options.signatures?.dateStr,
      layout: options.signatures?.layout,
      leftSignatureImage: options.signatures?.leftSignatureImage,
      rightSignatureImage: options.signatures?.rightSignatureImage,
      centerSignatureImage: options.signatures?.centerSignatureImage,
      fontFamily,
    });

    // 7. Verification QR Code (Bottom Left of last page)
    if (options.styling?.includeVerificationQR) {
      const qrPayload =
        options.styling.verificationQRText ||
        `VALIDASI DOKUMEN RESMI BERITA ACARA\nNo: ${options.docNo || '-'}\nJudul: ${options.title}\nStatus: Dokumen Sah Terverifikasi SIPERSEDA`;

      try {
        const qrDataUrl = await qrService.generateQRCode(qrPayload, 180);
        if (qrDataUrl) {
          const qrX = 14;
          const qrY = pageHeight - 30;
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, 16, 16);
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text('Scan untuk Validasi Arsip', qrX + 18, qrY + 6);
          doc.text('Sistem Inventaris Sekolah', qrX + 18, qrY + 10);
        }
      } catch (err) {
        console.warn('QR Code generation skipped:', err);
      }
    }

    // 8. Header, Footer & Automatic Page Numbering
    this.applyHeaderFooterAndPageNumbers(doc, options);

    // 9. Watermark if requested
    if (options.styling?.watermark) {
      this.addWatermark(doc, options.styling.watermark);
    }

    // 9. Download / Save PDF if autoSave is true
    if (options.autoSave !== false && !options.skipDownload) {
      const safeTitle = options.title.replace(/[^A-Za-z0-9]/g, '_');
      doc.save(`${safeTitle}_${options.docNo ? options.docNo.replace(/[^A-Za-z0-9]/g, '_') : 'DOKUMEN'}.pdf`);
    }

    return doc;
  }

  public async getBeritaAcaraBlobUrl(options: BeritaAcaraOptions): Promise<string> {
    const doc = await this.generateBeritaAcara({ ...options, autoSave: false, skipDownload: true });
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
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
