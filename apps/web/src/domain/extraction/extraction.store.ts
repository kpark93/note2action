// Client-only state (draft text, open modal, extraction flag); server
// data (items, meetings) lives in TanStack Query — see items.queries.ts.
// Path: capture/notes/recent/meetings views → [this file] →
// extraction.api.ts + meetings.api.ts → lib/query-client.ts (cache inval.).
// (request-paths.md §3 AI capture)
import { create } from "zustand";
import type { ExtractRequest } from "@note2action/shared";
import { extractActionItems } from "@/domain/extraction/extraction.api";
import { createMeeting } from "@/domain/meetings/meetings.api";
import { itemsKey } from "@/domain/items/items.queries";
import { meetingsKey } from "@/domain/meetings/meetings.queries";
import { queryClient } from "@/lib/query-client";
import {
  DEFAULT_MEETING_TITLE,
  DEFAULT_RAW,
  SAMPLES,
} from "./extraction.constants";

interface ActionItemsState {
  sampleIndex: number;
  /** Meeting id for the open transcript modal, or null when closed. */
  modalMeetingId: number | null;
  raw: string;
  meetingTitle: string;
  /** True while an AI extraction is in flight (survives tab switches). */
  extracting: boolean;
  /** Message from the last failed extraction, or null. */
  extractError: string | null;

  setRaw: (raw: string) => void;
  setMeetingTitle: (title: string) => void;
  loadSample: () => void;
  openRecent: (meetingId: number) => void;
  closeModal: () => void;
  /** Load a recent capture's transcript into the editor (from the modal). */
  loadTranscript: (title: string, text: string) => void;
  /**
   * Runs an AI extraction, then persists the capture via the API. Lives
   * in the store (not a component) so it keeps running if the user leaves.
   */
  extractNotes: (payload: ExtractRequest) => void;
}

/**
 * The capture-flow client store — draft text/title, open modal, and
 * extraction status (see field comments above).
 */
export const useActionItems = create<ActionItemsState>((set, get) => ({
  sampleIndex: 0,
  modalMeetingId: null,
  raw: DEFAULT_RAW,
  meetingTitle: DEFAULT_MEETING_TITLE,
  extracting: false,
  extractError: null,

  setRaw: (raw) => set({ raw }),
  setMeetingTitle: (meetingTitle) => set({ meetingTitle }),

  loadSample: () =>
    set((s) => {
      const next = (s.sampleIndex + 1) % SAMPLES.length;
      return {
        sampleIndex: next,
        raw: SAMPLES[next].text,
        meetingTitle: SAMPLES[next].title,
      };
    }),

  openRecent: (meetingId) => set({ modalMeetingId: meetingId }),
  closeModal: () => set({ modalMeetingId: null }),
  loadTranscript: (title, text) =>
    set({ raw: text, meetingTitle: title, modalMeetingId: null }),

  extractNotes: async (payload) => {
    if (get().extracting) return; // ignore double-clicks
    set({ extracting: true, extractError: null });
    try {
      const extracted = await extractActionItems(payload);
      // Persist at extraction (the Module 8 decision): the capture becomes
      // database rows NOW, so the Review queue survives any refresh.
      await createMeeting({
        title: get().meetingTitle,
        rawNotes: payload.notes,
        items: extracted.map((e) => {
          // Accept confidence as either 0-1 or 0-100, then clamp to 0-100.
          const raw = e.confidence <= 1 ? e.confidence * 100 : e.confidence;
          return {
            ...e,
            confidence: Math.round(Math.max(0, Math.min(100, raw))),
          };
        }),
      });
      // The server now owns the truth — make every view refetch it.
      await queryClient.invalidateQueries({ queryKey: itemsKey });
      await queryClient.invalidateQueries({ queryKey: meetingsKey });
      set({ extracting: false });
    } catch (err) {
      set({
        extracting: false,
        extractError: err instanceof Error ? err.message : "Extraction failed",
      });
    }
  },
}));
