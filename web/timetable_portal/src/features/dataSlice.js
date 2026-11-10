import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

export const fetchUsers = createAsyncThunk(
  "data/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin_panel/users");
      return response.data?.users || response.data?.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchClasses = createAsyncThunk(
  "data/fetchClasses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin_panel/class/getClass");
      return response.data?.classes || response.data?.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSubjects = createAsyncThunk(
  "data/fetchSubjects",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin_panel/subjects/getSubjects");
      return response.data?.subjects || response.data?.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchRooms = createAsyncThunk(
  "data/fetchRooms",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/rooms/getRooms");
      return response.data?.rooms || response.data?.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchTimeTables = createAsyncThunk(
  "data/fetchTimeTables",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin_panel/timeTable/getTimeTable");
      return response.data?.timeTables || response.data?.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const initialState = {
  users: [],
  classes: [],
  subjects: [],
  rooms: [],
  timeTables: [],
  loading: false,
  error: null,
};

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Classes
      .addCase(fetchClasses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = action.payload;
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Subjects
      .addCase(fetchSubjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSubjects.fulfilled, (state, action) => {
        state.loading = false;
        state.subjects = action.payload;
      })
      .addCase(fetchSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Rooms
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // TimeTables
      .addCase(fetchTimeTables.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTimeTables.fulfilled, (state, action) => {
        state.loading = false;
        state.timeTables = action.payload;
      })
      .addCase(fetchTimeTables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dataSlice.reducer;
