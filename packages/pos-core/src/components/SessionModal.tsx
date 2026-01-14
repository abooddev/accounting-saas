import React, { useState } from 'react';
import type { POSSession } from '../types';
import { formatCurrency } from '../utils/currency';

interface SessionModalProps {
  currentSession: POSSession | null;
  onOpenSession: (params: {
    cashierId: string;
    cashierName: string;
    openingCashUSD: number;
    openingCashLBP: number;
  }) => void;
  onCloseSession: (params: {
    closingCashUSD: number;
    closingCashLBP: number;
  }) => void;
  onCancel: () => void;
  cashierId: string;
  cashierName: string;
}

export function SessionModal({
  currentSession,
  onOpenSession,
  onCloseSession,
  onCancel,
  cashierId,
  cashierName,
}: SessionModalProps) {
  const isOpen = currentSession?.status === 'open';

  const [openingUSD, setOpeningUSD] = useState('0');
  const [openingLBP, setOpeningLBP] = useState('0');
  const [closingUSD, setClosingUSD] = useState('');
  const [closingLBP, setClosingLBP] = useState('');

  const handleOpen = () => {
    onOpenSession({
      cashierId,
      cashierName,
      openingCashUSD: parseFloat(openingUSD) || 0,
      openingCashLBP: parseFloat(openingLBP) || 0,
    });
  };

  const handleClose = () => {
    onCloseSession({
      closingCashUSD: parseFloat(closingUSD) || 0,
      closingCashLBP: parseFloat(closingLBP) || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">
            {isOpen ? 'Close Session' : 'Open Session'}
          </h2>
        </div>

        {isOpen && currentSession ? (
          <div className="p-4 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Current Session</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Opened:</div>
                <div>{new Date(currentSession.openedAt).toLocaleString()}</div>
                <div>Transactions:</div>
                <div>{currentSession.totalTransactions}</div>
                <div>Total Sales:</div>
                <div>{formatCurrency(currentSession.totalSales, 'USD')}</div>
                <div>Expected USD:</div>
                <div>{formatCurrency(currentSession.expectedCashUSD, 'USD')}</div>
                <div>Expected LBP:</div>
                <div>{formatCurrency(currentSession.expectedCashLBP, 'LBP')}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Closing Cash (USD)</label>
              <input
                type="number"
                value={closingUSD}
                onChange={(e) => setClosingUSD(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder={currentSession.expectedCashUSD.toString()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Closing Cash (LBP)</label>
              <input
                type="number"
                value={closingLBP}
                onChange={(e) => setClosingLBP(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder={currentSession.expectedCashLBP.toString()}
              />
            </div>

            {closingUSD && closingLBP && (
              <div className="bg-yellow-50 p-3 rounded-lg text-sm">
                <div className="font-medium mb-1">Difference</div>
                <div>
                  USD: {formatCurrency(
                    parseFloat(closingUSD) - currentSession.expectedCashUSD,
                    'USD'
                  )}
                </div>
                <div>
                  LBP: {formatCurrency(
                    parseFloat(closingLBP) - currentSession.expectedCashLBP,
                    'LBP'
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <div className="font-medium">Cashier: {cashierName}</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Opening Cash (USD)</label>
              <input
                type="number"
                value={openingUSD}
                onChange={(e) => setOpeningUSD(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Opening Cash (LBP)</label>
              <input
                type="number"
                value={openingLBP}
                onChange={(e) => setOpeningLBP(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="0"
              />
            </div>
          </div>
        )}

        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={isOpen ? handleClose : handleOpen}
            className={`flex-1 py-3 text-white rounded-lg font-bold ${
              isOpen
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isOpen ? 'Close Session' : 'Open Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
