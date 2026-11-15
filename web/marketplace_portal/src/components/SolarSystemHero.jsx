import React from 'react';
import {
  IconSchool,
  IconUsers,
  IconReceipt2,
  IconDeviceMobile,
  IconUserCheck,
  IconCalendarEvent,
  IconReportAnalytics,
  IconFileCertificate,
  IconClipboardCheck,
  IconBooks
} from '@tabler/icons-react';

export default function SolarSystemHero() {
  // 9 Key Platform Capabilities mapped across 3 concentric planetary orbits
  // Orbit Ring 1 (Inner, Radius ~75px, 2 planets)
  const ring1Planets = [
    {
      angle: 0,
      name: 'Admissions',
      icon: <IconUsers size={16} color="#ffffff" />,
      color: '#059669',
      glow: 'rgba(5, 150, 105, 0.6)'
    },
    {
      angle: 180,
      name: 'Student TC',
      icon: <IconFileCertificate size={16} color="#ffffff" />,
      color: '#0f766e',
      glow: 'rgba(15, 118, 110, 0.6)'
    }
  ];

  // Orbit Ring 2 (Middle, Radius ~135px, 3 planets)
  const ring2Planets = [
    {
      angle: 30,
      name: 'Fees Counter',
      icon: <IconReceipt2 size={16} color="#ffffff" />,
      color: '#0284c7',
      glow: 'rgba(2, 132, 199, 0.6)'
    },
    {
      angle: 150,
      name: 'Teacher App',
      icon: <IconDeviceMobile size={16} color="#ffffff" />,
      color: '#4f46e5',
      glow: 'rgba(79, 70, 229, 0.6)'
    },
    {
      angle: 270,
      name: 'Exams & CBSE',
      icon: <IconReportAnalytics size={16} color="#ffffff" />,
      color: '#e11d48',
      glow: 'rgba(225, 29, 72, 0.6)'
    }
  ];

  // Orbit Ring 3 (Outer, Radius ~195px, 4 planets)
  const ring3Planets = [
    {
      angle: 15,
      name: 'Parent App',
      icon: <IconUserCheck size={16} color="#ffffff" />,
      color: '#7c3aed',
      glow: 'rgba(124, 58, 237, 0.6)'
    },
    {
      angle: 105,
      name: 'Timetable',
      icon: <IconCalendarEvent size={16} color="#ffffff" />,
      color: '#d97706',
      glow: 'rgba(217, 119, 6, 0.6)'
    },
    {
      angle: 195,
      name: 'Attendance',
      icon: <IconClipboardCheck size={16} color="#ffffff" />,
      color: '#2563eb',
      glow: 'rgba(37, 99, 235, 0.6)'
    },
    {
      angle: 285,
      name: 'Academics',
      icon: <IconBooks size={16} color="#ffffff" />,
      color: '#ea580c',
      glow: 'rgba(234, 88, 12, 0.6)'
    }
  ];

  return (
    <div className="mk-services-solar-container" style={{
      position: 'relative',
      width: '100%',
      maxWidth: '460px',
      height: '440px',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible'
    }}>
      {/* Background Solar Nebula Glow */}
      <div style={{
        position: 'absolute',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(52, 211, 153, 0.18) 0%, rgba(6, 78, 59, 0) 70%)',
        pointerEvents: 'none'
      }} />

      {/* Center Sun Core: SchoolKarma Engine */}
      <div 
        className="orbit-sun-core"
        style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          backgroundColor: '#064e3b',
          border: '2px solid #34d399',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          zIndex: 10,
          cursor: 'pointer',
          position: 'relative'
        }}
        title="SchoolKarma Central Campus Core"
      >
        <IconSchool size={28} color="#34d399" />
        <span style={{ fontSize: '9px', fontWeight: '900', color: '#a7f3d0', letterSpacing: '0.4px', marginTop: '2px' }}>
          ERP CORE
        </span>
      </div>

      {/* Orbit Ring 1 (Inner Track) */}
      <div
        className="orbit-ring-1"
        style={{
          position: 'absolute',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          border: '1px dashed rgba(52, 211, 153, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {ring1Planets.map((planet, idx) => {
          const rad = (planet.angle * Math.PI) / 180;
          const x = Math.round(80 * Math.cos(rad));
          const y = Math.round(80 * Math.sin(rad));

          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div 
                className="planet-counter-spin"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: planet.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 14px ${planet.glow}`,
                  border: '1.5px solid rgba(255, 255, 255, 0.9)'
                }}>
                  {planet.icon}
                </div>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: '800',
                  color: '#ffffff',
                  backgroundColor: 'rgba(6, 78, 59, 0.85)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  border: '0.5px solid rgba(52, 211, 153, 0.3)'
                }}>
                  {planet.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Orbit Ring 2 (Middle Track) */}
      <div
        className="orbit-ring-2"
        style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          border: '1px dashed rgba(52, 211, 153, 0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {ring2Planets.map((planet, idx) => {
          const rad = (planet.angle * Math.PI) / 180;
          const x = Math.round(140 * Math.cos(rad));
          const y = Math.round(140 * Math.sin(rad));

          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div 
                className="planet-counter-spin"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: planet.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 14px ${planet.glow}`,
                  border: '1.5px solid rgba(255, 255, 255, 0.9)'
                }}>
                  {planet.icon}
                </div>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: '800',
                  color: '#ffffff',
                  backgroundColor: 'rgba(6, 78, 59, 0.85)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  border: '0.5px solid rgba(52, 211, 153, 0.3)'
                }}>
                  {planet.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Orbit Ring 3 (Outer Track) */}
      <div
        className="orbit-ring-3"
        style={{
          position: 'absolute',
          width: '390px',
          height: '390px',
          borderRadius: '50%',
          border: '1px dashed rgba(52, 211, 153, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {ring3Planets.map((planet, idx) => {
          const rad = (planet.angle * Math.PI) / 180;
          const x = Math.round(195 * Math.cos(rad));
          const y = Math.round(195 * Math.sin(rad));

          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div 
                className="planet-counter-spin"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: planet.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 14px ${planet.glow}`,
                  border: '1.5px solid rgba(255, 255, 255, 0.9)'
                }}>
                  {planet.icon}
                </div>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: '800',
                  color: '#ffffff',
                  backgroundColor: 'rgba(6, 78, 59, 0.85)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  border: '0.5px solid rgba(52, 211, 153, 0.3)'
                }}>
                  {planet.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
