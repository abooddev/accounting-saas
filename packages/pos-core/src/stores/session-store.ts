import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { POSSession, POSTerminal } from '../types';

interface SessionState {
  session: POSSession | null;
  terminal: POSTerminal | null;

  setTerminal: (terminal: POSTerminal) => void;

  openSession: (params: {
    cashierId: string;
    cashierName: string;
    openingCashUSD: number;
    openingCashLBP: number;
  }) => POSSession;

  closeSession: (params: {
    closingCashUSD: number;
    closingCashLBP: number;
  }) => POSSession | null;

  updateSessionTotals: (params: {
    saleAmount: number;
    isReturn?: boolean;
  }) => void;

  getSession: () => POSSession | null;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  terminal: null,

  setTerminal: (terminal) => {
    set({ terminal });
  },

  openSession: ({ cashierId, cashierName, openingCashUSD, openingCashLBP }) => {
    const terminal = get().terminal;
    if (!terminal) {
      throw new Error('Terminal not configured');
    }

    const newSession: POSSession = {
      id: uuidv4(),
      localId: uuidv4(),
      terminalId: terminal.id,
      terminalCode: terminal.code,
      cashierId,
      cashierName,
      openedAt: new Date(),
      closedAt: null,
      openingCashUSD,
      openingCashLBP,
      closingCashUSD: null,
      closingCashLBP: null,
      expectedCashUSD: openingCashUSD,
      expectedCashLBP: openingCashLBP,
      differenceUSD: null,
      differenceLBP: null,
      totalSales: 0,
      totalReturns: 0,
      totalTransactions: 0,
      status: 'open',
      syncStatus: 'pending',
    };

    set({ session: newSession });
    return newSession;
  },

  closeSession: ({ closingCashUSD, closingCashLBP }) => {
    const session = get().session;
    if (!session || session.status !== 'open') {
      return null;
    }

    const closedSession: POSSession = {
      ...session,
      closedAt: new Date(),
      closingCashUSD,
      closingCashLBP,
      differenceUSD: closingCashUSD - session.expectedCashUSD,
      differenceLBP: closingCashLBP - session.expectedCashLBP,
      status: 'closed',
    };

    set({ session: closedSession });
    return closedSession;
  },

  updateSessionTotals: ({ saleAmount, isReturn = false }) => {
    set((state) => {
      if (!state.session) return state;

      return {
        session: {
          ...state.session,
          totalSales: isReturn
            ? state.session.totalSales
            : state.session.totalSales + saleAmount,
          totalReturns: isReturn
            ? state.session.totalReturns + saleAmount
            : state.session.totalReturns,
          totalTransactions: state.session.totalTransactions + 1,
          expectedCashUSD: isReturn
            ? state.session.expectedCashUSD - saleAmount
            : state.session.expectedCashUSD + saleAmount,
        },
      };
    });
  },

  getSession: () => get().session,
}));
