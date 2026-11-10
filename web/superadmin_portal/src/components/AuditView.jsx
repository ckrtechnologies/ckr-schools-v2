import React from 'react';
import { IconShieldCheck, IconClock, IconServer, IconCircleCheck, IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import { useGetAuditLogsQuery } from '../store/superadminApi';

const ACTION_ICONS = {
  TENANT_PROVISIONED: IconServer,
  AUTH_SESSION_ISSUED: IconShieldCheck,
  TIER_UPGRADE: IconCircleCheck,
  DB_CONNECTION_VERIFIED: IconServer,
};

const STATUS_STYLES = {
  SUCCESS: { backgroundColor: '#ecfdf5', color: '#065f46' },
  FAILURE: { backgroundColor: '#fef2f2', color: '#991b1b' },
  WARNING: { backgroundColor: '#fef3c7', color: '#92400e' },
};

export default function AuditView() {
  const { data, isLoading, isError, refetch } = useGetAuditLogsQuery({ limit: 50 });
  const auditLogs = data?.data || [];

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
            Platform Security & Audit Trail
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Tamper-evident system activity, school provisioning logs, and authentication events
          </p>
        </div>
        <button
          onClick={refetch}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff', fontSize: '13px', fontWeight: '600',
            color: '#475569', cursor: 'pointer'
          }}
        >
          <IconRefresh size={14} />
          Refresh
        </button>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <IconClock size={16} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
            Recent System Events
          </span>
        </div>

        {isLoading && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            Loading audit logs…
          </div>
        )}

        {isError && (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <IconAlertTriangle size={32} style={{ color: '#fca5a5', marginBottom: '12px' }} />
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
              Audit log endpoint not reachable
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Check backend connectivity or provision the audit log table.
            </div>
          </div>
        )}

        {!isLoading && !isError && auditLogs.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No audit events recorded yet.
          </div>
        )}

        {!isLoading && !isError && auditLogs.length > 0 && (
          <div>
            {auditLogs.map((log, idx) => {
              const Icon = ACTION_ICONS[log.action] || IconServer;
              const statusStyle = STATUS_STYLES[log.status] || STATUS_STYLES.SUCCESS;
              return (
                <div
                  key={log.id || idx}
                  style={{
                    padding: '16px 18px',
                    borderBottom: idx < auditLogs.length - 1 ? '1px solid #f1f5f9' : 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px'
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    backgroundColor: '#f1f5f9', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Icon size={18} style={{ color: '#475569' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                        {log.action}
                      </span>
                      <span style={{
                        fontSize: '10px', fontWeight: '700', padding: '2px 7px',
                        borderRadius: '4px', ...statusStyle
                      }}>
                        {log.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', marginBottom: '6px' }}>
                      {log.details}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#94a3b8' }}>
                      <span>{log.actor}</span>
                      <span>•</span>
                      <span>{log.time || log.created_at}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
