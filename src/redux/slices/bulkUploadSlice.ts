import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface BulkUpload {
  bulkUploadId: number | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  startTime: string;
  endTime: string;
  electionId: string;
}

interface BulkUploadState {
  uploads: BulkUpload[];
  isListUploaded: boolean;
}

const initialState: BulkUploadState = {
  uploads: [],
  isListUploaded: false,
};

const bulkUploadSlice = createSlice({
  name: "bulkUpload",
  initialState,
  reducers: {
    addBulkUpload: (state, action: PayloadAction<BulkUpload>) => {
      if (!Array.isArray(state.uploads)) {
        state.uploads = [];
      }
      state.uploads.push(action.payload);
    },
    removeUpload: (state, action: PayloadAction<number>) => {
      state.uploads = state.uploads.filter(
        (upload) => upload.bulkUploadId !== action.payload
      );
    },
    clearAllUploads: (state) => {
      state.uploads = [];
    },
    setIsListUploaded: (state, action: PayloadAction<boolean>) => {
      state.isListUploaded = action.payload;
    },
  },
});

export const {
  addBulkUpload,
  clearAllUploads,
  removeUpload,
  setIsListUploaded,
} = bulkUploadSlice.actions;

export default bulkUploadSlice.reducer;

export const selectActiveUploads = (state: { bulkUpload: BulkUploadState }) =>
  state.bulkUpload.uploads;

export const selectUploadById =
  (uploadId: number) => (state: { bulkUpload: BulkUploadState }) =>
    state.bulkUpload.uploads.find((upload) => upload.bulkUploadId === uploadId);

export const selectIsListUploaded = (state: { bulkUpload: BulkUploadState }) =>
  state.bulkUpload.isListUploaded;
