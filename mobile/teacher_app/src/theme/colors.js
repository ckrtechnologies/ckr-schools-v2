export const colors = {
  // Brand Primary — Premium Dark Forest Green (#064E3B)
  primary: '#064E3B',       // Deep Dark Emerald Green
  primaryDark: '#022C22',   // Deep Forest Midnight (Headers, Status bars)
  primaryLight: '#047857',  // Rich Emerald Accent
  brandAccent: '#10B981',   // Crisp Mint / Emerald highlight
  secondary: '#0D9488',     // Teal
  success: '#10B981',       // Emerald green
  warning: '#F59E0B',       // Amber
  danger: '#EF4444',        // Red
  purple: '#8B5CF6',        // Violet
  pink: '#EC4899',          // Pink
  
  // Clean Backgrounds
  background: '#F8FAFC',    // Off-white/slate-50 for depth
  surface: '#FFFFFF',       // Pure white for cards
  
  // Text & Borders
  text: '#0F172A',          // Slate-900 (High-contrast deep black)
  textMuted: '#475569',     // Slate-600 (Clear, legible secondary text - not washed out)
  border: '#E2E8F0',        // Slate-200
  borderLight: '#F1F5F9',   // Slate-100
};

export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4, // Android
  },
  button: {
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6, // Android
  }
};
