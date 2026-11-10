import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import RNFS from 'react-native-fs';
import { Platform, Alert } from 'react-native';
import Share from 'react-native-share';
import FileViewer from 'react-native-file-viewer';

/**
 * Universal safe helper to invoke autoTable plugin on jsPDF instance
 */
const renderAutoTable = (doc, options) => {
    try {
        if (typeof doc.autoTable === 'function') {
            doc.autoTable(options);
        } else if (typeof autoTable === 'function') {
            autoTable(doc, options);
        } else if (autoTable && typeof autoTable.default === 'function') {
            autoTable.default(doc, options);
        } else if (autoTable && typeof autoTable.autoTable === 'function') {
            autoTable.autoTable(doc, options);
        } else {
            console.warn("Could not find autoTable function on doc or module");
        }
    } catch (e) {
        console.error("autoTable error: ", e);
    }
};

/**
 * Renders a dynamic, branded school header for PDF receipts and exports
 */
export const drawSchoolHeader = (doc, schoolInfo, documentTitle, isLandscape) => {
    const sInfo = schoolInfo || {};
    const title = documentTitle || "FEE RECEIPT";
    const pageWidth = doc.internal.pageSize.getWidth();

    // Top Emerald Brand Bar (#064E3B)
    doc.setFillColor(6, 78, 59);
    doc.rect(0, 0, pageWidth, 6, 'F');

    // Golden Accent Line (#D97706)
    doc.setFillColor(217, 119, 6);
    doc.rect(0, 6, pageWidth, 1.5, 'F');

    // School Name
    const schoolName = String(sInfo.name || sInfo.school_name || 'CKR Schools').toUpperCase();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(6, 78, 59);
    doc.text(schoolName, pageWidth / 2, 17, { align: "center" });

    // Affiliation or Motto / Tagline
    let subText = String(sInfo.motto || 'Next-Gen School Operating System');
    if (sInfo.affiliation_board) {
        subText = `Affiliated to ${sInfo.affiliation_board}` + (sInfo.affiliation_number ? ` (Affiliation No: ${sInfo.affiliation_number})` : '');
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(subText, pageWidth / 2, 22, { align: "center" });

    // Address & Contact info if present
    const addrParts = [
        sInfo.address,
        sInfo.city,
        sInfo.state ? `${sInfo.state}${sInfo.pincode ? ' - ' + sInfo.pincode : ''}` : null
    ].filter(Boolean);
    const addressStr = addrParts.join(', ');

    const contactParts = [
        sInfo.phone ? `Tel: ${sInfo.phone}` : null,
        sInfo.email ? `Email: ${sInfo.email}` : null
    ].filter(Boolean);
    const contactStr = contactParts.join(' | ');

    let currY = 26;
    if (addressStr) {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(addressStr, pageWidth / 2, currY, { align: "center" });
        currY += 4;
    }
    if (contactStr) {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(contactStr, pageWidth / 2, currY, { align: "center" });
        currY += 4;
    }

    // Document Title Pill Badge
    const badgeY = currY + 1;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(pageWidth / 2 - 45, badgeY, 90, 7.5, 2, 2, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(String(title).toUpperCase(), pageWidth / 2, badgeY + 5.2, { align: "center" });

    // Subtle divider rule
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, badgeY + 11, pageWidth - 14, badgeY + 11);

    return badgeY + 16;
};

/**
 * Export data to a PDF file with a table and save it to device
 */
export const exportToPDF = async (columns, data, fileName, title, schoolInfo) => {
    if (!data || data.length === 0) return;

    try {
        const doc = new jsPDF('landscape');
        const startYOffset = drawSchoolHeader(doc, schoolInfo, title || "Exported Data", true);

        renderAutoTable(doc, {
            startY: startYOffset,
            head: [columns],
            body: data,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [6, 78, 59], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            didParseCell: function (cellData) {
                if (cellData.section === 'body') {
                    const cellVal = cellData.cell && cellData.cell.text ? cellData.cell.text[0] : '';
                    const text = String(cellVal || '');
                    if (text.toUpperCase().includes('HOLIDAY')) {
                        cellData.cell.styles.fillColor = [209, 250, 229];
                        cellData.cell.styles.textColor = [16, 185, 129];
                        cellData.cell.styles.fontStyle = 'bold';
                        cellData.cell.styles.halign = 'center';
                    } else if (text === 'WEEK OFF') {
                        cellData.cell.styles.fillColor = [224, 231, 255];
                        cellData.cell.styles.textColor = [99, 102, 241];
                        cellData.cell.styles.fontStyle = 'bold';
                        cellData.cell.styles.halign = 'center';
                    } else if (text === 'Exam' || text === 'EXAM') {
                        cellData.cell.styles.fillColor = [254, 243, 199];
                        cellData.cell.styles.textColor = [245, 158, 11];
                        cellData.cell.styles.fontStyle = 'bold';
                        cellData.cell.styles.halign = 'center';
                    }
                }
            }
        });

        // Output PDF as base64 string
        const outputUri = doc.output('datauristring');
        const pdfBase64 = outputUri && outputUri.includes(',') ? outputUri.split(',')[1] : '';
        if (!pdfBase64) {
            throw new Error("Failed to generate PDF document data");
        }

        const cleanName = `${String(fileName || 'export').replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.pdf`;
        const dirPath = RNFS.CachesDirectoryPath;
        const savePath = `${dirPath}/${cleanName}`;

        await RNFS.writeFile(savePath, pdfBase64, 'base64');

        if (Platform.OS === 'android') {
            try {
                const downloadPath = `${RNFS.DownloadDirectoryPath}/${cleanName}`;
                await RNFS.writeFile(downloadPath, pdfBase64, 'base64');
            } catch (e) {
                // Scoped storage fallback
            }
        }

        try {
            await FileViewer.open(savePath, { showOpenWithDialog: true, showAppsSuggestions: true });
        } catch (viewerErr) {
            await Share.open({
                title: `Share ${title || 'Export'}`,
                url: `file://${savePath}`,
                type: 'application/pdf',
                filename: cleanName,
                showAppsToView: true
            }).catch(err => {
                if (err && err.message !== 'User did not share') {
                    console.log('Share error:', err);
                }
            });
        }
    } catch (error) {
        console.error("Error generating PDF: ", error);
        Alert.alert("PDF Export Error", String((error && error.message) || error || "Failed to generate PDF document."));
    }
};

/**
 * Generate a clean, official PDF receipt for a fee payment
 */
export const generateReceiptPDF = async (payment, student, isShare, schoolInfo) => {
    if (!payment) {
        Alert.alert("Receipt Notice", "Payment details not found for this receipt.");
        return;
    }

    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // 1. Draw dynamic school header
        const activeSchool = schoolInfo || (student && student.schoolInfo) || null;
        const startY = drawSchoolHeader(doc, activeSchool, "OFFICIAL FEE RECEIPT", false);

        // 2. Receipt metadata & Student Info Box
        const rawReceiptId = payment.display_id || payment.receipt_number || payment.id;
        const receiptCode = rawReceiptId != null
            ? String(rawReceiptId).replace(/^RCT-?/i, '').slice(0, 10).toUpperCase()
            : String(Date.now()).slice(-8);

        const paymentDateStr = payment.payment_date || payment.created_at || payment.date;
        const formattedDate = paymentDateStr
            ? new Date(paymentDateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        const studentName = (student && (student.name || student.student_name)) || 'Student';
        const admissionNo = (student && (student.admission_number || student.admission_no || student.roll_number)) || 'N/A';
        const rawClass = (student && (student.className || student.class_name || student.class)) || payment.class_name || payment.className || '';
        const safeClass = (typeof rawClass === 'object' && rawClass !== null ? rawClass.name || rawClass.className : rawClass) || 'N/A';
        const rollNo = (student && (student.roll_number || student.roll_no)) || 'N/A';

        // Student Info Container
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, startY, pageWidth - 28, 26, 2, 2, 'FD');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text("Receipt No:", 18, startY + 6);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(6, 78, 59);
        doc.text(`RCT-${receiptCode}`, 42, startY + 6);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Date:", 135, startY + 6);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(formattedDate, 150, startY + 6);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Student Name:", 18, startY + 14);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(studentName, 44, startY + 14);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Admission No:", 135, startY + 14);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(admissionNo, 162, startY + 14);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Class / Sec:", 18, startY + 22);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(safeClass, 42, startY + 22);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Roll No:", 135, startY + 22);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(rollNo, 152, startY + 22);

        // 3. Payment Particulars Table
        const sanitize = (val) => {
            if (val == null) return '';
            return String(val).replace(/₹/g, 'Rs. ');
        };

        const feeTitle = (payment.fee && payment.fee.title) || payment.title || payment.category || 'Tuition & Academic Fee';
        const paymentMode = String(payment.payment_mode || payment.payment_method || 'Online / UPI').toUpperCase();
        const amountValue = payment.amount_paid != null ? payment.amount_paid : (payment.total_paid_amount != null ? payment.total_paid_amount : (payment.amount || 0));
        const formattedAmount = `Rs. ${Number(amountValue).toLocaleString('en-IN')}/-`;

        const tableBody = [
            ["1", sanitize(feeTitle), sanitize(paymentMode), formattedAmount],
        ];

        if (payment.remarks) {
            tableBody.push(["-", `Remarks: ${sanitize(payment.remarks)}`, "-", "-"]);
        }

        renderAutoTable(doc, {
            startY: startY + 31,
            head: [["#", "Fee Description", "Payment Mode", "Amount Paid"]],
            body: tableBody,
            theme: 'grid',
            headStyles: {
                fillColor: [6, 78, 59],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 9,
                cellPadding: 4,
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [15, 23, 42],
                cellPadding: 4,
            },
            columnStyles: {
                0: { cellWidth: 12, halign: 'center' },
                1: { cellWidth: 90 },
                2: { cellWidth: 40, halign: 'center' },
                3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
            },
            margin: { left: 14, right: 14 }
        });

        const tableBottomY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || (doc.previousAutoTable && doc.previousAutoTable.finalY) || 130;

        // 4. Total Amount Highlight Box
        doc.setFillColor(236, 253, 245); // Emerald-50
        doc.setDrawColor(52, 211, 153); // Emerald-400
        doc.roundedRect(pageWidth - 94, tableBottomY + 4, 80, 14, 2, 2, 'FD');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(6, 78, 59);
        doc.text("TOTAL PAID:", pageWidth - 90, tableBottomY + 13);
        doc.setFontSize(11);
        doc.setTextColor(6, 78, 59);
        doc.text(formattedAmount, pageWidth - 18, tableBottomY + 13, { align: "right" });

        // 5. Signatory & Official Verification
        const signY = Math.min(tableBottomY + 45, 255);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.line(pageWidth - 65, signY, pageWidth - 14, signY);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text("Authorized Signatory", pageWidth - 40, signY + 5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Accounts Department", pageWidth - 40, signY + 9, { align: "center" });

        // Footer Note
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
            "This is an official computer-generated fee receipt verified by CKR Schools Operating System.",
            pageWidth / 2,
            280,
            { align: "center" }
        );

        // 6. Save & View / Share
        const outputUri = doc.output('datauristring');
        const pdfBase64 = outputUri && outputUri.includes(',') ? outputUri.split(',')[1] : '';
        if (!pdfBase64) {
            throw new Error("Failed to render receipt PDF");
        }

        const studentClean = String(studentName).replace(/[^a-zA-Z0-9_-]/g, '_');
        const paymentClean = String(receiptCode).replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `Receipt_${studentClean}_${paymentClean}_${Date.now()}.pdf`;
        const dirPath = RNFS.CachesDirectoryPath;
        const savePath = `${dirPath}/${fileName}`;

        await RNFS.writeFile(savePath, pdfBase64, 'base64');

        if (Platform.OS === 'android') {
            try {
                const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
                await RNFS.writeFile(downloadPath, pdfBase64, 'base64');
            } catch (e) {
                // Scoped storage fallback
            }
        }

        if (isShare) {
            await Share.open({
                title: 'Share Receipt',
                url: `file://${savePath}`,
                type: 'application/pdf',
                filename: fileName,
                showAppsToView: true
            }).catch(err => {
                if (err && err.message !== 'User did not share') {
                    console.log('Share error:', err);
                }
            });
        } else {
            try {
                await FileViewer.open(savePath, { showOpenWithDialog: true, showAppsSuggestions: true });
            } catch (viewerErr) {
                await Share.open({
                    title: 'Fee Receipt',
                    url: `file://${savePath}`,
                    type: 'application/pdf',
                    filename: fileName,
                    showAppsToView: true
                }).catch(err => {
                    if (err && err.message !== 'User did not share') {
                        console.log('Share error:', err);
                    }
                });
            }
        }
    } catch (error) {
        console.error("Error generating receipt: ", error);
        Alert.alert("Receipt Error", String((error && error.message) || error || "Failed to generate fee receipt."));
    }
};
