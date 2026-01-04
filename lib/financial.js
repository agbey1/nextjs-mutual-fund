"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialUtils = void 0;
var FinancialUtils = /** @class */ (function () {
    function FinancialUtils() {
    }
    /**
     * Calculates the monthly payment for a loan.
     * @param principal Loan amount
     * @param annualRate Annual interest rate (e.g., 0.05 for 5%)
     * @param months Number of months
     * @returns Monthly payment amount
     */
    FinancialUtils.calculatePMT = function (principal, annualRate, months) {
        if (annualRate === 0)
            return principal / months;
        var monthlyRate = annualRate / 12;
        return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    };
    /**
     * Generates an amortization schedule.
     * @param principal Loan amount
     * @param annualRate Annual interest rate (e.g., 0.05 for 5%)
     * @param months Number of months
     * @returns Array of schedule items
     */
    FinancialUtils.generateAmortizationSchedule = function (principal, annualRate, months) {
        if (months <= 0)
            return [];
        var monthlyPayment = this.calculatePMT(principal, annualRate, months);
        var monthlyRate = annualRate / 12;
        var balance = principal;
        var schedule = [];
        var startDate = new Date(); // Start next month? Or current? Usually repayment starts next month.
        startDate.setMonth(startDate.getMonth() + 1);
        for (var i = 1; i <= months; i++) {
            var interest = balance * monthlyRate;
            var principalRepayment = monthlyPayment - interest;
            // Adjust last payment to fix rounding issues
            if (i === months) {
                principalRepayment = balance;
            }
            balance -= principalRepayment;
            if (balance < 0)
                balance = 0; // Floating point fix
            var date = new Date(startDate);
            date.setMonth(startDate.getMonth() + i - 1);
            schedule.push({
                period: i,
                date: date.toISOString(),
                payment: principalRepayment + interest,
                principal: principalRepayment,
                interest: interest,
                balance: balance
            });
        }
        return schedule;
    };
    return FinancialUtils;
}());
exports.FinancialUtils = FinancialUtils;
