export type DashboardData = {
    currentPeriod: string | null;
    periodStatus: string;
    accountantView: {
        openPayables: number;
        receivablesAging: { total: number; current: number };
        dailyCashPosition: { cash: number; bank: number; mobileMoney: number };
    };
    financeManagerView: {
        profitability: {
            revenue: number;
            cogs: number;
            expenses: number;
            netProfit: number;
        };
        costPerLiter: number;
        expenseTrends: Record<string, number>;
    };
    mdView: {
        dailySales: { bottles: number; jerrycans: number; events: number; total: number };
        netProfit: number;
        eventVsRetail: { event: number; retail: number };
        wastageImpact: number;
        analysis?: {
            dailyProfit: number;
            dailyExpenditures: number;
            netDailyProfit: number;
            weeklyRevenue: number;
            weeklySales: number;
            dailyTrend?: { date: string; revenue: number }[];
        }
    };
};

export type Period = {
    id: string;
    period_month: string;
    status: string;
    start_date: string;
    end_date: string;
};

export type Account = {
    id: string;
    account_code: string;
    account_name: string;
    account_type: string;
    active: boolean;
};

export type LedgerEntry = {
    id: string;
    entry_date: string;
    account: { account_code: string; account_name: string };
    debit_amount: number;
    credit_amount: number;
    source_type: string;
    source_id: string;
    department: string;
    description: string | null;
};
