import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PayoutCycle, DailyReport, UserProfile } from '../types';

export function generateCyclePDF(cycle: PayoutCycle, reports: DailyReport[], user: UserProfile) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor: [number, number, number] = [13, 148, 136]; // Teal/Emerald #0d9488
  const secondaryColor: [number, number, number] = [30, 41, 59]; // Slate #1e293b

  // 1. Header Banner
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 0, 210, 36, 'F');

  // Decorative Accent Line
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 36, 210, 2, 'F');

  // Req 1: Delivery Partner Name dynamically loaded (e.g. deliveryPartner: "Flipkart" -> "FLIPKART DELIVERY NETWORK")
  const partnerName = (user.deliveryPartner || 'Flipkart').trim().toUpperCase();
  const pdfTitle = `${partnerName} DELIVERY NETWORK`;

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(pdfTitle, 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('Delivery Partner Bi-Monthly Payout Statement', 14, 26);

  // Cycle Badge (Top Right)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(140, 10, 56, 16, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`CYCLE ${cycle.cycleType}`, 148, 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${cycle.monthName} ${cycle.year}`, 148, 22);

  // 2. Partner Details & Summary Info
  let yPos = 48;

  // Req 4: Box 1 - Delivery Boy Name, Employee ID (employeeId : 100001563365), and Phone Number
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, yPos, 90, 34, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('DELIVERY PARTNER', 20, yPos + 8);

  const empId = user.employeeId || user.partnerId || '100001563365';

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(user.name || 'Delivery Boy', 20, yPos + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Employee ID: ${empId}`, 20, yPos + 22);
  doc.text(`Phone: ${user.phone || '8469461255'}`, 20, yPos + 27);

  // Req 2: Box 2 - Billing Cycle Info (Date range formatting e.g. "16 to 31 Jun 2026", bg color & suitable color)
  doc.setDrawColor(186, 230, 253); // Light cyan border
  doc.setFillColor(240, 249, 255); // Soft vibrant cyan tint
  doc.roundedRect(108, yPos, 88, 34, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CYCLE STATEMENT DATES', 114, yPos + 8);

  const startDay = cycle.startDate ? cycle.startDate.split('-')[2] : '16';
  const endDay = cycle.endDate ? cycle.endDate.split('-')[2] : '31';
  const monthAbbr = cycle.monthName ? cycle.monthName.substring(0, 3) : 'Jun';
  const formattedDates = `${startDay} to ${endDay} ${monthAbbr} ${cycle.year || 2026}`;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // Suitable accent royal blue color
  doc.text(`Period: ${formattedDates}`, 114, yPos + 16);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Statement ID: ${cycle.cycleId}-${empId}`, 114, yPos + 22);
  doc.text(`Status: ${cycle.verifiedCount === reports.length && reports.length > 0 ? 'FULLY VERIFIED' : 'PROVISIONAL / AUDITED'}`, 114, yPos + 27);

  yPos += 42;

  // 3. Key Financial Summary Cards (3 Columns)
  const cardWidth = 58;
  const cardHeight = 22;

  // Card 1: Completed Parcels
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(14, yPos, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(6, 95, 70);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL COMPLETED', 18, yPos + 7);
  doc.setFontSize(14);
  doc.text(`${cycle.totalCompleted} Parcels`, 18, yPos + 16);

  // Card 2: Returned Parcels
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(76, yPos, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14);
  doc.text('RETURNED PARCELS', 80, yPos + 7);
  doc.setFontSize(14);
  doc.text(`${cycle.totalReturned} Parcels`, 80, yPos + 16);

  // Card 3: Total Net Earnings
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(30, 41, 59);
  doc.roundedRect(138, yPos, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('NET EARNINGS', 142, yPos + 7);
  doc.setFontSize(14);
  doc.setTextColor(52, 211, 153);
  doc.text(`Rs. ${cycle.totalEarning.toLocaleString('en-IN')}`, 142, yPos + 16);

  yPos += 30;

  // 4. Rate Slab Notice Banner
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, yPos, 182, 8, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(71, 85, 105);
  doc.text('Rate Rule Applied: Completed Parcels <= 70 @ Rs.16/parcel | Completed Parcels > 70 @ Rs.17/parcel (Applied to all parcels for that day).', 18, yPos + 5.5);

  yPos += 14;

  // 5. Req 3: Daily Breakdown Table (Remove Status column & Add Total parcels: Date, Total, Completed, Returned, Rate Applied, Earning)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('DAILY REPORTING BREAKDOWN', 14, yPos);

  yPos += 4;

  const sortedCycleReports = [...reports].sort((a, b) => a.date.localeCompare(b.date));

  const tableData = sortedCycleReports.map((r, index) => {
    const totalP = r.totalParcels ?? (r.completedParcels + r.returnParcels);
    return [
      (index + 1).toString(),
      r.date,
      totalP.toString(),
      r.completedParcels.toString(),
      r.returnParcels.toString(),
      `Rs. ${r.rateApplied}`,
      `Rs. ${r.earning.toLocaleString('en-IN')}`
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Date', 'Total', 'Completed', 'Returned', 'Rate Applied', 'Earning']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: secondaryColor as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 28 },
      2: { halign: 'center', cellWidth: 24 }, // Total
      3: { halign: 'center', cellWidth: 26 }, // Completed
      4: { halign: 'center', cellWidth: 24 }, // Returned
      5: { halign: 'center', cellWidth: 32 }, // Rate Applied
      6: { halign: 'right', cellWidth: 38, fontStyle: 'bold' } // Earning
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85]
    },
    foot: [
      [
        '',
        'TOTALS',
        (cycle.totalCompleted + cycle.totalReturned).toString(),
        cycle.totalCompleted.toString(),
        cycle.totalReturned.toString(),
        '',
        `Rs. ${cycle.totalEarning.toLocaleString('en-IN')}`
      ]
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: secondaryColor as [number, number, number],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    }
  });

  // 6. Footer & Certification Seal
  const finalY = (doc as any).lastAutoTable.finalY || 240;

  if (finalY < 250) {
    doc.setDrawColor(226, 232, 240);
    doc.line(14, finalY + 12, 196, finalY + 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('This is an computer-generated payout report statement issued by Delivery Partner Business Systems.', 14, finalY + 18);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Verified by Admin Panel System`, 14, finalY + 22);

    // Stamp
    doc.setDrawColor(13, 148, 136);
    doc.roundedRect(150, finalY + 14, 44, 12, 2, 2, 'D');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 148, 136);
    doc.text('SYSTEM VERIFIED', 156, finalY + 19);
    doc.text('OFFICIAL RECORD', 156, finalY + 23);
  }

  // 7. Save PDF File
  const filename = `Payout_Report_${empId}_${cycle.cycleId}.pdf`;
  doc.save(filename);
}
