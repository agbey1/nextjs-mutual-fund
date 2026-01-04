'use client';

import { useState, useEffect } from 'react';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    interestAmount?: number;
    date: string;
    description: string;
    receiptNumber?: string;
    isReversal?: boolean;
}

interface EditModaProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    onSave: (id: string, updates: { date: string; description: string; receiptNumber: string }) => Promise<void>;
}

export const EditTransactionModal = ({ isOpen, onClose, transaction, onSave }: EditModaProps) => {
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (transaction) {
            // Format date for datetime-local input (YYYY-MM-DDTHH:mm) or just date (YYYY-MM-DD)
            // Assuming transaction.date is ISO string
            const d = new Date(transaction.date);
            const formattedDate = d.toISOString().slice(0, 16); // "2023-01-01T12:00"
            setDate(formattedDate);
            setDescription(transaction.description || '');
            setReceiptNumber(transaction.receiptNumber || '');
        }
    }, [transaction]);

    if (!isOpen || !transaction) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // ISO date string required by backend
            const isoDate = new Date(date).toISOString();
            await onSave(transaction.id, { date: isoDate, description, receiptNumber });
            onClose();
        } catch (error) {
            console.error("Failed to save", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Transaction</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <input type="text" disabled value={transaction.type} className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <input type="text" disabled value={transaction.amount} className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                        <input
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Receipt Number</label>
                        <input
                            type="text"
                            value={receiptNumber}
                            onChange={(e) => setReceiptNumber(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ReverseModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    onConfirm: (id: string, reason: string) => Promise<void>;
}

export const ReverseTransactionModal = ({ isOpen, onClose, transaction, onConfirm }: ReverseModalProps) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !transaction) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onConfirm(transaction.id, reason);
            onClose();
            setReason('');
        } catch (error) {
            console.error("Failed to reverse", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-red-600">Reverse Transaction</h2>
                <div className="mb-4 bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800">
                    Warning: This will create a new offsetting transaction to nullify the effect of this transaction. This action cannot be undone.
                </div>
                <div className="mb-4">
                    <p className="text-sm text-gray-600">Reversing: <strong>{transaction.description}</strong></p>
                    <p className="text-sm text-gray-600">Amount: <strong>{transaction.amount}</strong></p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Reason for Reversal</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                            rows={3}
                            required
                            placeholder="e.g. Error in data entry, duplicate transaction..."
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
                            {loading ? 'Processing...' : 'Reverse Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
