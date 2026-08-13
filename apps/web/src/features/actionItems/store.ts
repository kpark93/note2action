// Client state for the action-items app.
//
// The v2 mock kept everything in one component's `this.state` and mutated it
// with `setState`. Here that same state lives in a Zustand store so the four
// views can read/update it without prop-drilling — matching the app's existing
// use of Zustand for client state.
import { create } from "zustand";
import type { ExtractRequest, ExtractedItem } from "@note2action/shared";
import { extractActionItems } from "./api";
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
  /** True while an AI extraction is in flight (survives tab switches). */
  extracting: boolean;
  /** Message from the last failed extraction, or null. */
  extractError: string | null;

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
  /** Replace the pending Review batch with freshly extracted items (keeps saved tasks + history). */
  applyExtraction: (extracted: ExtractedItem[]) => void;
  /** Move all pending Review items into the Tasks list; they leave Review. */
  saveToTasks: () => void;
  /** Send a saved task back to the Review queue (unsave it). */
  sendToReview: (id: number) => void;
  /**
   * Run an AI extraction. Lives in the store (not a component) so it keeps
   * running — and applies its result — even if the user leaves the Capture tab.
   */
  extractNotes: (payload: ExtractRequest) => void;
}

export const useActionItems = create<ActionItemsState>((set, get) => ({
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
  extracting: false,
  extractError: null,

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

  applyExtraction: (extracted) =>
    set((s) => {
      // Keep already-saved tasks and completed history; only the pending
      // (unsaved, non-done) Review batch is replaced.
      const keep = s.items.filter((it) => it.status === "Done" || it.saved);
      let nextId = s.items.reduce((max, it) => Math.max(max, it.id), 0);
      const pending: ActionItem[] = extracted.map((e) => {
        // Accept confidence as either 0-1 or 0-100, then clamp.
        const raw = e.confidence <= 1 ? e.confidence * 100 : e.confidence;
        return {
          id: ++nextId,
          title: e.title,
          owner: e.owner,
          due: e.due,
          priority: e.priority,
          confidence: Math.round(Math.max(0, Math.min(100, raw))),
          status: "Not started",
          saved: false,
          note: e.note,
          meeting: s.meetingTitle,
          completed: null,
        };
      });
      return { items: [...pending, ...keep] };
    }),

  saveToTasks: () =>
    set((s) => ({
      items: s.items.map((it) =>
        it.status !== "Done" && !it.saved ? { ...it, saved: true } : it,
      ),
      screen: "tasks",
      onlyLow: false,
    })),

  sendToReview: (id) =>
    set((s) => ({
      items: s.items.map((it) =>
        it.id === id ? { ...it, saved: false } : it,
      ),
    })),

  extractNotes: async (payload) => {
    if (get().extracting) return; // ignore double-clicks
    set({ extracting: true, extractError: null });
    try {
      const items = await extractActionItems(payload);
      // Apply + navigate happen here — independent of any mounted component,
      // so switching tabs mid-extraction can't drop the result.
      get().applyExtraction(items);
      set({ extracting: false, screen: "review" });
    } catch (err) {
      set({
        extracting: false,
        extractError:
          err instanceof Error ? err.message : "Extraction failed",
      });
    }
  },
}));
