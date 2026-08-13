// Client state for the action-items app.
//
// The v2 mock kept everything in one component's `this.state` and mutated it
// with `setState`. Here that same state lives in a Zustand store so the four
// views can read/update it without prop-drilling — matching the app's existing
// use of Zustand for client state.
import { create } from "zustand";
import type { ActionItem, Screen } from "./types";
import {
  DEFAULT_MEETING_TITLE,
  DEFAULT_RAW,
  RECENTS,
  SAMPLES,
  SEED_ITEMS,
  TODAY,
} from "./constants";

interface ActionItemsState {
  screen: Screen;
  onlyLow: boolean;
  sampleIndex: number;
  /** Index into RECENTS for the open transcript modal, or null when closed. */
  modalIndex: number | null;
  raw: string;
  meetingTitle: string;
  filterOwner: string;
  filterStatus: string;
  historyOwner: string;
  items: ActionItem[];

  goTo: (screen: Screen) => void;
  toggleOnlyLow: () => void;
  setRaw: (raw: string) => void;
  setMeetingTitle: (title: string) => void;
  setFilterOwner: (owner: string) => void;
  setFilterStatus: (status: string) => void;
  setHistoryOwner: (owner: string) => void;
  clearFilters: () => void;
  loadSample: () => void;
  openRecent: (index: number) => void;
  closeModal: () => void;
  /** Load the open recent's transcript into Capture, then close + navigate. */
  loadRecent: () => void;
  /** Edit one field of one item; toggling to/from "Done" maintains `completed`. */
  update: <K extends keyof ActionItem>(
    id: number,
    key: K,
    value: ActionItem[K],
  ) => void;
  confirm: (id: number) => void;
  discard: (id: number) => void;
}

export const useActionItems = create<ActionItemsState>((set) => ({
  screen: "review",
  onlyLow: false,
  sampleIndex: 0,
  modalIndex: null,
  raw: DEFAULT_RAW,
  meetingTitle: DEFAULT_MEETING_TITLE,
  filterOwner: "All",
  filterStatus: "All",
  historyOwner: "All",
  items: SEED_ITEMS,

  goTo: (screen) => set({ screen }),
  toggleOnlyLow: () => set((s) => ({ onlyLow: !s.onlyLow })),
  setRaw: (raw) => set({ raw }),
  setMeetingTitle: (meetingTitle) => set({ meetingTitle }),
  setFilterOwner: (filterOwner) => set({ filterOwner }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setHistoryOwner: (historyOwner) => set({ historyOwner }),
  clearFilters: () => set({ filterOwner: "All", filterStatus: "All" }),

  loadSample: () =>
    set((s) => {
      const next = (s.sampleIndex + 1) % SAMPLES.length;
      return {
        sampleIndex: next,
        raw: SAMPLES[next].text,
        meetingTitle: SAMPLES[next].title,
      };
    }),

  openRecent: (index) => set({ modalIndex: index }),
  closeModal: () => set({ modalIndex: null }),
  loadRecent: () =>
    set((s) => {
      if (s.modalIndex === null) return {};
      const r = RECENTS[s.modalIndex];
      return {
        raw: r.text,
        meetingTitle: r.name,
        modalIndex: null,
        screen: "capture",
      };
    }),

  update: (id, key, value) =>
    set((s) => ({
      items: s.items.map((it) => {
        if (it.id !== id) return it;
        const next = { ...it, [key]: value };
        if (key === "status") {
          next.completed = value === "Done" ? TODAY : null;
        }
        return next;
      }),
    })),

  confirm: (id) =>
    set((s) => ({
      items: s.items.map((it) =>
        it.id === id ? { ...it, confidence: 100 } : it,
      ),
    })),

  discard: (id) =>
    set((s) => ({ items: s.items.filter((it) => it.id !== id) })),
}));
