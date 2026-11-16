import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, clearSession, getToken, saveSession } from "@/lib/api";

const initialState = {
  user: null,
  status: "loading",
  error: null,
};

function message(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}

export const fetchMe = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
  try {
    const data = await api("/api/auth/me");
    return data.user;
  } catch (error) {
    clearSession();
    return rejectWithValue(message(error, "Session expired."));
  }
});

export const login = createAsyncThunk("auth/login", async (body, { rejectWithValue }) => {
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    saveSession(data.token);
    return data.user;
  } catch (error) {
    return rejectWithValue(message(error, "Login failed."));
  }
});

export const signup = createAsyncThunk("auth/signup", async (body, { rejectWithValue }) => {
  try {
    const data = await api("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    });
    saveSession(data.token);
    return data.user;
  } catch (error) {
    return rejectWithValue(message(error, "Signup failed."));
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      clearSession();
      state.user = null;
      state.status = "ready";
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
    markReady(state) {
      state.status = "ready";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "ready";
        state.error = null;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.status = "ready";
      })
      .addCase(login.pending, (state) => {
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "ready";
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.error = String(action.payload);
      })
      .addCase(signup.pending, (state) => {
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "ready";
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.error = String(action.payload);
      });
  },
});

export const { logout, markReady, clearError } = authSlice.actions;

export function bootstrapAuth() {
  return getToken() ? fetchMe() : markReady();
}

export default authSlice.reducer;
