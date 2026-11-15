import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  comparedSchools: [], // Array of school objects { id, slug, name, logo_url, city, affiliation_board, min_fee, max_fee, avg_rating, ... }
  isTrayOpen: false
};

export const comparisonSlice = createSlice({
  name: 'comparison',
  initialState,
  reducers: {
    addSchoolToCompare: (state, action) => {
      const exists = state.comparedSchools.some(s => s.slug === action.payload.slug);
      if (!exists && state.comparedSchools.length < 3) {
        state.comparedSchools.push(action.payload);
        state.isTrayOpen = true;
      }
    },
    removeSchoolFromCompare: (state, action) => {
      state.comparedSchools = state.comparedSchools.filter(s => s.slug !== action.payload);
      if (state.comparedSchools.length === 0) {
        state.isTrayOpen = false;
      }
    },
    clearComparison: (state) => {
      state.comparedSchools = [];
      state.isTrayOpen = false;
    },
    toggleComparisonTray: (state) => {
      state.isTrayOpen = !state.isTrayOpen;
    }
  }
});

export const {
  addSchoolToCompare,
  removeSchoolFromCompare,
  clearComparison,
  toggleComparisonTray
} = comparisonSlice.actions;

export default comparisonSlice.reducer;

