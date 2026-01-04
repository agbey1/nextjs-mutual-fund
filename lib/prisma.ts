
// import { PrismaClient } from '@prisma/client';
import { mockMembers, mockTransactions, mockExpenses, mockAuditLogs } from './mockData';
import { hashPassword } from './hash'; // Need for dynamic phone-based passwords

// Extract all transactions from embedded member data
// const allTransactions: any[] = mockMembers.flatMap((m: any) => m.transactions || []);
// Helper to get fresh list of all transactions including new ones
const getAllTransactions = () => {
    const memberTx = mockMembers.flatMap((m: any) => m.transactions || []);
    return [...memberTx, ...mockTransactions];
};

console.log(`[Prisma Mock] Loaded ${mockMembers.length} members`);

// Pre-computed hash for admin (password: 'admin')
const ADMIN_HASH = '7577157acda183b837bfb540f4313995:4b3357685e15df3774f05f77448f21e72d38b16ff0e211053b41779cf0f99165e819585766bb97e3425268748561309d562e8950f0533bfb7a37d6a04a6676d7';

// Initial Mock Users - phone number as password
// Note: We generate hashes once at startup for mock members
const mockUsers = [
    { id: 'mock-admin-id', username: 'admin', name: 'Admin', role: 'ADMIN', password: ADMIN_HASH },
    ...mockMembers.map((m: any) => ({
        id: m.userId,
        username: m.accountNumber,
        name: `${m.firstName} ${m.lastName}`,
        role: 'MEMBER',
        password: hashPassword(String(m.phone || '')), // Convert phone to string
        memberId: m.id
    }))
] as any[];

