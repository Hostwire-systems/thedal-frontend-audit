import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { Election } from "../../types";
import { getAllElectionsApi } from "../../api/electionApi";
import axios from "axios";
import { useLoading } from "../../context/LoadingContext";

interface Election {
  picture: string;
  numberOfBooths: number;
  description: string;
  state: string;
  orderIndex:string;
  electionName: string;
  electionDate: string;
  country: string;
}

interface ElectionState {
  currentElection: Election;
  allElections: any[];
  selectedElectionId: string;
  isCurrentElectionFrozen: boolean;
}

const normalizeElectionId = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const initialElectionState: Election = {
  picture: "",
  numberOfBooths: 0,
  description: "",
  orderIndex:"",
  state: "",
  electionName: "",
  electionDate: "",
  country: "",
};
// const {setLoading}=useLoading();

const initialState: ElectionState = {
  currentElection: initialElectionState,
  allElections: [],
  selectedElectionId: localStorage.getItem('selectedElectionId') || "",
  isCurrentElectionFrozen: false,
};

export const fetchElections = createAsyncThunk(
  "elections/fetchElections",
  async () => {
    // setLoading(true);
    try {
      const savedElections = localStorage.getItem("elections");
      if (savedElections) {
        console.log("Elections loaded from local storage.");
        return JSON.parse(savedElections);
      }

      const response = await getAllElectionsApi();
      return response.data;
    } catch (error) {
      console.error("Error fetching elections:", error);
      throw error;
    }
    finally{
      // setLoading(false);
    }
  }
);

const electionSlice = createSlice({
  name: "election",
  initialState,
  reducers: {
    updateElectionDetails(state, action: PayloadAction<Partial<Election>>) {
      state.currentElection = { ...state.currentElection, ...action.payload };
    },

    resetElection(state) {
      state.currentElection = initialElectionState;
    },

    updateAllElections(state, action: PayloadAction<any[]>) {
      state.allElections = action.payload;
      localStorage.setItem('elections', JSON.stringify(action.payload));
      
      // Update freeze status for currently selected election
      if (state.selectedElectionId) {
        const selectedElection = action.payload.find(
          (e) => normalizeElectionId(e.id) === state.selectedElectionId
        );
        state.isCurrentElectionFrozen = selectedElection?.isFrozen === true;
      }
    },

    updateSelectedElectionId(state, action: PayloadAction<string | number>) {
      const normalizedElectionId = normalizeElectionId(action.payload);
      state.selectedElectionId = normalizedElectionId;
      localStorage.setItem('selectedElectionId', normalizedElectionId);

      // Update freeze status when election changes
      const selectedElection = state.allElections.find(
        (e) => normalizeElectionId(e.id) === normalizedElectionId
      );
      state.isCurrentElectionFrozen = selectedElection?.isFrozen === true;
    },

    clearSelectedElectionId(state) {
      state.selectedElectionId = "";
      localStorage.removeItem('selectedElectionId');
      state.isCurrentElectionFrozen = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchElections.fulfilled, (state, action) => {
      state.allElections = action.payload;
      localStorage.setItem('elections', JSON.stringify(action.payload));
      
      // Only set default election if none is selected
      if (!state.selectedElectionId && action.payload.length > 0) {
        const normalizedElectionId = normalizeElectionId(action.payload[0].id);
        state.selectedElectionId = normalizedElectionId;
        localStorage.setItem('selectedElectionId', normalizedElectionId);
        state.isCurrentElectionFrozen = action.payload[0]?.isFrozen === true;
      } else if (state.selectedElectionId) {
        // Update freeze status for existing selection
        const selectedElection = action.payload.find(
          (e) => normalizeElectionId(e.id) === state.selectedElectionId
        );
        state.isCurrentElectionFrozen = selectedElection?.isFrozen === true;
      }
    });
  },
});

export const {
  updateElectionDetails,
  resetElection,
  updateAllElections,
  updateSelectedElectionId,
  clearSelectedElectionId,
} = electionSlice.actions;

// Selectors
export const selectIsCurrentElectionFrozen = (state: any) => state.election.isCurrentElectionFrozen;
export const selectCurrentElection = (state: any) => {
  const selectedId = state.election.selectedElectionId;
  return state.election.allElections.find((e: any) => normalizeElectionId(e.id) === selectedId);
};

export default electionSlice.reducer;