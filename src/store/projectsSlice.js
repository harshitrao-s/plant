import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/lib/api";

const initialState = {
  items: [],
  status: "idle",
  error: null,
};

function message(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}

export const fetchProjects = createAsyncThunk("projects/fetch", async (_, { rejectWithValue }) => {
  try {
    const data = await api("/api/projects");
    return data.projects;
  } catch (error) {
    return rejectWithValue(message(error, "Could not load projects."));
  }
});

export const createProject = createAsyncThunk(
  "projects/create",
  async (body, { rejectWithValue }) => {
    try {
      const data = await api("/api/projects", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return data.project;
    } catch (error) {
      return rejectWithValue(message(error, "Could not create project."));
    }
  },
);

export const updateProject = createAsyncThunk(
  "projects/update",
  async (body, { rejectWithValue }) => {
    try {
      const data = await api(`/api/projects/${body.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: body.title, description: body.description }),
      });
      return data.project;
    } catch (error) {
      return rejectWithValue(message(error, "Could not update project."));
    }
  },
);

export const deleteProject = createAsyncThunk(
  "projects/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api(`/api/projects/${id}`, { method: "DELETE" });
      return id;
    } catch (error) {
      return rejectWithValue(message(error, "Could not delete project."));
    }
  },
);

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = "ready";
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = "ready";
        state.error = String(action.payload);
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.error = null;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.error = String(action.payload);
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.items = state.items.map((project) =>
          project.id === action.payload.id ? action.payload : project,
        );
        state.error = null;
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.error = String(action.payload);
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.items = state.items.filter((project) => project.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.error = String(action.payload);
      });
  },
});

export default projectsSlice.reducer;
