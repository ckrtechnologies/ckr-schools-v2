import React, { useState } from 'react';
import { 
  IconPlus, 
  IconDoor, 
  IconArmchair, 
  IconTrash, 
  IconX, 
  IconCheck 
} from '@tabler/icons-react';

export default function RoomsView({
  rooms = [],
  isLoading,
  onCreateRoom,
  onDeleteRoom
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [capacity, setCapacity] = useState('40');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateRoom({ name: roomName.trim(), capacity: Number(capacity) || 40 });
      setRoomName('');
      setCapacity('40');
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to add room: ' + (err.message || 'Error'));
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
            Campus Rooms & Laboratories
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Maintain physical classrooms, science labs, computer suites, and exam halls
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
          <span>Add Campus Room</span>
        </button>
      </div>

      {/* Rooms Grid */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading room inventory...
        </div>
      ) : rooms.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <IconDoor size={48} color="#94a3b8" />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: '12px' }}>
            No rooms configured yet
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Add classrooms and laboratories to enable timetable room collision detection.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px'
        }}>
          {rooms.map((room) => (
            <div
              key={room.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconDoor size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    {room.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    <IconArmchair size={13} />
                    <span>Capacity: {room.capacity || 40} seats</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDeleteRoom(room.id)}
                title="Delete Room"
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
          ))}
        </div>
      )}

      {/* Add Room Modal */}
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
            maxWidth: '420px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                Add Campus Room / Lab
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
                  Room Name or Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 101, Science Lab 2, Library"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
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
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
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
                  <span>{isSubmitting ? 'Adding...' : 'Add Room'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