const PrismaClient = class {
    constructor() { }

    // Static storage for ephemeral data
    static loanRequests: any[] = [];
    static dividendDistributions: any[] = [];

    member = {
        findMany: async (args: any) => {
            // Return members with all balance fields
            // Filter support? Simple mock filter
            let result = mockMembers.map((m: any) => ({
                ...m,
                totalSavings: m.totalSavings || 0,
                totalShares: m.totalShares || 0,
                totalLoans: m.totalLoans || 0
            }));

            if (args?.where?.OR) {
                const search = args.where.OR[0].firstName.contains;
                if (search) {
                    const lower = search.toLowerCase();
                    result = result.filter((m: any) =>
                        m.firstName.toLowerCase().includes(lower) ||
                        m.lastName.toLowerCase().includes(lower) ||
                        m.accountNumber.includes(search)
                    );
                }
            }

            // Ordering
            if (args?.orderBy?.lastName) {
                result.sort((a: any, b: any) => a.lastName.localeCompare(b.lastName));
            }

            return result;
        },
        findUnique: async (args: any) => {
            const m = mockMembers.find((m: any) => m.id === args?.where?.id || m.userId === args?.where?.userId || m.accountNumber === args?.where?.accountNumber);
            if (!m) return null;

            const result: any = {
                ...m,
                totalSavings: m.totalSavings || 0,
                totalShares: m.totalShares || 0,
                totalLoans: m.totalLoans || 0,
                beneficiaryName: m.beneficiaryName || null
            };

            // Handle include: { transactions: ... }
            if (args?.include?.transactions) {
                // Transactions are already embedded in mockMembers
                result.transactions = m.transactions || [];
            }

            return result;
        },
        aggregate: async () => {
            // Mock aggregate
            const totalSavings = mockMembers.reduce((sum: number, m: any) => sum + (m.totalSavings || 0), 0);
            const totalShares = mockMembers.reduce((sum: number, m: any) => sum + (m.totalShares || 0), 0);
            const totalLoans = mockMembers.reduce((sum: number, m: any) => sum + (m.totalLoans || 0), 0);
            return { _sum: { totalSavings, totalShares, totalLoans } };
        },
        count: async () => mockMembers.length,
        create: async (args: any) => {
            const newMember = {
                id: 'mem-' + Date.now(),
                ...args.data,
                totalSavings: 0,
                totalShares: 0,
                totalLoans: 0,
                transactions: []
            };
            (mockMembers as any[]).push(newMember);
            return newMember;
        },
        update: async (args: any) => {
            const index = mockMembers.findIndex((m: any) => m.id === args.where.id);
            if (index > -1) {
                mockMembers[index] = { ...mockMembers[index], ...args.data };
                return mockMembers[index];
            }
            return null;
        }
    };

    user = {
        findUnique: async (args: any) => {
            const where = args?.where;
            let user = null;

            if (where?.username) {
                user = mockUsers.find((u: any) => u.username === where.username) || null;
            } else if (where?.id) {
                user = mockUsers.find((u: any) => u.id === where.id) || null;
            }

            if (!user) return null;

            // Handle include: { member: true }
            if (args?.include?.member) {
                const member = mockMembers.find((m: any) => m.userId === user.id) || null;
                return { ...user, member };
            }

            return user;
        },
        create: async (args: any) => {
            const newUser = {
                id: 'user-' + Date.now(),
                ...args.data
            };
            mockUsers.push(newUser);
            return newUser;
        },
        update: async (args: any) => {
            const index = mockUsers.findIndex((u: any) => u.id === args.where.id);
            if (index === -1) throw new Error("User not found");
            mockUsers[index] = { ...mockUsers[index], ...args.data };
            return mockUsers[index];
        },
        upsert: async (args: any) => {
            // Mock upsert
            const existing = mockUsers.find(u => u.username === args.where.username);
            if (existing) {
                // Update
                const index = mockUsers.indexOf(existing);
                mockUsers[index] = { ...existing, ...args.update };
                return mockUsers[index];
            } else {
                // Create
                const newUser = { id: 'user-' + Date.now(), ...args.create };
                mockUsers.push(newUser);
                return newUser;
            }
        }
    };

    expense = {
        findMany: async (args: any) => {
            return mockExpenses;
        },
        aggregate: async (args?: any) => {
            let expenses = [...mockExpenses];
            // Apply date filter if provided
            if (args?.where?.date?.lte) {
                expenses = expenses.filter((e: any) => new Date(e.date) <= new Date(args.where.date.lte));
            }
            const sum = expenses.reduce((acc: number, e: any) => acc + e.amount, 0);
            return { _sum: { amount: sum } };
        },
        create: async (args: any) => {
            const newEx = { id: 'ex-' + Date.now(), ...args.data };
            (mockExpenses as any[]).push(newEx);
            return newEx;
        },
        update: async (args: any) => {
            const index = mockExpenses.findIndex((e: any) => e.id === args.where.id);
            if (index === -1) throw new Error("Expense not found");
            mockExpenses[index] = { ...mockExpenses[index], ...args.data };
            return mockExpenses[index];
        },
        delete: async (args: any) => {
            const index = mockExpenses.findIndex((e: any) => e.id === args.where.id);
            if (index === -1) throw new Error("Expense not found");
            mockExpenses.splice(index, 1);
            return { id: args.where.id };
        }
    };

    transaction = {
        findMany: async (args: any) => {
            let result = getAllTransactions();

            if (args?.where?.memberId) {
                result = result.filter((t: any) => t.memberId === args.where.memberId);
            }
            if (args?.where?.type) {
                if (args.where.type.in) {
                    result = result.filter((t: any) => args.where.type.in.includes(t.type));
                } else {
                    result = result.filter((t: any) => t.type === args.where.type);
                }
            }

            // Sort
            result = result.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // Pagination
            if (args?.take) {
                const skip = args.skip || 0;
                result = result.slice(skip, skip + args.take);
            }

            return result;
        },
        count: async (args: any) => {
            let result = getAllTransactions();
            if (args?.where?.memberId) result = result.filter((t: any) => t.memberId === args.where.memberId);
            return result.length;
        },
        aggregate: async (args: any) => {
            let result = getAllTransactions();
            if (args?.where?.type) {
                if (args.where.type.in) {
                    result = result.filter((t: any) => args.where.type.in.includes(t.type));
                } else {
                    result = result.filter((t: any) => t.type === args.where.type);
                }
            }
            // ... (aggregation logic)
            const sum = result.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
            const interest = result.reduce((acc: number, t: any) => acc + (t.interestAmount || 0), 0);
            return { _sum: { amount: sum, interestAmount: interest } };
        },
        create: async (args: any) => {
            const newTx = {
                id: 'tx-' + Date.now(),
                ...args.data,
                date: args.data.date || new Date().toISOString()
            };
            (mockTransactions as any[]).push(newTx);
            return newTx;
        },
        update: async (args: any) => {
            // Try finding in new transactions first
            const idx = mockTransactions.findIndex((t: any) => t.id === args.where.id);
            if (idx > -1) {
                mockTransactions[idx] = { ...mockTransactions[idx], ...args.data };
                return mockTransactions[idx];
            }

            // Try finding in legacy member transactions
            for (const member of mockMembers) {
                const txIdx = (member.transactions || []).findIndex((t: any) => t.id === args.where.id);
                if (txIdx > -1) {
                    member.transactions[txIdx] = { ...member.transactions[txIdx], ...args.data };
                    return member.transactions[txIdx];
                }
            }

            throw new Error(`Transaction ${args.where.id} not found`);
        },
        findUnique: async (args: any) => {
            const all = getAllTransactions();
            return all.find((t: any) => t.id === args?.where?.id) || null;
        }
    };

    auditLog = {
        findMany: async (args: any) => {
            // Return empty array for now - audit logs aren't persisted in mock
            return mockAuditLogs || [];
        },
        create: async (args: any) => {
            // Mock audit - store in memory
            const newLog = { id: 'log-' + Date.now(), ...args.data, timestamp: new Date().toISOString() };
            if (mockAuditLogs) (mockAuditLogs as any[]).push(newLog);
            return newLog;
        }
    };

    loanRequest = {
        findMany: async (args: any) => {
            let result = [...PrismaClient.loanRequests];

            if (args?.where?.memberId) {
                result = result.filter((l: any) => l.memberId === args.where.memberId);
            }
            if (args?.where?.status) {
                result = result.filter((l: any) => l.status === args.where.status);
            }

            // Sort by createdAt desc
            result.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // Include member data if requested
            if (args?.include?.member) {
                result = result.map((l: any) => ({
                    ...l,
                    member: mockMembers.find((m: any) => m.id === l.memberId) || null
                }));
            }

            return result;
        },
        findUnique: async (args: any) => {
            const loan = PrismaClient.loanRequests.find((l: any) => l.id === args?.where?.id);
            if (!loan) return null;

            if (args?.include?.member) {
                return {
                    ...loan,
                    member: mockMembers.find((m: any) => m.id === loan.memberId) || null
                };
            }
            return loan;
        },
        create: async (args: any) => {
            const newLoan = {
                id: 'loan-' + Date.now(),
                ...args.data,
                status: args.data.status || 'PENDING',
                interestType: args.data.interestType || 'PERCENTAGE',
                interestRate: args.data.interestRate !== undefined ? args.data.interestRate : 10,
                interestAmount: args.data.interestAmount || 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            PrismaClient.loanRequests.push(newLoan);
            return newLoan;
        },
        update: async (args: any) => {
            const index = PrismaClient.loanRequests.findIndex((l: any) => l.id === args.where.id);
            if (index === -1) throw new Error("Loan request not found");
            PrismaClient.loanRequests[index] = {
                ...PrismaClient.loanRequests[index],
                ...args.data,
                updatedAt: new Date().toISOString()
            };
            return PrismaClient.loanRequests[index];
        },
        count: async (args: any) => {
            let result = [...PrismaClient.loanRequests];
            if (args?.where?.status) {
                result = result.filter((l: any) => l.status === args.where.status);
            }
            return result.length;
        }
    };

    dividendDistribution = {
        findMany: async (args?: any) => {
            let result = [...PrismaClient.dividendDistributions];
            result.sort((a: any, b: any) => new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime());
            return result;
        },
        create: async (args: any) => {
            const newDist = {
                id: 'div-' + Date.now(),
                ...args.data,
                distributedAt: new Date().toISOString()
            };
            PrismaClient.dividendDistributions.push(newDist);
            return newDist;
        },
        findUnique: async (args: any) => {
            return PrismaClient.dividendDistributions.find((d: any) => d.id === args?.where?.id) || null;
        }
    };

    $transaction = async (callback: any) => {
        return callback(this);
    };
};

const prisma = new PrismaClient();
export default prisma;
