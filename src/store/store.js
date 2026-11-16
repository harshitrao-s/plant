import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import projectsReducer from "./projectsSlice";
import tasksReducer from "./tasksSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      projects: projectsReducer,
      tasks: tasksReducer,
    },
  });
}
