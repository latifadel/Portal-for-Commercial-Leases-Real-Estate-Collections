import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

/**
 * Export data array to Excel (.xlsx) file
 */
export function exportToExcel(params: {
  filename: string;
  sheetName?: string;
  title?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  totalsRow?: Record<string, any>;
}) {
  const { filename, sheetName = 'Financial_Report', title, columns, data, totalsRow } = params;

  // Prepare table headers and rows
  const headers = columns.map(c => c.header);
  const rows = data.map(item => columns.map(col => item[col.key] ?? ''));

  const fullSheetData: (string | number)[][] = [];
  if (title) {
    fullSheetData.push([title]);
    fullSheetData.push([`Generated on: ${new Date().toLocaleString('en-GB')}`]);
    fullSheetData.push([]); // blank row
  }
  fullSheetData.push(headers);
  rows.forEach(r => fullSheetData.push(r));

  if (totalsRow) {
    const totalLine = columns.map(col => totalsRow[col.key] ?? '');
    fullSheetData.push(totalLine);
  }

  const ws = XLSX.utils.aoa_to_sheet(fullSheetData);

  // Set column widths
  ws['!cols'] = columns.map(c => ({ wch: c.width || Math.max(c.header.length + 4, 15) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export data to CSV
 */
export function exportToCSV(filename: string, columns: ExportColumn[], data: Record<string, any>[]) {
  const headers = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
  const rows = data.map(item =>
    columns
      .map(col => {
        const val = item[col.key] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n'); // UTF-8 BOM for Excel Arabic/special characters support
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export table to branded PDF
 */
export function exportToPDF(params: {
  filename: string;
  title: string;
  subtitle?: string;
  buildingName?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  summaryCards?: { label: string; value: string; color?: string }[];
  totalsRow?: Record<string, any>;
  orientation?: 'portrait' | 'landscape';
}) {
  const {
    filename,
    title,
    subtitle,
    buildingName,
    columns,
    data,
    summaryCards,
    totalsRow,
    orientation = 'landscape',
  } = params;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Header Background Band - Najdi Deep Brown #2A1A10
  doc.setFillColor(42, 26, 16);
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Gold accent line under header
  doc.setFillColor(201, 166, 107); // #C9A66B
  doc.rect(0, 23.2, pageWidth, 0.8, 'F');

  // Header Title
  doc.setTextColor(255, 253, 248); // #FFFDF8
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  const bName = buildingName || 'ALABDULLATIF TOWER';
  doc.text(`${bName.toUpperCase()} – RIYADH, KSA`, 14, 10);

  // Statement Name
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 201, 154); // Light sand #E2C99A
  doc.text(title.toUpperCase(), 14, 18);

  // Generated Timestamp
  doc.setTextColor(200, 180, 160);
  doc.setFontSize(8);
  const generatedTime = `Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  doc.text(generatedTime, pageWidth - 14, 18, { align: 'right' });

  let startY = 30;

  // Subtitle / Scope description
  if (subtitle) {
    doc.setTextColor(94, 69, 53); // Najdi-700
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(subtitle, 14, startY);
    startY += 6;
  }

  // Render KPI Summary Cards
  if (summaryCards && summaryCards.length > 0) {
    const cardGap = 3;
    const totalCardsWidth = pageWidth - 28;
    const cardWidth = (totalCardsWidth - ((summaryCards.length - 1) * cardGap)) / summaryCards.length;

    summaryCards.forEach((card, idx) => {
      const cardX = 14 + idx * (cardWidth + cardGap);
      
      // Card container
      doc.setFillColor(255, 253, 248); // #FFFDF8
      doc.setDrawColor(224, 207, 184); // #E0CFB8
      doc.roundedRect(cardX, startY, cardWidth, 14, 1.5, 1.5, 'FD');

      // Card Label
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(116, 86, 71); // Najdi-600
      doc.text(card.label.toUpperCase(), cardX + 2.5, startY + 4.5);

      // Card Value
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(42, 26, 16); // Deep Najdi Brown
      doc.text(card.value, cardX + 2.5, startY + 10.5);
    });
    startY += 18;
  }

  // Prepare table headers & rows
  const tableHeaders = columns.map(c => c.header);
  const tableRows = data.map(item => columns.map(col => String(item[col.key] ?? '')));

  // Column styles for alignments
  const columnStyles: Record<number, any> = {};
  columns.forEach((col, idx) => {
    columnStyles[idx] = {
      halign: col.align || (col.key.toLowerCase().includes('rent') || col.key.toLowerCase().includes('vat') || col.key.toLowerCase().includes('balance') || col.key.toLowerCase().includes('amount') || col.key.toLowerCase().includes('received') ? 'right' : 'left'),
    };
  });

  // Prepare footers (totals row) if provided
  const footRows = totalsRow
    ? [columns.map(col => String(totalsRow[col.key] ?? ''))]
    : undefined;

  autoTable(doc, {
    startY,
    head: [tableHeaders],
    body: tableRows,
    foot: footRows,
    theme: 'grid',
    headStyles: {
      fillColor: [74, 52, 38], // Najdi Brown #4A3426
      textColor: [255, 253, 248],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [42, 26, 16],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [247, 241, 231], // Cream-100 #F7F1E7
    },
    footStyles: {
      fillColor: [239, 229, 212], // Cream-200 #EFE5D4
      textColor: [42, 26, 16],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 2.2,
    },
    columnStyles,
    margin: { left: 14, right: 14, bottom: 12 },
    didDrawPage: (dataInfo) => {
      // Bottom footer bar
      doc.setFontSize(7);
      doc.setTextColor(140, 115, 95);
      const footerText = `Alabdullatif Tower Commercial Property Management • Confidential Financial Statement • Page ${dataInfo.pageNumber} of ${doc.getNumberOfPages()}`;
      doc.text(footerText, pageWidth / 2, pageHeight - 6, { align: 'center' });
    },
  });

  doc.save(`${filename}.pdf`);
}

/**
 * Trigger print dialog
 */
export function printReport() {
  window.print();
}
