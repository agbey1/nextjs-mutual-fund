export class FinancialUtils {
    /**
     * Calculates the monthly payment for a loan.
     * @param principal Loan amount
     * @param annualRate Annual interest rate (e.g., 0.05 for 5%)
     * @param months Number of months
     * @returns Monthly payment amount
     */
    static calculatePMT(principal: number, annualRate: number, months: number): number {
        if (annualRate === 0) return principal / months;
        const monthlyRate = annualRate / 12;
        return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    }

    /**
     * Generates an amortization schedule.
     * @param principal Loan amount
     * @param annualRate Annual interest rate (e.g., 0.05 for 5%)
     * @param months Number of months
     * @returns Array of schedule items
     */
    static generateAmortizationSchedule(principal: number, annualRate: number, months: number) {
        if (months <= 0) return [];

        const monthlyPayment = this.calculatePMT(principal, annualRate, months);
        const monthlyRate = annualRate / 12;
        let balance = principal;
        const schedule = [];

        const startDate = new Date(); // Start next month? Or current? Usually repayment starts next month.
        startDate.setMonth(startDate.getMonth() + 1);

        for (let i = 1; i <= months; i++) {
            const interest = balance * monthlyRate;
            let principalRepayment = monthlyPayment - interest;

            // Adjust last payment to fix rounding issues
            if (i === months) {
                principalRepayment = balance;
            }

            balance -= principalRepayment;
            if (balance < 0) balance = 0; // Floating point fix

            const date = new Date(startDate);
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
    }

    /**
     * Generates a flat-rate amortization schedule (Fixed Interest Amount).
     * @param principal Loan amount
     * @param totalInterest Total interest amount to be paid
     * @param months Number of months
     * @returns Array of schedule items
     */
    static generateFlatAmortizationSchedule(principal: number, totalInterest: number, months: number) {
        if (months <= 0) return [];

        const monthlyPrincipal = principal / months;
        const monthlyInterest = totalInterest / months;
        const monthlyPayment = monthlyPrincipal + monthlyInterest;

        const schedule = [];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() + 1);

        let balance = principal;

        for (let i = 1; i <= months; i++) {
            // Adjust last payment for rounding
            let p = monthlyPrincipal;
            let int = monthlyInterest;

            if (i === months) {
                p = balance;
                // Interest remains fixed unless we want to match exact total. 
                // Let's assume standard flat rate just distributes evenly.
            }

            balance -= p;
            if (balance < 0) balance = 0;

            const date = new Date(startDate);
            date.setMonth(startDate.getMonth() + i - 1);

            schedule.push({
                period: i,
                date: date.toISOString(),
                payment: p + int,
                principal: p,
                interest: int,
                balance: balance
            });
        }
        return schedule;
    }
}
