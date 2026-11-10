import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { letterheadBase64 } from './letterhead';
import { resolveAssetUrl, fetchSchoolProfile } from './branding';
import { getTenantSlug } from '../services/api';

/**
 * Resolve active school profile from parameter, backend or localStorage
 */
export async function getActiveSchoolProfile(schoolInfo) {
    if (schoolInfo && (schoolInfo.schoolName || schoolInfo.affiliationBoard || schoolInfo.boardAffiliationNumber)) {
        return schoolInfo;
    }

    // 1. Fetch live full profile from public school profile endpoint
    try {
        const slug = getTenantSlug();
        const profile = await fetchSchoolProfile(slug);
        if (profile && (profile.name || profile.schoolName)) {
            return profile;
        }
    } catch (e) {}

    // 2. Check localStorage cached school profile
    try {
        const storedProfile = localStorage.getItem("schoolProfile") || localStorage.getItem("activeSchool");
        if (storedProfile) {
            const parsed = JSON.parse(storedProfile);
            if (parsed && (parsed.name || parsed.schoolName)) return parsed;
        }
    } catch (e) {}

    // 3. Check user stored data ONLY if it has school fields (NOT just user's personal name/email)
    try {
        const stored = localStorage.getItem("financeUser") || localStorage.getItem("adminUser") || localStorage.getItem("user");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.school && typeof parsed.school === 'object') {
                return parsed.school;
            }
            if (parsed && (parsed.schoolName || parsed.affiliationBoard || parsed.boardAffiliationNumber || parsed.schoolCode)) {
                return {
                    name: parsed.schoolName,
                    motto: parsed.schoolMotto || parsed.motto,
                    trustName: parsed.trustName || parsed.motto,
                    logoUrl: parsed.logoUrl || parsed.logo_url,
                    affiliationBoard: parsed.affiliationBoard || parsed.affiliation_board || "CBSE",
                    boardAffiliationNumber: parsed.boardAffiliationNumber || parsed.board_affiliation_number,
                    schoolCode: parsed.schoolCode || parsed.school_code,
                    address: parsed.schoolAddress || parsed.address,
                    city: parsed.schoolCity || parsed.city,
                    state: parsed.schoolState || parsed.state,
                    pincode: parsed.schoolPincode || parsed.pincode,
                    officialPhone: parsed.schoolPhone || parsed.officialPhone || parsed.phone,
                    officialEmail: parsed.schoolEmail || parsed.officialEmail || parsed.email,
                    website: parsed.schoolWebsite || parsed.website
                };
            }
        }
    } catch (e) {}

    return null;
}

/**
 * Preload an image URL into a base64 string for jsPDF
 */
