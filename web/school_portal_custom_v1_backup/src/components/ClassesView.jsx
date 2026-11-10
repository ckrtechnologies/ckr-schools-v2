import React, { useState } from 'react';
import { 
  IconPlus, 
  IconChalkboard, 
  IconUsers, 
  IconUser, 
  IconTrash, 
  IconX,
  IconCheck,
  IconArrowRight
} from '@tabler/icons-react';

export default function ClassesView({ 
  classes = [], 
  isLoading, 
  onCreateClass, 
  onDeleteClass, 
  onSelectClass 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('A');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!className.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateClass({ name: className.trim(), section: section.trim() });
      setClassName('');
      setSection('A');
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to create class: ' + (err.message || 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
            Class & Section Roster
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Manage academic classes, sections, assigned class teachers, and student allocations
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: '#064e3b',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(6, 78, 59, 0.2)'
          }}
        >
          <IconPlus size={16} />
          <span>Add Class / Section</span>
        </button>
      </div>

      {/* Class Cards Grid */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading classes and sections...
        </div>
      ) : classes.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <IconChalkboard size={48} color="#94a3b8" />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: '12px' }}>
            No classes created yet
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Click "Add Class / Section" to configure your school's class hierarchy.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {classes.map((cls) => (
            <div
              key={cls.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#064e3b';
                e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#ecfdf5',
                      color: '#064e3b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '13px'
                    }}>
                      {cls.section ? cls.section : '•'}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                        {cls.name} {cls.section ? `— ${cls.section}` : ''}
                      </h3>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Academic Year 2026-27
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteClass(cls.id)}
                    title="Delete Class"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                  >
                    <IconTrash size={16} />
                  </button>
                </div>

                <div style={{
                  padding: '10px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9',
                  marginBottom: '14px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                    <IconUser size={15} color="#064e3b" />
                    <span>Teacher: <strong>{cls.class_teacher_name || 'Unassigned'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                    <IconUsers size={15} color="#1d4ed8" />
                    <span>Enrolled: <strong>{cls.student_count || 0} students</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectClass && onSelectClass(cls)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#064e3b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ecfdf5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                <span>View Class Roster</span>
                <IconArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Class Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                Add New Class & Section
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                  Class / Grade Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10, Grade 9, Nursery"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                  Section (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. A, B, Blue, Red"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#064e3b',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  <IconCheck size={16} />
                  <span>{isSubmitting ? 'Creating...' : 'Create Class'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

