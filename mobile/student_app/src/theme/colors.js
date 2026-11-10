export const colors = {
  // Brand Primary — Modern Royal Slate & Midnight Navy (Clean, Consistent & Professional)
  primary: '#1E293B',       // Deep Royal Slate
  primaryDark: '#0F172A',   // Midnight Dark Slate (Status bars, headers)
  primaryLight: '#334155',  // Cool Slate Accent
  brandAccent: '#2563EB',   // Electric Royal Blue for primary CTAs & active highlights

  // Accent & Secondary
  secondary: '#0284C7',     // Sky blue
  accent: '#F59E0B',        // Gold / Amber for medals & highlights
  
  // Status Colors
  success: '#10B981',       // Emerald green
  warning: '#F59E0B',       // Amber
  danger: '#EF4444',        // Red
  purple: '#7C3AED',        // Violet

  // Medals/Badges
  gold: '#F59E0B',
  silver: '#94A3B8',
  bronze: '#CD7F32',

  // Event type chips (Soft Pastels)
  examChip: '#EFF6FF',      // Pale blue
  examChipText: '#1E3A8A',  // Deep blue
  eventChip: '#DCFCE7',     // Pale green
  eventChipText: '#14532D', // Deep green
  academicChip: '#FEF3C7',  // Pale amber
  academicChipText: '#92400E', // Deep amber

  // Clean Premium Backgrounds
  background: '#F8FAFC',    // Ghost White (softer than #F1F5F9)
  surface: '#FFFFFF',       // Pure white for cards

  // Text & Borders
  text: '#0F172A',          // Deep Slate (Heading text)
  textMuted: '#64748B',     // Cool Slate (Body text)
  border: '#E2E8F0',        // Slate-200
  borderLight: '#F1F5F9',   // Slate-100
};

export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, // Much softer, premium shadow
    shadowRadius: 16,
    elevation: 3, // Android
  },
  button: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heavy: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
};

