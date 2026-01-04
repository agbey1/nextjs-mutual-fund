"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateMemberPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        gender: "MALE",
        dob: "",
        phone: "",
        email: "",
        address: "",
        gps: "",
        beneficiaryName: "",
        beneficiaryRelationship: "",
        beneficiaryAddress: "",
        accountNumber: "",
        registrationDate: new Date().toISOString().split('T')[0],
        registrationFee: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin/members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Failed to create member");

            router.push("/admin/members");
            router.refresh();
        } catch (err) {
            setError("Error creating member. Please check fields.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold dark:text-white">Register New Member</h2>
                <Link
                    href="/admin/members"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                    Cancel
                </Link>
            </div>

            {error && (
                <div className="p-3 text-red-700 bg-red-100 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow dark:bg-gray-800">
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
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Number</label>
                    <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be used as the User ID for login.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
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
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GPS Address</label>
                    <input
                        type="text"
                        name="gps"
                        value={formData.gps}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="e.g. GA-123-4567"
                    />
                </div>

                {/* Beneficiary Information */}
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/30 dark:border-gray-600">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Beneficiary Information</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Beneficiary Name</label>
                                <input
                                    type="text"
                                    name="beneficiaryName"
                                    value={formData.beneficiaryName}
                                    onChange={handleChange}
                                    className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Relationship</label>
                                <input
                                    type="text"
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
                                type="text"
                                name="beneficiaryAddress"
                                value={formData.beneficiaryAddress}
                                onChange={handleChange}
                                className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Registration Date</label>
                        <input
                            type="date"
                            name="registrationDate"
                            value={formData.registrationDate}
                            onChange={handleChange}
                            className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
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
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Registering..." : "Register Member"}
                    </button>
                </div>
            </form>
        </div>
    );
}
