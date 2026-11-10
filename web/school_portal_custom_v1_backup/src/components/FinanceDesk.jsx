import React, { useState } from 'react';
import {
  IconReceipt2,
  IconListDetails,
  IconSettingsAutomation,
  IconCurrencyRupee,
  IconCoins,
  IconTrendingUp,
  IconPrinter
} from '@tabler/icons-react';

import FeeCounter from './FeeCounter.jsx';
import CollectionLedger from './CollectionLedger.jsx';
import FeeStructures from './FeeStructures.jsx';
import ReceiptModal from './ReceiptModal.jsx';

export default function FinanceDesk({
  students = [],
  classes = [],
  payments = [],
  structures = [],
  stats,
  isLoadingPayments,
  isLoadingStructures,
  onCollectFee,
  onCreateStructure,
  onDeleteStructure
}) {
  const [subTab, setSubTab] = useState('COUNTER'); // 'COUNTER' | 'LEDGER' | 'STRUCTURES'
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);

  const formatRupee = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleReceiptGenerated = (receipt, student) => {
    setCurrentReceipt(receipt);
    setCurrentStudent(student);
  };

  const handlePrintExistingReceipt = (receipt, student) => {
    setCurrentReceipt(receipt);
    setCurrentStudent(student);
  };

  return (
    <div>
      {/* 4 Interactive Finance KPI Tiles (Capped at strictly 4 per CKR Standards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>
              Total Revenue
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconCurrencyRupee size={16} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#064e3b', marginTop: '6px' }}>
            {formatRupee(stats?.totalRevenue || payments.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0))}
          </div>
          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600', marginTop: '2px', display: 'block' }}>
            All-time ledger collections
          </span>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>
              Today's Intake
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconCoins size={16} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e40af', marginTop: '6px' }}>
            {formatRupee(stats?.todayRevenue || 0)}
          </div>
          <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '600', marginTop: '2px', display: 'block' }}>
            Real-time counter collections
          </span>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>
              Receipts Issued
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconReceipt2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            {payments.length}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginTop: '2px', display: 'block' }}>
            Audit-tracked payment entries
          </span>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>
              Fee Head Structures
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconTrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            {structures.length}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginTop: '2px', display: 'block' }}>
            Class-wise billing rules active
          </span>
        </div>
      </div>

      {/* Sub-Tabs Navigation (Counter | Ledger | Structures) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '10px'
      }}>
        {[
          { id: 'COUNTER', label: 'POS Counter', icon: IconReceipt2 },
          { id: 'LEDGER', label: 'Collections Ledger', icon: IconListDetails },
          { id: 'STRUCTURES', label: 'Fee Structures', icon: IconSettingsAutomation }
        ].map(tab => {
          const isSelected = subTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isSelected ? '#064e3b' : 'transparent',
                color: isSelected ? '#ffffff' : '#64748b',
                fontWeight: isSelected ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={17} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Surface View Body */}
      {subTab === 'COUNTER' && (
        <FeeCounter
          students={students}
          onCollectFee={onCollectFee}
          onReceiptGenerated={handleReceiptGenerated}
        />
      )}

      {subTab === 'LEDGER' && (
        <CollectionLedger
          payments={payments}
          isLoading={isLoadingPayments}
          onPrintReceipt={handlePrintExistingReceipt}
        />
      )}

      {subTab === 'STRUCTURES' && (
        <FeeStructures
          structures={structures}
          classes={classes}
          isLoading={isLoadingStructures}
          onCreateStructure={onCreateStructure}
          onDeleteStructure={onDeleteStructure}
        />
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(currentReceipt)}
        onClose={() => setCurrentReceipt(null)}
        receipt={currentReceipt}
        student={currentStudent}
      />
    </div>
  );
}

