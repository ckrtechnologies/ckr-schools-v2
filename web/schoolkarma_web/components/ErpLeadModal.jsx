import React, { useState } from 'react';
import { 
  IconX, 
  IconSchool, 
  IconCheck, 
  IconDevices, 
  IconReportMoney, 
  IconUsers, 
  IconShieldCheck,
  IconClock,
  IconArrowRight
} from '@tabler/icons-react';

export default function ErpLeadModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    school_name: '',
    contact_person: '',
    designation: 'Principal',
    phone: '',
    email: '',
    city: '',
    student_strength: '500-1500',
    interested_modules: ['Admissions CRM', 'Finance & Fee Ledger Desk', 'Mobile Apps (Teacher/Student)']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const modulesList = [
    'Admissions & Lead CRM',
    'Finance & Fee Ledger Desk',
    'Transfer Certificate (TC) Portal',
    'Timetable & Exam Scheduling',
    'White-label Mobile Apps (Student & Teacher)',
    'RFID / Biometric Attendance',
    'CBSE / ICSE Report Card Generator'
  ];

  const toggleModule = (mod) => {
    setFormData(prev => {
      const exists = prev.interested_modules.includes(mod);
      return {
        ...prev,
        interested_modules: exists 
          ? prev.interested_modules.filter(m => m !== mod)
          : [...prev.interested_modules, mod]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.school_name || !formData.contact_person || !formData.phone) {
      setErrorMsg('Please fill in school name, contact person and phone number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // POST directly to dedicated institutional erp-leads endpoint
      const response = await fetch('/api/marketplace/erp-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_name: formData.school_name,
          city: formData.city,
          contact_person: formData.contact_person,
          designation: formData.designation,
          phone: formData.phone,
          email: formData.email,
          student_strength: formData.student_strength,
          interested_modules: formData.interested_modules,
          notes: `Interested in ${formData.interested_modules.join(', ')}`
        })
      });

      const resJson = await response.json();
      if (resJson.success) {
        setIsSubmitted(true);
      } else {
        setErrorMsg(resJson.error?.message || 'Could not submit inquiry.');
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again or call our live helpline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mk-modal-overlay">
      <div 
        className="mk-modal-card animate-scale-in"
        style={{
          maxWidth: '680px'
        }}
      >
        {/* Header */}
        <div className="mk-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <IconSchool size={22} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                FOR SCHOOL MANAGEMENT &amp; TRUSTEES
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '2px 0 0' }}>
                Transform Your Campus with SchoolKarma ERP
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#a7f3d0',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="mk-modal-body">
          {isSubmitted ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px'
              }}>
                <IconCheck size={36} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>
                Demo &amp; Onboarding Request Received!
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '440px', margin: '0 auto 24px', lineHeight: '1.6' }}>
                Our School Solutions Team will connect with <strong>{formData.contact_person}</strong> within 2 business hours with live credentials and customized pricing.
              </p>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#064e3b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Return to SchoolKarma
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {errorMsg && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontSize: '13px'
                }}>
                  {errorMsg}
                </div>
              )}

              {/* Row 1: School Name & City */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    School / Institution Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cambridge Court World School"
                    value={formData.school_name}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    City / Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Noida, Bengaluru, Pune"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Contact Person & Designation */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Your Role / Designation
                  </label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Principal">Principal / Vice-Principal</option>
                    <option value="Trustee">Trustee / Director</option>
                    <option value="Administrator">School Administrator</option>
                    <option value="IT Head">IT / Systems Head</option>
                    <option value="Admissions Incharge">Admissions Head</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Phone & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Official Mobile / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="principal@school.edu.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Student Strength */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Total Student Strength
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {['Under 500', '500-1500', '1500-3000', '3000+'].map(tier => (
                    <button
                      type="button"
                      key={tier}
                      onClick={() => setFormData({ ...formData, student_strength: tier })}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: formData.student_strength === tier ? '2px solid #064e3b' : '1px solid #cbd5e1',
                        backgroundColor: formData.student_strength === tier ? '#ecfdf5' : '#ffffff',
                        color: formData.student_strength === tier ? '#064e3b' : '#475569',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modules Interested In */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                  Solutions Required (Select all that apply)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  {modulesList.map(mod => {
                    const selected = formData.interested_modules.includes(mod);
                    return (
                      <div
                        key={mod}
                        onClick={() => toggleModule(mod)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: selected ? '1.5px solid #059669' : '1px solid #e2e8f0',
                          backgroundColor: selected ? '#f0fdf4' : '#f8fafc',
                          color: selected ? '#064e3b' : '#64748b',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          border: selected ? 'none' : '1px solid #cbd5e1',
                          backgroundColor: selected ? '#059669' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          flexShrink: 0
                        }}>
                          {selected && <IconCheck size={12} />}
                        </div>
                        <span>{mod}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit CTA */}
              <div style={{ marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    backgroundColor: '#064e3b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '13px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(6, 78, 59, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{isSubmitting ? 'Submitting Request...' : 'Request Campus Demo &amp; Custom Quote'}</span>
                  <IconArrowRight size={18} />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="mk-modal-footer" style={{
          fontSize: '12px',
          color: '#64748b',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconShieldCheck size={16} color="#059669" />
            ISO 27001 Certified &amp; Data Sovereign (Indian VPS)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IconClock size={15} color="#047857" />
            2-Hour Executive Callback Guarantee
          </span>
        </div>
      </div>
    </div>
  );
}
