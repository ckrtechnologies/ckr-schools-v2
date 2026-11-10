import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  dateRange: '30days', // 'today' | '7days' | '30days' | 'all'
  activeTab: 'Overview', // Strictly one word: 'Overview' | 'Schools' | 'Billing' | 'Audit'
  searchQuery: '',
  planFilter: 'all',
  selectedSchoolId: null
};

export const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setPlanFilter: (state, action) => {
      state.planFilter = action.payload;
    },
    setSelectedSchoolId: (state, action) => {
      state.selectedSchoolId = action.payload;
    }
  }
});

export const { setDateRange, setActiveTab, setSearchQuery, setPlanFilter, setSelectedSchoolId } = filtersSlice.actions;
export default filtersSlice.reducer;

