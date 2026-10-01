import { jsPDF } from 'jspdf';
import type { BookingItem } from '../types';
import { APP_CONFIG } from '../config';
import { formatDateDDMMYYYY } from './date';

export function generateBookingVoucherPdf(booking: BookingItem) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const isRescheduled = booking.status === 'Rescheduled' || (booking.history && booking.history.length > 0);

  // Background Luxury Canvas
  doc.setFillColor(9, 14, 23); // Deep Navy (#090E17)
  doc.rect(0, 0, pageWidth, 297, 'F');

  // Gold Border Frame
  doc.setDrawColor(212, 175, 55); // Rich Gold (#D4AF37)
  doc.setLineWidth(1.2);
  doc.rect(8, 8, pageWidth - 16, 281);

  // Inner Gold Accent Line
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  doc.rect(11, 11, pageWidth - 22, 275);

  let y = 25;

  // Header - Brand
  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('TRIM & TWISTED', pageWidth / 2, y, { align: 'center' });

  y += 7;
  doc.setTextColor(230, 215, 170);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.text('BEAUTY IS YOU', pageWidth / 2, y, { align: 'center' });

  y += 6;
  doc.setTextColor(180, 190, 205);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Luxury Unisex Salon & Aesthetic Lounge', pageWidth / 2, y, { align: 'center' });

  y += 10;
  // Rescheduled Banner if applicable
  if (isRescheduled) {
    doc.setFillColor(220, 100, 30);
    doc.roundedRect(20, y, pageWidth - 40, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('APPOINTMENT RESCHEDULED', pageWidth / 2, y + 6.5, { align: 'center' });
    y += 16;
  } else {
    doc.setFillColor(212, 175, 55);
    doc.roundedRect(20, y, pageWidth - 40, 8, 2, 2, 'F');
    doc.setTextColor(9, 14, 23);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('OFFICIAL APPOINTMENT PASS / VOUCHER', pageWidth / 2, y + 5.5, { align: 'center' });
    y += 14;
  }

  // Booking ID & Status Card
  doc.setFillColor(18, 26, 42);
  doc.roundedRect(18, y, pageWidth - 36, 26, 3, 3, 'F');
  doc.setDrawColor(50, 70, 100);
  doc.roundedRect(18, y, pageWidth - 36, 26, 3, 3, 'S');

  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BOOKING ID:', 24, y + 8);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(booking.bookingId, 55, y + 8);

  doc.setTextColor(212, 175, 55);
  doc.setFontSize(10);
  doc.text('STATUS:', 130, y + 8);
  doc.setTextColor(255, 230, 140);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.status.toUpperCase(), 152, y + 8);

  doc.setTextColor(170, 185, 205);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Created On: ${formatDateDDMMYYYY(booking.createdAt)}`, 24, y + 18);
  doc.text(`Assigned Pool: ${booking.poolType === 'haircut' ? 'Haircut & Styling Pool' : 'Specialized Care Pool'}`, 115, y + 18);

  y += 34;

  // Rescheduled Old vs New Info Card
  if (isRescheduled && booking.history && booking.history.length > 0) {
    const lastChange = booking.history[booking.history.length - 1];
    doc.setFillColor(32, 24, 20);
    doc.roundedRect(18, y, pageWidth - 36, 18, 2, 2, 'F');
    doc.setDrawColor(200, 120, 50);
    doc.roundedRect(18, y, pageWidth - 36, 18, 2, 2, 'S');

    doc.setTextColor(245, 170, 120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ORIGINAL SCHEDULE:', 24, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${formatDateDDMMYYYY(lastChange.date)} | ${lastChange.slot}`, 70, y + 7);

    doc.setTextColor(120, 230, 150);
    doc.setFont('helvetica', 'bold');
    doc.text('NEW RESCHEDULED:', 24, y + 13);
    doc.text(`${formatDateDDMMYYYY(booking.date)} | ${booking.slot}`, 70, y + 13);

    y += 24;
  }

  // Two Column Grid: Customer Details & Appointment Schedule
  const colW = (pageWidth - 42) / 2;

  // Left: Customer Details
  doc.setFillColor(18, 26, 42);
  doc.roundedRect(18, y, colW, 40, 2, 2, 'F');
  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('GUEST DETAILS', 24, y + 8);

  doc.setTextColor(220, 230, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Name: ${booking.customerName}`, 24, y + 16);
  doc.text(`Phone: ${booking.customerPhone}`, 24, y + 23);
  doc.text(`Email: ${booking.customerEmail || 'N/A'}`, 24, y + 30);
  if (booking.stylistName) {
    doc.text(`Stylist: ${booking.stylistName}`, 24, y + 37);
  }

  // Right: Schedule Details
  doc.setFillColor(18, 26, 42);
  doc.roundedRect(22 + colW, y, colW, 40, 2, 2, 'F');
  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('APPOINTMENT TIME', 28 + colW, y + 8);

  doc.setTextColor(220, 230, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date: ${formatDateDDMMYYYY(booking.date)}`, 28 + colW, y + 16);
  doc.text(`Time Slot: ${booking.slot}`, 28 + colW, y + 23);
  doc.setTextColor(255, 215, 120);
  doc.setFont('helvetica', 'bold');
  doc.text('Advance Reservation Confirmed', 28 + colW, y + 32);

  y += 48;

  // Selected Services Table
  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SELECTED SALON SERVICES', 18, y);
  y += 5;

  // Table Header
  doc.setFillColor(28, 38, 58);
  doc.rect(18, y, pageWidth - 36, 7, 'F');
  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Service Item', 24, y + 5);
  doc.text('Type', 120, y + 5);
  doc.text('Amount (INR)', pageWidth - 24, y + 5, { align: 'right' });
  y += 8;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  booking.services.forEach((srv) => {
    doc.setTextColor(230, 235, 245);
    // Truncate name if too long
    const srvName = srv.name.length > 48 ? srv.name.substring(0, 46) + '...' : srv.name;
    doc.text(srvName, 24, y + 4);

    doc.setTextColor(170, 185, 205);
    doc.text(srv.isHaircut ? 'Haircut Pool' : 'Salon Care', 120, y + 4);

    doc.setTextColor(255, 255, 255);
    const priceText = srv.price !== null ? `₹${srv.price}` : (srv.priceLabel || 'Package');
    doc.text(priceText, pageWidth - 24, y + 4, { align: 'right' });

    y += 7;
  });

  // Divider
  doc.setDrawColor(50, 70, 100);
  doc.setLineWidth(0.3);
  doc.line(18, y, pageWidth - 18, y);
  y += 6;

  // Financial Summary Box
  const summaryX = pageWidth - 90;
  doc.setFontSize(9);

  doc.setTextColor(170, 185, 205);
  doc.text('Subtotal:', summaryX, y);
  doc.setTextColor(255, 255, 255);
  doc.text(`₹${booking.subtotal}`, pageWidth - 24, y, { align: 'right' });
  y += 5;

  if (booking.discount > 0) {
    doc.setTextColor(120, 230, 150);
    doc.text(`Discount (${booking.couponCode || 'Promo'}):`, summaryX, y);
    doc.text(`- ₹${booking.discount}`, pageWidth - 24, y, { align: 'right' });
    y += 5;
  }

  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Payable at Salon:', summaryX, y);
  doc.text(`₹${booking.totalAmount}`, pageWidth - 24, y, { align: 'right' });
  y += 10;

  // Payment Rule Callout
  doc.setFillColor(34, 46, 28); // Luxury Green subtle
  doc.roundedRect(18, y, pageWidth - 36, 11, 2, 2, 'F');
  doc.setTextColor(160, 240, 170);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('✓ ZERO ADVANCE PAYMENT REQUIRED: PAY AFTER SERVICE AT THE SALON', pageWidth / 2, y + 7, { align: 'center' });
  y += 17;

  // Salon Location & Contact Footer in Pass
  doc.setFillColor(18, 26, 42);
  doc.roundedRect(18, y, pageWidth - 36, 26, 2, 2, 'F');

  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SALON LOCATION & DIRECT ASSISTANCE', 24, y + 7);

  doc.setTextColor(200, 215, 230);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Address: ${APP_CONFIG.address}`, 24, y + 13);
  doc.text(`Phone / WhatsApp: ${APP_CONFIG.formattedPhone} (${APP_CONFIG.phone})`, 24, y + 19);
  doc.text(`Directions: ${APP_CONFIG.googleMapsUrl}`, 24, y + 24);

  // Save the PDF
  const filename = `${booking.bookingId}_TrimTwisted_Pass.pdf`;
  doc.save(filename);
}
