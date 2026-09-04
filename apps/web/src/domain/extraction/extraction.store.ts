/** Client-only capture state (draft text, open modal, extraction flag); server
 * data lives in TanStack Query. Next hop: extraction.api.ts → meetings.api.ts. */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ExtractRequest } from "@note2action/shared";
import { extractActionItems } from "@/domain/extraction/extraction.api";
import { createMeeting } from "@/domain/meetings/meetings.api";
import { itemsKey, meetingsKey } from "@/lib/query-keys";
import { queryClient } from "@/lib/query-client";

interface ActionItemsState {
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
  openRecent: (meetingId: number) => void;
  closeModal: () => void;
  /** Runs an AI extraction, then persists the capture via the API — lives in
   * the store (not a component) so it keeps running if the user leaves. */
  extractNotes: (payload: ExtractRequest) => void;
}

/** The capture-flow client store — draft text/title, open modal, extraction status. */
export const useActionItems = create<ActionItemsState>()(
  devtools(
    (set, get) => ({
      modalMeetingId: null,
      raw: "",
      meetingTitle: "",
      extracting: false,
      extractError: null,

      setRaw: (raw) => set({ raw }, false, "extraction/setRaw"),
      setMeetingTitle: (meetingTitle) =>
        set({ meetingTitle }, false, "extraction/setMeetingTitle"),

      openRecent: (meetingId) =>
        set({ modalMeetingId: meetingId }, false, "extraction/openRecent"),
      closeModal: () =>
        set({ modalMeetingId: null }, false, "extraction/closeModal"),

      extractNotes: async (payload) => {
        if (get().extracting) return; // ignore double-clicks
        set(
          { extracting: true, extractError: null },
          false,
          "extraction/extractNotes:start",
        );
        try {
          const extracted = await extractActionItems(payload);
          // Persist at extraction (Module 8): the capture becomes database rows
          // NOW, so the Review queue survives refresh.
          await createMeeting({
            title: get().meetingTitle,
            rawNotes: payload.notes,
            items: extracted,
          });
          // The server now owns the truth. Items block navigation (Review
          // renders them); the meetings strip refreshes lazily on next look.
          await queryClient.invalidateQueries({ queryKey: itemsKey.all });
          void queryClient.invalidateQueries({ queryKey: meetingsKey.all });
          set({ extracting: false }, false, "extraction/extractNotes:done");
        } catch (err) {
          set(
            {
              extracting: false,
              extractError:
                err instanceof Error ? err.message : "Extraction failed",
            },
            false,
            "extraction/extractNotes:error",
          );
        }
      },
    }),
    { name: "ExtractionStore" },
  ),
);
