"use client";

import { FinancialUtils } from "@/lib/financial";
import { useEffect, useState } from "react";

interface Props {
    amount: number;
    interestType: "PERCENTAGE" | "FIXED";
    rateOrAmount: number; // Percentage or Fixed Amount
    months: number;
}

export function LoanAmortizationTable({ amount, interestType, rateOrAmount, months }: Props) {
    const [schedule, setSchedule] = useState<any[]>([]);

    useEffect(() => {
        if (amount > 0 && months > 0 && rateOrAmount >= 0) {
            if (interestType === "PERCENTAGE") {
                const annualRate = rateOrAmount / 100;
                const data = FinancialUtils.generateAmortizationSchedule(amount, annualRate, months);
                setSchedule(data);
            } else {
                // Fixed Amount
                const data = FinancialUtils.generateFlatAmortizationSchedule(amount, rateOrAmount, months);
                setSchedule(data);
            }
        } else {
            setSchedule([]);
        }
    }, [amount, interestType, rateOrAmount, months]);

    if (schedule.length === 0) return null;

    const totalInterest = schedule.reduce((sum, item) => sum + item.interest, 0);
    const totalPayment = schedule.reduce((sum, item) => sum + item.payment, 0);

    return (
        <div className="mt-6 border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">Repayment Schedule</h3>
                <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400 mr-4">Total Interest: <span className="font-medium text-orange-600">GH₵{totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span>
                    <span className="text-gray-500 dark:text-gray-400">Total Repayment: <span className="font-medium text-blue-600">GH₵{totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span>
                </div>
            </div>

            <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th className="px-4 py-2">#</th>
                            <th className="px-4 py-2">Due Date</th>
                            <th className="px-4 py-2 text-right">Payment</th>
                            <th className="px-4 py-2 text-right">Principal</th>
                            <th className="px-4 py-2 text-right">Interest</th>
                            <th className="px-4 py-2 text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {schedule.map((item) => (
                            <tr key={item.period} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-2 text-gray-500">{item.period}</td>
                                <td className="px-4 py-2">{new Date(item.date).toLocaleDateString()}</td>
                                <td className="px-4 py-2 text-right font-medium">GH₵{item.payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-4 py-2 text-right text-green-600">GH₵{item.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-4 py-2 text-right text-orange-600">GH₵{item.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-4 py-2 text-right text-gray-500">GH₵{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
