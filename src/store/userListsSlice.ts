import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Типы данных
export type UserTestList = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  items: UserTestListItem[];
};

export type UserTestListItem = {
  id: string;
  testId: string;
  order: number;
  addedAt: string;
  test: {
    id: string;
    title: string;
    description?: string;
    difficulty: string;
    tags?: string[];
  };
};

type UserListsState = {
  lists: UserTestList[];
  loading: boolean;
  error: string | null;
};

// Начальное состояние
const initialState: UserListsState = {
  lists: [],
  loading: false,
  error: null,
};

// Async thunks для API вызовов
export const fetchUserLists = createAsyncThunk(
  'userLists/fetchLists',
  async () => {
    const response = await fetch('/api/user-lists');
    if (!response.ok) {
      throw new Error('Failed to fetch lists');
    }
    return response.json();
  }
);

export const createUserList = createAsyncThunk(
  'userLists/createList',
  async (data: { name: string; description?: string; icon?: string; color?: string }) => {
    const response = await fetch('/api/user-lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create list');
    }
    return response.json();
  }
);

export const updateUserList = createAsyncThunk(
  'userLists/updateList',
  async ({ id, data }: { id: string; data: Partial<UserTestList> }) => {
    const response = await fetch(`/api/user-lists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update list');
    }
    return response.json();
  }
);

export const deleteUserList = createAsyncThunk(
  'userLists/deleteList',
  async (id: string) => {
    const response = await fetch(`/api/user-lists/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete list');
    }
    return id;
  }
);

export const addTestToList = createAsyncThunk(
  'userLists/addTest',
  async ({ listId, testId }: { listId: string; testId: string }) => {
    const response = await fetch(`/api/user-lists/${listId}/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add test to list');
    }
    return { listId, item: await response.json() };
  }
);

export const removeTestFromList = createAsyncThunk(
  'userLists/removeTest',
  async ({ listId, testId }: { listId: string; testId: string }) => {
    const response = await fetch(`/api/user-lists/${listId}/tests/${testId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to remove test from list');
    }
    return { listId, testId };
  }
);

// Slice
const userListsSlice = createSlice({
  name: 'userLists',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch lists
    builder.addCase(fetchUserLists.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserLists.fulfilled, (state, action: PayloadAction<UserTestList[]>) => {
      state.loading = false;
      state.lists = action.payload;
    });
    builder.addCase(fetchUserLists.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch lists';
    });

    // Create list
    builder.addCase(createUserList.fulfilled, (state, action: PayloadAction<UserTestList>) => {
      state.lists.unshift(action.payload);
    });
    builder.addCase(createUserList.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to create list';
    });

    // Update list
    builder.addCase(updateUserList.fulfilled, (state, action: PayloadAction<UserTestList>) => {
      const index = state.lists.findIndex((list) => list.id === action.payload.id);
      if (index !== -1) {
        state.lists[index] = action.payload;
      }
    });
    builder.addCase(updateUserList.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to update list';
    });

    // Delete list
    builder.addCase(deleteUserList.fulfilled, (state, action: PayloadAction<string>) => {
      state.lists = state.lists.filter((list) => list.id !== action.payload);
    });
    builder.addCase(deleteUserList.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to delete list';
    });

    // Add test to list
    builder.addCase(addTestToList.fulfilled, (state, action) => {
      const { listId, item } = action.payload;
      const list = state.lists.find((l) => l.id === listId);
      if (list) {
        list.items.push(item);
      }
    });
    builder.addCase(addTestToList.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to add test to list';
    });

    // Remove test from list
    builder.addCase(removeTestFromList.fulfilled, (state, action) => {
      const { listId, testId } = action.payload;
      const list = state.lists.find((l) => l.id === listId);
      if (list) {
        list.items = list.items.filter((item) => item.testId !== testId);
      }
    });
    builder.addCase(removeTestFromList.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to remove test from list';
    });
  },
});

export const { clearError } = userListsSlice.actions;
export default userListsSlice.reducer;