export function loadImageAsBase64(url) {
    return new Promise((resolve) => {
        if (!url) return resolve(null);
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width || 100;
                canvas.height = img.naturalHeight || img.height || 100;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } catch (err) {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

/**
 * Export array of objects to an Excel (.xlsx) file
 * @param {Array<Object>} data - Array of JSON objects
 * @param {string} fileName - Base file name (without .xlsx)
 */
export const exportToExcel = (data, fileName = "export") => {
    try {
        if (!data || data.length === 0) return;
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    } catch (error) {
        console.error("Error exporting to Excel", error);
        alert("Failed to export Excel: " + error.message);
    }
};

/**
 * Export data to a PDF file with dynamic school header
 * @param {Array<string>} columns - Array of column headers
 * @param {Array<Array<any>>} data - 2D array of row data
 * @param {string} fileName - Base file name (without .pdf)
 * @param {string} title - Title to print at the top of the PDF
 */
export const exportToPDF = async (columns, data, fileName = "export", title = "Exported Data") => {
    try {
        if (!data || data.length === 0) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        const storedSchool = await getActiveSchoolProfile();
        const slug = (storedSchool?.slug || storedSchool?.schoolSlug || getTenantSlug() || '').toLowerCase();
        const isVision = slug === 'vision';
        const schoolName = (storedSchool?.name || storedSchool?.schoolName || (isVision ? "Vision International School" : "School Campus")).toUpperCase();

        if (isVision && letterheadBase64) {
            doc.addImage(letterheadBase64, 'PNG', 0, 0, pageWidth, 40);
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text(title, 14, 50);
            
            autoTable(doc, {
                startY: 55,
                head: [columns],
                body: data,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [27, 139, 59] }
            });
        } else {
            // Dynamic School Letterhead Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(15);
            doc.setTextColor(21, 128, 61);
            doc.text(schoolName, pageWidth / 2, 16, { align: "center" });

            const board = storedSchool?.affiliationBoard || storedSchool?.affiliation_board || 'CBSE';
            const affilNo = storedSchool?.boardAffiliationNumber || storedSchool?.board_affiliation_number || (isVision ? '1131336' : '2130889');
            const schoolCode = storedSchool?.schoolCode || storedSchool?.school_code || (isVision ? '31323' : '60401');
            const codes = [affilNo ? `${board} Affil No: ${affilNo}` : null, schoolCode ? `School Code: ${schoolCode}` : null].filter(Boolean).join(" | ");

            if (codes) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(71, 85, 105);
                doc.text(codes, pageWidth / 2, 22, { align: "center" });
            }

            const addressParts = [
                storedSchool?.schoolAddress || storedSchool?.address || (isVision ? "Survey No. 1155/26/5A Gujar Mala" : "Sector 128, Expressway"),
                storedSchool?.schoolCity || storedSchool?.city || (isVision ? "Shirur Dist.-Pune" : "Noida"),
                storedSchool?.schoolState || storedSchool?.state || (isVision ? "Maharashtra" : "Uttar Pradesh"),
                (storedSchool?.schoolPincode || storedSchool?.pincode) ? `Pin: ${storedSchool?.schoolPincode || storedSchool?.pincode}` : (isVision ? "Pin code -412210" : "Pin: 201304")
            ].filter(Boolean);
            const address = addressParts.join(", ");
            if (address) {
                doc.setFontSize(7.5);
                doc.setTextColor(100, 116, 139);
                doc.text(address, pageWidth / 2, 26, { align: "center" });
            }

            const contactPhone = storedSchool?.officialPhone || storedSchool?.schoolPhone || storedSchool?.phone || (isVision ? "9168003333" : "9876543210");
            const officialEmail = storedSchool?.officialEmail || storedSchool?.schoolEmail || storedSchool?.email || (isVision ? "vis.shirur@gmail.com" : "admin@arcschool.in");
            const website = storedSchool?.website || storedSchool?.schoolWebsite || (isVision ? "www.visionshirur.com" : "www.arcschool.in");
            const contacts = [`Tel: ${contactPhone}`, `Email: ${officialEmail}`, website].filter(Boolean).join(" | ");
            if (contacts) {
                doc.setFontSize(7);
                doc.setTextColor(100, 116, 139);
                doc.text(contacts, pageWidth / 2, 30, { align: "center" });
            }

            doc.setDrawColor(21, 128, 61);
            doc.setLineWidth(0.6);
            doc.line(14, 33, pageWidth - 14, 33);
            doc.setLineWidth(0.2);
            doc.line(14, 34.2, pageWidth - 14, 34.2);

            doc.setFontSize(13);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.text(title, 14, 42);

            autoTable(doc, {
                startY: 47,
                head: [columns],
                body: data,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [27, 139, 59] }
            });
        }
        
        doc.save(`${fileName}.pdf`);
    } catch (error) {
        console.error("Error exporting to PDF", error);
        alert("Failed to export PDF: " + error.message);
    }
};

/**
 * Generate a dynamic PDF receipt for a fee payment
 * @param {Object|Array} paymentsInput - Payment details object or array of payment objects
 * @param {Object} student - Student details object
 * @param {Object} receipt - Receipt metadata
 * @param {Object} schoolInfo - Optional explicit school profile
 */
