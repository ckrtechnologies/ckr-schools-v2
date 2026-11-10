import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice";
import timetableReducer from "../features/timetableSlice";
import dataReducer from "../features/dataSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    timetable: timetableReducer,
    data: dataReducer,
  },
});
