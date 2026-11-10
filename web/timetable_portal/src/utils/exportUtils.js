import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { letterheadBase64 } from './letterhead';
import { resolveAssetUrl, fetchSchoolProfile } from './branding';

export const getTenantSlug = () => {
    if (typeof window !== "undefined") {
        const host = window.location.hostname;
        const parts = host.split(".");
        if (parts.length > 2 && parts[0] !== "admin" && parts[0] !== "www" && parts[0] !== "localhost") {
            return parts[0].replace(/(admin|admission|finance|tc|teachers|academics|timetable)$/, "");
        }
        const urlParams = new URLSearchParams(window.location.search);
        const qTenant = urlParams.get("tenant") || urlParams.get("school");
        if (qTenant) return qTenant;
        try {
            const stored = localStorage.getItem("adminUser") || localStorage.getItem("financeUser") || localStorage.getItem("user");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.schoolSlug) return parsed.schoolSlug;
                if (parsed.tenant_slug) return parsed.tenant_slug;
            }
        } catch (e) {}
        const local = localStorage.getItem("tenantSlug");
        if (local) return local;
    }
    return null;
};

export async function getActiveSchoolProfile(schoolInfo) {
    if (schoolInfo && (schoolInfo.schoolName || schoolInfo.affiliationBoard || schoolInfo.boardAffiliationNumber)) {
        return schoolInfo;
    }
    try {
        const slug = getTenantSlug();
        const profile = await fetchSchoolProfile(slug);
        if (profile && (profile.name || profile.schoolName)) {
            return profile;
        }
    } catch (e) {}

    try {
        const storedProfile = localStorage.getItem("schoolProfile") || localStorage.getItem("activeSchoolProfile");
        if (storedProfile) {
            const parsed = JSON.parse(storedProfile);
            if (parsed && (parsed.name || parsed.schoolName)) return parsed;
        }
    } catch (e) {}

    try {
        const stored = localStorage.getItem("adminUser") || localStorage.getItem("user");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.school && typeof parsed.school === 'object') return parsed.school;
            if (parsed && (parsed.schoolName || parsed.boardAffiliationNumber || parsed.schoolCode)) {
                return {
                    name: parsed.schoolName,
                    motto: parsed.schoolMotto || parsed.motto,
                    trustName: parsed.trustName || parsed.schoolMotto || parsed.motto,
                    logoUrl: parsed.logoUrl || parsed.logo_url,
                    affiliationBoard: parsed.affiliationBoard || "CBSE",
                    boardAffiliationNumber: parsed.boardAffiliationNumber,
                    schoolCode: parsed.schoolCode,
                    schoolAddress: parsed.schoolAddress,
                    schoolCity: parsed.schoolCity,
                    schoolState: parsed.schoolState,
                    schoolPincode: parsed.schoolPincode,
                    officialPhone: parsed.schoolPhone,
                    officialEmail: parsed.schoolEmail,
                    website: parsed.schoolWebsite
                };
            }
        }
    } catch (e) {}
    return null;
}

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

