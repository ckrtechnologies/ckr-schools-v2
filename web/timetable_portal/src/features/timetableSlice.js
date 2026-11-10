import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getTimeTables,
  createDayTimeTable,
  addPeriod,
  updatePeriod,
  deletePeriod,
  duplicateDaySchedule,
  fetchAllClasses,
  fetchAllTeachers,
  fetchAllSubjects,
  fetchAllRooms,
} from "../services/api";

import { fetchSubjectQuotas, fetchTeacherQuotas } from "../services/teacherScheduleApi";

export const loadMasterData = createAsyncThunk(
  "timetable/loadMasterData",
  async (_, { rejectWithValue }) => {
    try {
      const [classes, teachers, subjects, rooms, quotasRes, teacherQuotasRes] = await Promise.all([
        fetchAllClasses(),
        fetchAllTeachers(),
        fetchAllSubjects(),
        fetchAllRooms(),
        fetchSubjectQuotas().catch(() => ({})),
        fetchTeacherQuotas().catch(() => ({})),
      ]);
      const classSubjectQuotas = quotasRes?.classSubjectQuotas || quotasRes?.quotas || {};
      const teacherQuotas = teacherQuotasRes?.teacherQuotas || {};
      return { classes, teachers, subjects, rooms, classSubjectQuotas, teacherQuotas };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load master data");
    }
  }
);

export const loadTimeTables = createAsyncThunk(
  "timetable/loadTimeTables",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getTimeTables();
      return res.data?.timeTables || res.data?.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const saveDayTimetable = createAsyncThunk(
  "timetable/saveDayTimetable",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await createDayTimeTable(payload);
      dispatch(loadTimeTables());
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const savePeriod = createAsyncThunk(
  "timetable/savePeriod",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await addPeriod(payload);
      dispatch(loadTimeTables());
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const modifyPeriod = createAsyncThunk(
  "timetable/modifyPeriod",
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      const res = await updatePeriod(id, data);
      dispatch(loadTimeTables());
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const removePeriod = createAsyncThunk(
  "timetable/removePeriod",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const res = await deletePeriod(id);
      dispatch(loadTimeTables());
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const duplicateSchedule = createAsyncThunk(
  "timetable/duplicateSchedule",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await duplicateDaySchedule(payload);
      dispatch(loadTimeTables());
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  timeTables: [],
  classes: [],
  teachers: [],
  subjects: [],
  rooms: [],
  classSubjectQuotas: {},
  teacherQuotas: {},
  loadingTimeTables: false,
  loadingMasterData: false,
  saving: false,
  error: null,
};

export const timetableSlice = createSlice({
  name: "timetable",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // loadMasterData
      .addCase(loadMasterData.pending, (state) => {
        state.loadingMasterData = true;
      })
      .addCase(loadMasterData.fulfilled, (state, action) => {
        state.loadingMasterData = false;
        state.classes = action.payload.classes || [];
        state.teachers = action.payload.teachers || [];
        state.subjects = action.payload.subjects || [];
        state.rooms = action.payload.rooms || [];
        state.classSubjectQuotas = action.payload.classSubjectQuotas || {};
        state.teacherQuotas = action.payload.teacherQuotas || {};
      })
      .addCase(loadMasterData.rejected, (state, action) => {
        state.loadingMasterData = false;
        state.error = action.payload;
      })

      // loadTimeTables
      .addCase(loadTimeTables.pending, (state) => {
        state.loadingTimeTables = true;
      })
      .addCase(loadTimeTables.fulfilled, (state, action) => {
        state.loadingTimeTables = false;
        state.timeTables = action.payload;
      })
      .addCase(loadTimeTables.rejected, (state, action) => {
        state.loadingTimeTables = false;
        state.error = action.payload;
      })

      // actions pending/fulfilled
      .addMatcher(
        (action) => action.type.endsWith("/pending") && action.type.startsWith("timetable/save"),
        (state) => {
          state.saving = true;
        }
      )
      .addMatcher(
        (action) =>
          (action.type.endsWith("/fulfilled") || action.type.endsWith("/rejected")) &&
          action.type.startsWith("timetable/save"),
        (state) => {
          state.saving = false;
        }
      );
  },
});

export const { clearError } = timetableSlice.actions;
export default timetableSlice.reducer;
