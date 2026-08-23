import { create } from "zustand";

type UiState = {
  tutorOpen: boolean;
  setTutorOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  tutorOpen: false,
  setTutorOpen: (tutorOpen) => set({ tutorOpen }),
}));
