import { useSessionStore } from '../stores/session-store';

export function useSession() {
  const store = useSessionStore();

  return {
    session: store.session,
    terminal: store.terminal,
    setTerminal: store.setTerminal,
    openSession: store.openSession,
    closeSession: store.closeSession,
    updateSessionTotals: store.updateSessionTotals,
    isSessionOpen: store.session?.status === 'open',
  };
}
