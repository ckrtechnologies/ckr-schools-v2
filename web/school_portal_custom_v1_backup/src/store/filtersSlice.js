import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  dateRange: 'today', // 'today' | '7days' | '30days' | 'all'
  activeTab: 'Overview', // Strictly one word options
  searchQuery: '',
  selectedClassId: null
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
    setSelectedClassId: (state, action) => {
      state.selectedClassId = action.payload;
    }
  }
});

export const { setDateRange, setActiveTab, setSearchQuery, setSelectedClassId } = filtersSlice.actions;
export default filtersSlice.reducer;