export const exportToExcel = (data, fileName = "export", title = "Exported Data") => {
    try {
        if (!data || data.length === 0) return;
        const wb = XLSX.utils.book_new();
        const columns = Object.keys(data[0] || {});
        const wsData = [
            [title],
            [],
            columns,
            ...data.map(item => columns.map(col => item[col]))
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = columns.map(() => ({ wch: 20 }));
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    } catch (error) {
        console.error("Error exporting to Excel", error);
        alert("Failed to export Excel: " + error.message);
    }
};

export const exportToPDF = async (columns, data, fileName = "export", title = "Exported Data") => {
    try {
        if (!data || data.length === 0) return;

        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.getWidth();

        const storedSchool = await getActiveSchoolProfile();
        const slug = (storedSchool?.slug || storedSchool?.schoolSlug || getTenantSlug() || '').toLowerCase();
        const isVision = slug === 'vision';
        const schoolName = (storedSchool?.name || storedSchool?.schoolName || (isVision ? "Vision International School" : "ARC School")).toUpperCase();
        const rawLogo = storedSchool?.logoUrl || storedSchool?.logo_url;
        const logoUrl = rawLogo ? resolveAssetUrl(rawLogo) : (isVision ? "/vis_logo.png" : "/logo.png");
        let logoBase64 = null;
        try {
            logoBase64 = await loadImageAsBase64(logoUrl);
        } catch (e) {}

        if (isVision && !rawLogo && letterheadBase64) {
            doc.addImage(letterheadBase64, 'PNG', 0, 0, pageWidth, 40);
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text(title, 14, 48);

            autoTable(doc, {
                startY: 53,
                head: [columns],
                body: data,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [27, 139, 59] }
            });
        } else {
            if (logoBase64) {
                try {
                    doc.addImage(logoBase64, 'PNG', 14, 5, 24, 24);
                } catch (e) {}
            }

            const textCenterX = pageWidth / 2;

            const trustName = storedSchool?.trustName || storedSchool?.motto || storedSchool?.schoolMotto || (isVision ? "Pokharana Educational Trust's" : "Inspiring Excellence, Empowering Minds");
            if (trustName) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(8.5);
                doc.setTextColor(21, 128, 61);
                doc.text(trustName, textCenterX, 9, { align: "center" });
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(15);
            doc.setTextColor(15, 23, 42);
            doc.text(schoolName, textCenterX, trustName ? 15 : 12, { align: "center" });

            const board = storedSchool?.affiliationBoard || storedSchool?.affiliation_board || 'CBSE';
            const affilNo = storedSchool?.boardAffiliationNumber || storedSchool?.board_affiliation_number || (isVision ? '1131336' : '2130889');
            const schoolCode = storedSchool?.schoolCode || storedSchool?.school_code || (isVision ? '31323' : '60401');
            const codes = [affilNo ? `${board} Affil No: ${affilNo}` : null, schoolCode ? `School Code: ${schoolCode}` : null].filter(Boolean).join(" | ");

            if (codes) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(71, 85, 105);
                doc.text(codes, textCenterX, trustName ? 20 : 17, { align: "center" });
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
                doc.text(address, textCenterX, trustName ? 24.5 : 21.5, { align: "center" });
            }

            const contactPhone = storedSchool?.officialPhone || storedSchool?.schoolPhone || storedSchool?.phone || (isVision ? "9168003333 / 4444" : "9876543210");
            const officialEmail = storedSchool?.officialEmail || storedSchool?.schoolEmail || storedSchool?.email || (isVision ? "vis.shirur@gmail.com" : "admin@arcschool.in");
            const website = storedSchool?.website || storedSchool?.schoolWebsite || (isVision ? "www.visionshirur.com" : "www.arcschool.in");
            const contacts = [`Tel: ${contactPhone}`, `Email: ${officialEmail}`, website].filter(Boolean).join(" | ");
            if (contacts) {
                doc.setFontSize(7);
                doc.setTextColor(100, 116, 139);
                doc.text(contacts, textCenterX, trustName ? 28.5 : 25.5, { align: "center" });
            }

            doc.setDrawColor(21, 128, 61);
            doc.setLineWidth(0.6);
            doc.line(14, 32, pageWidth - 14, 32);
            doc.setLineWidth(0.2);
            doc.line(14, 33.2, pageWidth - 14, 33.2);

            doc.setFontSize(13);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.text(title, 14, 41);

            autoTable(doc, {
                startY: 46,
                head: [columns],
                body: data,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 3 },
                headStyles: { fillColor: [27, 139, 59], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 245, 245] }
            });
        }

        doc.save(`${fileName}.pdf`);
    } catch (error) {
        console.error("Error exporting to PDF", error);
        alert("Failed to export PDF: " + error.message);
    }
};

