/**
 * Header Search Store — Zustand-based reusable search input in Header.
 * Pages register placeholder on mount, read query, unregister on unmount.
 */

import { create } from "zustand";

export const useHeaderSearchStore = create((set) => ({
  query: "",
  placeholder: "",
  visible: false,
  showConnectedFilter: false,
  connectedOnly: false,
  connectedCount: 0,

  setQuery: (query) => set({ query }),
  setConnectedOnly: (connectedOnly) => set({ connectedOnly }),
  toggleConnectedOnly: () => set((s) => ({ connectedOnly: !s.connectedOnly })),
  setConnectedCount: (connectedCount) => set({ connectedCount }),

  register: (placeholder = "Search...", options = {}) =>
    set({
      visible: true,
      placeholder,
      query: "",
      showConnectedFilter: Boolean(options.showConnectedFilter),
      connectedOnly: Boolean(options.connectedOnly),
      connectedCount: options.connectedCount || 0,
    }),

  unregister: () =>
    set({
      visible: false,
      placeholder: "",
      query: "",
      showConnectedFilter: false,
      connectedOnly: false,
      connectedCount: 0,
    }),
}));

