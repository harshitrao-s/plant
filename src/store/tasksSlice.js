import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/lib/api";

const initialState = {
  items: [],
  projectId: null,
  status: "idle",
  error: null,
};

function message(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}

function queryString(query) {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.sort) params.set("sort", query.sort);
  const text = params.toString();
  return text ? `?${text}` : "";
}

export const fetchTasks = createAsyncThunk("tasks/fetch", async (query, { rejectWithValue }) => {
  try {
    const data = await api(`/api/projects/${query.projectId}/tasks${queryString(query)}`);
    return { projectId: query.projectId, tasks: data.tasks };
  } catch (error) {
    return rejectWithValue(message(error, "Could not load tasks."));
  }
});

export const createTask = createAsyncThunk("tasks/create", async (body, { rejectWithValue }) => {
  try {
    const data = await api(`/api/projects/${body.projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return data.task;
  } catch (error) {
    return rejectWithValue(message(error, "Could not create task."));
  }
});

export const updateTask = createAsyncThunk("tasks/update", async (body, { rejectWithValue }) => {
  try {
    const data = await api(`/api/tasks/${body.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return data.task;
  } catch (error) {
    return rejectWithValue(message(error, "Could not update task."));
  }
});

export const deleteTask = createAsyncThunk("tasks/delete", async (id, { rejectWithValue }) => {
  try {
    await api(`/api/tasks/${id}`, { method: "DELETE" });
    return id;
  } catch (error) {
    return rejectWithValue(message(error, "Could not delete task."));
  }
});

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearTasks(state) {
      state.items = [];
      state.projectId = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.items = action.payload.tasks;
        state.projectId = action.payload.projectId;
        state.status = "ready";
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = "ready";
        state.error = String(action.payload);
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
        state.error = null;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.error = String(action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.items = state.items.map((task) =>
          task.id === action.payload.id ? action.payload : task,
        );
        state.error = null;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = String(action.payload);
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter((task) => task.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = String(action.payload);
      });
  },
});

export const { clearTasks } = tasksSlice.actions;
export default tasksSlice.reducer;