export const generateReceiptPDF = async (paymentsInput, student, receiptInput, schoolInfo) => {
    try {
        if (!paymentsInput || !student) return;

        const payments = Array.isArray(paymentsInput) ? paymentsInput : [paymentsInput];
        if (payments.length === 0) return;

        const firstPayment = payments[0];
        const receipt = receiptInput || firstPayment.receipts || firstPayment;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        const halfWidth = 297 / 2; // 148.5 mm

        const sanitize = (str) => str ? String(str).replace(/₹/g, 'Rs. ') : str;

        const tableData = payments.flatMap(p => {
            let title = p.fee?.title || p.fee_title || p.fee_name || p.feeName || p.title || p.description;
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

/**
 * Export Daily Faculty Proxy & Substitution Arrangement Sheet (PDF)
 * @param {string} date - Formatted date string (YYYY-MM-DD or readable)
 * @param {Array<Object>} proxies - Array of proxy assignment objects
 */
export const exportDailyProxyPDF = async (date, proxies = []) => {
    try {
        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.getWidth();

        const storedSchool = await getActiveSchoolProfile();
        const slug = (storedSchool?.slug || storedSchool?.schoolSlug || getTenantSlug() || '').toLowerCase();
        const isVision = slug === 'vision';
        const schoolName = (storedSchool?.name || storedSchool?.schoolName || (isVision ? "Vision International School" : "ARC School")).toUpperCase();
        const rawLogo = storedSchool?.logoUrl || storedSchool?.logo_url;
        const logoUrl = rawLogo ? resolveAssetUrl(rawLogo) : (isVision ? "/vis_logo.png" : "/logo.png");
        let logoBase64 = null;
        try {
            logoBase64 = await loadImageAsBase64(logoUrl);
        } catch (e) {}

        let startY = 48;
        if (isVision && !rawLogo && letterheadBase64) {
            doc.addImage(letterheadBase64, 'PNG', 0, 0, pageWidth, 36);
            startY = 42;
        } else {
            if (logoBase64) {
                try {
                    doc.addImage(logoBase64, 'PNG', 14, 5, 24, 24);
                } catch (e) {}
            }

            const textCenterX = pageWidth / 2;
            const trustName = storedSchool?.trustName || storedSchool?.motto || storedSchool?.schoolMotto || (isVision ? "Pokharana Educational Trust's" : "Inspiring Excellence, Empowering Minds");
            if (trustName) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(8.5);
                doc.setTextColor(21, 128, 61);
                doc.text(trustName, textCenterX, 9, { align: "center" });
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(15);
            doc.setTextColor(15, 23, 42);
            doc.text(schoolName, textCenterX, trustName ? 15 : 12, { align: "center" });

            const board = storedSchool?.affiliationBoard || storedSchool?.affiliation_board || 'CBSE';
            const affilNo = storedSchool?.boardAffiliationNumber || storedSchool?.board_affiliation_number || (isVision ? '1131336' : '2130889');
            const schoolCode = storedSchool?.schoolCode || storedSchool?.school_code || (isVision ? '31323' : '60401');
            const codes = [affilNo ? `${board} Affil No: ${affilNo}` : null, schoolCode ? `School Code: ${schoolCode}` : null].filter(Boolean).join(" | ");
            if (codes) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text(codes, textCenterX, 20, { align: "center" });
            }

            const address = storedSchool?.address || storedSchool?.campusAddress || (isVision ? "Uttam Nagar, CIDCO, Nashik, Maharashtra 422009" : "Sector 128, Expressway, Noida, Uttar Pradesh, Pin: 201304");
            const phone = storedSchool?.phone || storedSchool?.officialPhone || storedSchool?.phone_number || (isVision ? "0253-2391234" : "9876543210");
            const email = storedSchool?.email || storedSchool?.officialEmail || (isVision ? "info@visioninternationalschool.edu.in" : "admin@arcschool.in");
            const web = storedSchool?.website || (isVision ? "www.visioninternationalschool.edu.in" : "www.arcschool.in");
            const contacts = [`Campus: ${address}`, `Tel: ${phone}`, `Email: ${email}`, `Web: ${web}`].filter(Boolean).join(" | ");

            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text(contacts, textCenterX, 24.5, { align: "center" });

            doc.setDrawColor(21, 128, 61);
            doc.setLineWidth(0.8);
            doc.line(14, 28, pageWidth - 14, 28);
            startY = 35;
        }

        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(21, 128, 61);
        doc.text("DAILY FACULTY PROXY & SUBSTITUTION ARRANGEMENT SHEET", pageWidth / 2, startY, { align: "center" });

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(70, 70, 70);

        const formattedDate = date ? new Date(date).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : new Date().toLocaleDateString('en-IN');

        doc.text(`Date of Duty: ${formattedDate}   |   Academic Session: 2026-2027   |   Total Substitutions: ${proxies.length}`, pageWidth / 2, startY + 6, { align: "center" });

        const tableColumns = [
            "#",
            "Period / Time Slot",
            "Class & Sec",
            "Regular Faculty (Absent)",
            "Assigned Substitute Faculty",
            "Subject",
            "Room",
            "Reason / Remark",
            "Faculty Signature"
        ];

        const tableBody = proxies.length > 0
            ? proxies.map((p, idx) => {
                const className = p.class?.name
                    ? `${p.class.name}${p.class.section ? ` - ${p.class.section}` : ""}`
                    : (p.class_name ? `${p.class_name}${p.class_section ? ` - ${p.class_section}` : ''}` : (p.className || "-"));
                const regularTeacher = p.original?.name || p.original_faculty_name || p.originalTeacherName || "Absent Staff";
                const subTeacher = p.substitute?.name || p.substitute_faculty_name || p.substituteTeacherName || "Assigned Faculty";
                const slot = p.time_slot || `Period ${p.period_index || idx + 1}`;
                const subject = p.subject || "General Class";
                const room = p.room_number || p.roomNumber || "-";
                const reason = p.reason || "Substitution";

                return [
                    String(idx + 1),
                    slot,
                    className,
                    regularTeacher,
                    subTeacher,
                    subject,
                    room,
                    reason,
                    ""
                ];
            })
            : [
                ["-", "All Periods", "-", "-", "No proxy duties recorded for today", "-", "-", "-", ""]
            ];

        autoTable(doc, {
            startY: startY + 11,
            head: [tableColumns],
            body: tableBody,
            theme: 'grid',
            headStyles: {
                fillColor: [21, 128, 61],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8.5,
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 8,
                textColor: [30, 30, 30]
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 35 },
                2: { cellWidth: 26 },
                3: { cellWidth: 42 },
                4: { cellWidth: 42 },
                5: { cellWidth: 30 },
                6: { cellWidth: 18, halign: 'center' },
                7: { cellWidth: 35 },
                8: { cellWidth: 30 }
            },
            styles: {
                cellPadding: 2.2,
                overflow: 'linebreak'
            }
        });

        doc.save(`Daily_Proxy_Arrangement_${date || 'today'}.pdf`);
    } catch (error) {
        console.error("Error generating Proxy PDF", error);
        alert("Failed to export PDF: " + error.message);
    }
};
