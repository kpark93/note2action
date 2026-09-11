/** Client-only capture draft (text + title); never touches network or cache. */
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface ActionItemsState {
  raw: string;
  meetingTitle: string;

  setRaw: (raw: string) => void;
  setMeetingTitle: (title: string) => void;
  /** Empties the draft — called by the capture mutation once the save lands. */
  clearDraft: () => void;
}

/** The capture-flow client store — just the draft. */
export const useActionItems = create<ActionItemsState>()(
  devtools(
    (set) => ({
      raw: "",
      meetingTitle: "",

      setRaw: (raw) => set({ raw }, false, "extraction/setRaw"),
      setMeetingTitle: (meetingTitle) =>
        set({ meetingTitle }, false, "extraction/setMeetingTitle"),

      clearDraft: () =>
        set({ raw: "", meetingTitle: "" }, false, "extraction/clearDraft"),
    }),
    { name: "ExtractionStore" },
  ),
);
