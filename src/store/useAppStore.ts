import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AppState = {
  currentClassId: string | null
  sidebarOpen: boolean
  copilotOpen: boolean
  setCurrentClassId: (id: string | null) => void
  toggleSidebar: () => void
  toggleCopilot: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentClassId: null,
      sidebarOpen: true,
      copilotOpen: false,
      setCurrentClassId: (id) => set({ currentClassId: id }),
      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),
      toggleCopilot: () =>
        set((state) => ({
          copilotOpen: !state.copilotOpen,
        })),
    }),
    {
      name: 'classpilot-app-store',
    },
  ),
)