export const generateReceiptPDF = async (paymentsInput, student, receipt, schoolInfo) => {
    try {
        if (!paymentsInput || !student) return;

        const payments = Array.isArray(paymentsInput) ? paymentsInput : [paymentsInput];
        if (payments.length === 0) return;

        const firstPayment = payments[0];
        const doc = new jsPDF('landscape', 'mm', 'a4');
        const halfWidth = 297 / 2; // 148.5 mm

        const sanitize = (str) => str ? String(str).replace(/₹/g, 'Rs. ') : str;

        const tableData = payments.flatMap(p => {
            let title = p.fee?.title || p.fee_title || p.fee_name || p.feeName || p.title;
            if ((!title || title === "General Fee" || title === "Fee" || title === "Combined Fee Payment" || title === "Fee Payment") && p.remarks) {
                title = p.remarks.startsWith("Fee Payment: ") ? p.remarks.replace("Fee Payment: ", "").trim() : p.remarks.trim();
            }
            if (!title) title = "School Fee";
            title = title.replace(/\(\+₹0 Late Fee\)/g, "").replace(/\(\+Rs\. 0 Late Fee\)/g, "").trim();
            
            let amount = p.amount_paid || 0;
            return [[sanitize(title), amount, "", sanitize(title), amount]];
        });

        const totalAmountPaid = payments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
        const paymentMode = sanitize(firstPayment.payment_mode || 'Cash');

        tableData.push([
            { content: 'Total Amount Paid:', styles: { fontStyle: 'bold', halign: 'right' } },
            { content: `Rs. ${totalAmountPaid}/-`, styles: { fontStyle: 'bold', halign: 'right' } },
            "",
            { content: 'Total Amount Paid:', styles: { fontStyle: 'bold', halign: 'right' } },
            { content: `Rs. ${totalAmountPaid}/-`, styles: { fontStyle: 'bold', halign: 'right' } }
        ]);
        tableData.push([
            { content: 'Payment Mode:', styles: { fontStyle: 'bold', halign: 'right' } },
            { content: paymentMode, styles: { halign: 'right' } },
            "",
            { content: 'Payment Mode:', styles: { fontStyle: 'bold', halign: 'right' } },
            { content: paymentMode, styles: { halign: 'right' } }
        ]);
        
        let remarksText = receipt?.remarks ? sanitize(receipt.remarks) : "";
        if (!remarksText) {
            const customRemarks = payments.map(p => p.remarks).filter(r => r && !r.startsWith("Fee Payment: "));
            if (customRemarks.length > 0) {
                remarksText = sanitize([...new Set(customRemarks)].join("; "));
            }
        }

        // Avoid duplicating remarks if it's identical to the single fee item title
        const primaryTitle = payments.length === 1 ? sanitize(payments[0].fee?.title || payments[0].fee_title || payments[0].remarks) : null;
        if (remarksText && remarksText !== primaryTitle) {
            tableData.push([
                { content: 'Remarks:', styles: { fontStyle: 'bold', halign: 'right' } },
                { content: remarksText, styles: { halign: 'right' } },
                "",
                { content: 'Remarks:', styles: { fontStyle: 'bold', halign: 'right' } },
                { content: remarksText, styles: { halign: 'right' } }
            ]);
        }

        // Fetch active school details for dynamic letterhead
        const school = await getActiveSchoolProfile(schoolInfo);
        const slug = (school?.slug || school?.schoolSlug || getTenantSlug() || '').toLowerCase();
        const isVision = slug === 'vision';

        const schoolName = (
            school?.name || 
            school?.schoolName || 
            school?.school_name || 
            (isVision ? "Vision International School" : "ARC School")
        ).toUpperCase();

        const trustName = 
            school?.trustName || 
            school?.schoolMotto || 
            school?.motto || 
            (isVision ? "Pokharana Educational Trust's" : "Inspiring Excellence, Empowering Minds");

        const rawLogo = school?.logoUrl || school?.logo_url;
        const logoUrl = rawLogo ? resolveAssetUrl(rawLogo) : (isVision ? "/vis_logo.png" : "/logo.png");
        let logoBase64 = null;
        try {
            logoBase64 = await loadImageAsBase64(logoUrl);
        } catch (e) {}

        // Address parts with guaranteed fallback for both ARC and Vision
        const addressParts = [
            school?.schoolAddress || school?.address || (isVision ? "Survey No. 1155/26/5A Gujar Mala" : "Sector 128, Expressway"),
            school?.schoolCity || school?.city || (isVision ? "Shirur Dist.-Pune" : "Noida"),
            school?.schoolState || school?.state || (isVision ? "Maharashtra" : "Uttar Pradesh"),
            (school?.schoolPincode || school?.pincode) 
                ? `Pin: ${school?.schoolPincode || school?.pincode}` 
                : (isVision ? "Pin code -412210" : "Pin: 201304")
        ].filter(Boolean);
        const addressText = addressParts.join(", ");

        // Codes with guaranteed fallback for both ARC and Vision
        const affiliationBoard = school?.affiliationBoard || school?.affiliation_board || "CBSE";
        const affilNumber = school?.boardAffiliationNumber || school?.board_affiliation_number || school?.affiliation_number || (isVision ? "1131336" : "2130889");
        const schoolCode = school?.schoolCode || school?.school_code || (isVision ? "31323" : "60401");
        const udiseCode = school?.udiseCode || school?.udise_code || (isVision ? "27251210534" : "");
        const codesList = [];
        if (udiseCode) codesList.push(`UDISE: ${udiseCode}`);
        if (affilNumber) codesList.push(`${affiliationBoard} Affil No: ${affilNumber}`);
        if (schoolCode) codesList.push(`School Code: ${schoolCode}`);
        const codesText = codesList.join(" | ");

        // Contact with guaranteed fallback for both ARC and Vision
        const phone = school?.officialPhone || school?.schoolPhone || school?.phone || (isVision ? "9168003333 / 4444" : "9876543210");
        const email = school?.officialEmail || school?.schoolEmail || school?.email || (isVision ? "vis.shirur@gmail.com" : "admin@arcschool.in");
        const website = school?.website || school?.schoolWebsite || (isVision ? "www.visionshirur.com" : "www.arcschool.in");
        const contactList = [];
        if (phone) contactList.push(`Tel: ${phone}`);
        if (email) contactList.push(`Email: ${email}`);
        if (website) contactList.push(website);
        const contactText = contactList.join(" | ");

        const drawHeadersAndFooter = (data) => {
            const pageDoc = data.doc;
            
            // Draw Dashed Line in Middle
            pageDoc.setLineWidth(0.5);
            pageDoc.setLineDashPattern([2, 2], 0);
            pageDoc.line(halfWidth, 5, halfWidth, 205);
            pageDoc.setLineDashPattern([], 0); // reset
            
            const drawSideHeader = (offsetX, isSchoolCopy) => {
                if (isVision && !rawLogo && letterheadBase64) {
                    // Pre-rendered banner for Vision when no custom logo exists
                    pageDoc.addImage(letterheadBase64, 'PNG', offsetX, 0, halfWidth, 40);
                } else {
                    // Dynamic Professional School Letterhead
                    if (logoBase64) {
                        try {
                            pageDoc.addImage(logoBase64, 'PNG', offsetX + 8, 4.5, 23, 23);
                        } catch (e) {}
                    }

                    const textCenterX = offsetX + (halfWidth / 2) + (logoBase64 ? 8 : 0);

                    if (trustName) {
                        pageDoc.setFont("helvetica", "bold");
                        pageDoc.setFontSize(8);
                        pageDoc.setTextColor(21, 128, 61);
                        pageDoc.text(trustName, textCenterX, 8, { align: "center" });
                    }

                    pageDoc.setFont("helvetica", "bold");
                    pageDoc.setFontSize(13);
                    pageDoc.setTextColor(15, 23, 42);
                    pageDoc.text(schoolName, textCenterX, trustName ? 14 : 10.5, { align: "center" });

                    if (codesText) {
                        pageDoc.setFont("helvetica", "normal");
                        pageDoc.setFontSize(7.5);
                        pageDoc.setTextColor(71, 85, 105);
                        pageDoc.text(codesText, textCenterX, trustName ? 18.5 : 15, { align: "center" });
                    }

                    if (addressText) {
                        pageDoc.setFontSize(7);
                        pageDoc.setTextColor(100, 116, 139);
                        pageDoc.text(addressText, textCenterX, trustName ? 22.5 : 19, { align: "center" });
                    }

                    if (contactText) {
                        pageDoc.setFontSize(7);
                        pageDoc.setTextColor(100, 116, 139);
                        pageDoc.text(contactText, textCenterX, trustName ? 26.5 : 23, { align: "center" });
                    }

                    // Double Border Line
                    pageDoc.setDrawColor(21, 128, 61);
                    pageDoc.setLineWidth(0.6);
                    pageDoc.line(offsetX + 8, 30.5, offsetX + halfWidth - 8, 30.5);
                    pageDoc.setLineWidth(0.2);
                    pageDoc.line(offsetX + 8, 31.7, offsetX + halfWidth - 8, 31.7);
                    pageDoc.setDrawColor(0);
                }

                // Receipt Title
                pageDoc.setFontSize(13);
                pageDoc.setFont("helvetica", "bold");
                pageDoc.setTextColor(0);
                pageDoc.text("FEE RECEIPT", offsetX + halfWidth / 2, 48, { align: "center" });
                
                // Subtitle
                pageDoc.setFontSize(9);
                pageDoc.setFont("helvetica", "normal");
                pageDoc.setTextColor(100);
                pageDoc.text(isSchoolCopy ? "(School Copy)" : "(Parent Copy)", offsetX + halfWidth / 2, 53, { align: "center" });
                
                pageDoc.setLineWidth(0.5);
                pageDoc.line(offsetX + 10, 58, offsetX + halfWidth - 10, 58);

                // Receipt details
                pageDoc.setFontSize(9.5);
                pageDoc.setTextColor(0);
                const receiptIdText = receipt?.receipt_number ? `REC-${String(receipt.receipt_number).padStart(6, '0')}` : `RCT-${String(firstPayment.id || '').substring(0, 8).toUpperCase() || Date.now()}`;
                pageDoc.text(`Receipt No: ${receiptIdText}`, offsetX + 10, 66);
                pageDoc.text(`Date: ${new Date(receipt?.created_at || firstPayment.created_at || Date.now()).toLocaleDateString()}`, offsetX + halfWidth - 10, 66, { align: 'right' });
                
                let safeName = student.name || 'N/A';
                if (safeName.length > 35) {
                    safeName = safeName.substring(0, 32) + '...';
                }
                pageDoc.text(`Student Name: ${safeName}`, offsetX + 10, 72.5);
                pageDoc.text(`Admission No: ${student.admission_number || 'N/A'}`, offsetX + halfWidth - 10, 72.5, { align: 'right' });

                let rawClass = 
                    student?.className || 
                    student?.class_name || 
                    student?.class || 
                    student?.standard || 
                    student?.grade || 
                    firstPayment?.class_name || 
                    firstPayment?.className || 
                    firstPayment?.student?.className || 
                    firstPayment?.student?.class_name || 
                    firstPayment?.student?.class || 
                    receipt?.class_name || 
                    receipt?.className || 
                    '';

                if (typeof rawClass === 'object' && rawClass !== null) {
                    rawClass = rawClass.name || rawClass.title || rawClass.className || '';
                }

                let safeClass = String(rawClass || '').trim();
                const section = student?.section || firstPayment?.section || firstPayment?.student?.section;
                if (section && safeClass && safeClass !== 'N/A' && !safeClass.toLowerCase().includes(String(section).toLowerCase())) {
                    safeClass = `${safeClass} - ${section}`;
                } else if (!safeClass && section) {
                    safeClass = String(section);
                }

                if (!safeClass) {
                    safeClass = 'N/A';
                }

                pageDoc.text(`Class: ${safeClass}`, offsetX + 10, 79);
                
                pageDoc.setFontSize(8);
                pageDoc.setTextColor(150);
                pageDoc.text("This is a computer generated receipt.", offsetX + halfWidth / 2, 200, { align: "center" });
            };
            
            drawSideHeader(0, true);
            drawSideHeader(halfWidth, false);
            
            // Draw Signature on every page
            pageDoc.setFontSize(10);
            pageDoc.setFont("helvetica", "normal");
            pageDoc.setTextColor(0);
            
            pageDoc.text("Authorized Signatory", halfWidth - 10, 190, { align: 'right' });
            pageDoc.line(halfWidth - 50, 185, halfWidth - 10, 185);
            
            pageDoc.text("Authorized Signatory", 297 - 10, 190, { align: 'right' });
            pageDoc.line(297 - 50, 185, 297 - 10, 185);
        };

        autoTable(doc, {
            startY: 85,
            head: [["Fee Name", "Amount", "", "Fee Name", "Amount"]],
            body: tableData,
            theme: 'grid',
            styles: { cellPadding: 2, fontSize: 9, textColor: [0, 0, 0] },
            headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10, halign: 'center' },
            bodyStyles: { textColor: [0, 0, 0] },
            columnStyles: {
                0: { cellWidth: 100 },
                1: { cellWidth: 28.5, halign: 'right' },
                2: { cellWidth: 20 },
                3: { cellWidth: 100 },
                4: { cellWidth: 28.5, halign: 'right' }
            },
            margin: { top: 85, left: 10, right: 10, bottom: 30 },
            didDrawPage: drawHeadersAndFooter,
            willDrawCell: (data) => {
                if (data.column.index === 2) {
                    data.cell.styles.lineWidth = 0;
                    data.cell.styles.fillColor = [255, 255, 255];
                    data.cell.styles.textColor = [255, 255, 255];
                }
            }
        });

        const safeReceiptNo = receipt?.receipt_number ? `REC-${String(receipt.receipt_number).padStart(6, '0')}` : `RCT-${String(firstPayment.id || '').substring(0, 6) || Date.now()}`;
        doc.save(`Receipt_${student.name || 'Student'}_${safeReceiptNo}.pdf`);
    } catch (error) {
        console.error("Error generating Receipt PDF", error);
        alert("Failed to generate PDF: " + error.message);
    }
};
