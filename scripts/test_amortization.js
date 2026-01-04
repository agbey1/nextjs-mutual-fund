const { FinancialUtils } = require('../lib/financial');

console.log('Testing Financial Utils...');

// Test Case: 1000 @ 5% for 12 months
// Monthly Rate = 0.05 / 12 = 0.0041666...
// PMT = 1000 * ... approx 85.60

try {
    const principal = 1000;
    const rate = 0.05;
    const months = 12;

    const pmt = FinancialUtils.calculatePMT(principal, rate, months);
    console.log(`PMT for ${principal} @ ${rate * 100}% over ${months}m: ${pmt.toFixed(2)}`);

    if (Math.abs(pmt - 85.61) > 0.01) {
        console.warn('PMT seems off! Expected ~85.61');
    }

    const schedule = FinancialUtils.generateAmortizationSchedule(principal, rate, months);
    console.log(`Schedule generated with ${schedule.length} periods`);

    const last = schedule[schedule.length - 1];
    console.log('Last Payment Balance:', last.balance);

    if (last.balance > 0.01) {
        throw new Error('Loan not fully repaid!');
    }

    const totalPrincipal = schedule.reduce((sum, item) => sum + item.principal, 0);
    console.log('Total Principal Repaid:', totalPrincipal.toFixed(2));

    if (Math.abs(totalPrincipal - principal) > 0.01) {
        throw new Error('Principal mismatch');
    }

    console.log('SUCCESS: Amortization logic valid.');
} catch (e) {
    console.error('FAILED:', e);
    process.exit(1);
}
