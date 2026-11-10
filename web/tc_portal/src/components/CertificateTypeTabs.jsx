import React from "react";
import { FileText, Award, CalendarCheck, Receipt, BookOpen, ShieldCheck, UserCheck } from "lucide-react";

export const CERTIFICATE_TYPES = [
  {
    id: "tc",
    label: "Leaving Certificate (TC)",
    shortLabel: "Leaving Certificate",
    icon: FileText
  },
  {
    id: "bonafide",
    label: "Bonafide Certificate",
    shortLabel: "Bonafide Certificate",
    icon: ShieldCheck
  },
  {
    id: "character",
    label: "Character Certificate",
    shortLabel: "Character Certificate",
    icon: UserCheck
  },
  {
    id: "academic",
    label: "Academic Performance Certificate",
    shortLabel: "Academic Performance",
    icon: Award
  },
  {
    id: "attendance",
    label: "Attendance Certificate",
    shortLabel: "Attendance Certificate",
    icon: CalendarCheck
  },
  {
    id: "fee_payment",
    label: "Fee Payment Certificate / Statement",
    shortLabel: "Fee Payment Statement",
    icon: Receipt
  },
  {
    id: "fee_structure",
    label: "Fee Structure Certificate",
    shortLabel: "Fee Structure",
    icon: BookOpen
  }
];

export default function CertificateTypeTabs({ activeType, onChange }) {
  return (
    <div className="cert-type-tabs-wrapper no-print">
      <div className="cert-type-tabs-container">
        {CERTIFICATE_TYPES.map((type) => {
          const Icon = type.icon;
          const isActive = activeType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              className={`cert-type-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => onChange(type.id)}
            >
              <Icon size={16} />
              <span>{type.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
