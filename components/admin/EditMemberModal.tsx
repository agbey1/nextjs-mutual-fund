'use client';

import { useState, useEffect } from 'react';

interface EditMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: {
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        email: string | null;
        address: string;
        gps?: string;
        gender: string;
        dateOfBirth: string;
        beneficiaryName?: string;
        beneficiaryRelationship?: string;
        beneficiaryAddress?: string;
        registrationFee?: number;
    };
    onSave: () => void;
}

export function EditMemberModal({ isOpen, onClose, member, onSave }: EditMemberModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        gps: '',
        gender: 'MALE',
        dob: '',
        beneficiaryName: '',
        beneficiaryRelationship: '',
        beneficiaryAddress: '',
        registrationFee: ''
    });

    useEffect(() => {
        if (member && isOpen) {
            setFormData({
                firstName: member.firstName || '',
                lastName: member.lastName || '',
                phone: member.phone || '',
                email: member.email || '',
                address: member.address || '',
                gps: member.gps || '',
                gender: member.gender || 'MALE',
                dob: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '',
                beneficiaryName: member.beneficiaryName || '',
                beneficiaryRelationship: member.beneficiaryRelationship || '',
                beneficiaryAddress: member.beneficiaryAddress || '',
                registrationFee: member.registrationFee?.toString() || ''
            });
        }
    }, [member, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/admin/members', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: member.id, ...formData })
            });

            if (res.ok) {
                onSave();
                onClose();
            } else {
                alert('Failed to update member');
            }
        } catch (err) {
            alert('Error updating member');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold dark:text-white">Edit Member Information</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                            <input
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                            <input
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                            <input
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                        <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                        <input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GPS Address</label>
                        <input
                            name="gps"
                            value={formData.gps}
                            onChange={handleChange}
                            className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="e.g. GA-123-4567"
                        />
                    </div>

                    {/* Beneficiary Section */}
                    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/30 dark:border-gray-600">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Beneficiary Information</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Beneficiary Name</label>
                                    <input
                                        name="beneficiaryName"
                                        value={formData.beneficiaryName}
                                        onChange={handleChange}
                                        className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Relationship</label>
                                    <input
                                        name="beneficiaryRelationship"
                                        value={formData.beneficiaryRelationship}
                                        onChange={handleChange}
                                        className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="e.g. Spouse"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Beneficiary Address</label>
                                <input
                                    name="beneficiaryAddress"
                                    value={formData.beneficiaryAddress}
                                    onChange={handleChange}
                                    className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Registration Fee (GH₵)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="registrationFee"
                            value={formData.registrationFee}
                            onChange={handleChange}
                            className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-600 dark:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
