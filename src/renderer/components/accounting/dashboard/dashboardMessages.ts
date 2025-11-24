// src/renderer/components/accounting/dashboard/dashboardMessages.ts

// Professional profit messages with financial insight
export const getProfitMessage = (profit: number, margin: number): string => {
  const profitMessages = [
    // Exceptional performance (1M+)
    {
      condition: profit > 1000000,
      messages: [
        `Exceptional performance: UGX ${(profit/1000000).toFixed(1)}M profit demonstrates outstanding operational efficiency`,
        `Remarkable achievement: ${margin.toFixed(1)}% margin reflects superior business execution`,
        `Outstanding results: Profitability at this scale indicates excellent market positioning`,
        `Exemplary performance: UGX ${(profit/1000000).toFixed(1)}M profit showcases optimal resource allocation`
      ]
    },
    // Strong performance (500K-1M)
    {
      condition: profit > 500000,
      messages: [
        `Strong financial performance: UGX ${(profit/1000).toFixed(0)}K profit indicates healthy business operations`,
        `Robust profitability: ${margin.toFixed(1)}% margin suggests sustainable growth trajectory`,
        `Solid earnings: Current profit levels support continued business development`,
        `Commendable results: Profitability metrics align with strategic objectives`
      ]
    },
    // Good performance (100K-500K)
    {
      condition: profit > 100000,
      messages: [
        `Positive financial trajectory: UGX ${(profit/1000).toFixed(0)}K profit demonstrates operational stability`,
        `Sustainable performance: Current profit levels indicate effective cost management`,
        `Steady growth: Profitability metrics support ongoing business initiatives`,
        `Reliable earnings: Financial performance meets operational requirements`
      ]
    },
    // Break-even to modest profit
    {
      condition: profit > 0,
      messages: [
        `Maintaining positive cash flow: Essential for operational continuity`,
        `Achieving financial stability: Foundation for future growth initiatives`,
        `Meeting operational benchmarks: Profitability supports business sustainability`,
        `Establishing financial footing: Positive earnings enable strategic planning`
      ]
    },
    // Break-even
    {
      condition: profit === 0,
      messages: [
        `At operational break-even: Opportunity to optimize revenue streams`,
        `Maintaining cost coverage: Review pricing and expense structures`,
        `Achieving cost recovery: Consider efficiency improvements`,
        `Meeting operational costs: Evaluate revenue enhancement strategies`
      ]
    },
    // Loss situation
    {
      condition: profit < 0,
      messages: [
        `Addressing financial challenge: Implement cost optimization measures`,
        `Managing operational deficit: Review expense allocation and revenue streams`,
        `Navigating financial headwinds: Strategic adjustments recommended`,
        `Optimizing financial position: Focus on revenue growth and cost control`
      ]
    }
  ];

  const scenario = profitMessages.find(s => s.condition);
  const messages = scenario?.messages || [
    `Analyzing financial performance: Data assessment in progress`
  ];
  
  // Rotate through messages based on profit value for variety
  const index = Math.abs(Math.floor(profit)) % messages.length;
  return messages[index];
};

// Sophisticated revenue analysis messages
export const getRevenueMessage = (revenue: number): string => {
  const revenueMessages = [
    // Exceptional revenue (50M+)
    {
      condition: revenue > 50000000,
      messages: [
        `Exceptional revenue generation: UGX ${(revenue/1000000).toFixed(1)}M indicates strong market demand`,
        `Outstanding sales performance: Revenue levels suggest excellent customer acquisition`,
        `Remarkable top-line growth: Current revenue supports significant business scaling`,
        `Premium revenue achievement: Market positioning driving exceptional results`
      ]
    },
    // High revenue (10M-50M)
    {
      condition: revenue > 10000000,
      messages: [
        `Strong revenue performance: UGX ${(revenue/1000000).toFixed(1)}M reflects effective sales execution`,
        `Robust income generation: Revenue levels support comprehensive business operations`,
        `Substantial revenue stream: Current performance indicates market competitiveness`,
        `Significant sales achievement: Revenue metrics align with growth objectives`
      ]
    },
    // Good revenue (1M-10M)
    {
      condition: revenue > 1000000,
      messages: [
        `Solid revenue foundation: Sustainable income levels for business operations`,
        `Consistent sales performance: Revenue stream supports operational requirements`,
        `Reliable income generation: Current revenue enables strategic initiatives`,
        `Stable revenue pattern: Business model demonstrating consistent performance`
      ]
    },
    // Moderate revenue (100K-1M)
    {
      condition: revenue > 100000,
      messages: [
        `Developing revenue stream: Foundation for future growth established`,
        `Building sales momentum: Revenue levels support operational continuity`,
        `Establishing market presence: Current revenue enables business development`,
        `Growing revenue base: Performance indicates market acceptance`
      ]
    },
    // Low revenue
    {
      condition: revenue <= 100000,
      messages: [
        `Initiating revenue generation: Focus on customer acquisition strategies`,
        `Building sales pipeline: Foundation for revenue growth being established`,
        `Developing market entry: Revenue streams in early development phase`,
        `Establishing commercial presence: Initial revenue supporting business launch`
      ]
    }
  ];

  const scenario = revenueMessages.find(s => s.condition);
  const messages = scenario?.messages || [
    `Revenue analysis: Performance metrics under review`
  ];
  
  const index = Math.abs(Math.floor(revenue)) % messages.length;
  return messages[index];
};

// Professional expense management messages
export const getExpenseMessage = (expenses: number): string => {
  const expenseMessages = [
    // Minimal expenses
    {
      condition: expenses === 0,
      messages: [
        `Optimal expense management: Zero operational costs recorded`,
        `Exceptional cost control: No expenses indicates efficient operations`,
        `Maximum operational efficiency: Expense management at optimal levels`,
        `Perfect cost containment: All expenses effectively managed`
      ]
    },
    // Very low expenses
    {
      condition: expenses < 100000,
      messages: [
        `Excellent expense control: Minimal operational costs maintained`,
        `Superior cost management: Expenses well below typical operational thresholds`,
        `Outstanding financial discipline: Cost structure demonstrates efficiency`,
        `Optimal resource allocation: Expenses reflect strategic management`
      ]
    },
    // Low expenses
    {
      condition: expenses < 500000,
      messages: [
        `Effective expense management: Costs aligned with operational requirements`,
        `Efficient resource utilization: Expense levels support business objectives`,
        `Strategic cost control: Expenses managed within optimal parameters`,
        `Prudent financial management: Cost structure supports profitability`
      ]
    },
    // Moderate expenses
    {
      condition: expenses < 1000000,
      messages: [
        `Managed expense profile: Costs within expected operational range`,
        `Controlled expenditure: Expense levels support business sustainability`,
        `Balanced cost structure: Expenses aligned with revenue generation`,
        `Sustainable expense management: Costs support operational continuity`
      ]
    },
    // High expenses
    {
      condition: expenses >= 1000000,
      messages: [
        `Reviewing expense allocation: Opportunity for cost optimization identified`,
        `Analyzing cost structure: Expense levels warrant strategic assessment`,
        `Evaluating expenditure patterns: Cost management review recommended`,
        `Assessing expense efficiency: Potential for operational improvements`
      ]
    }
  ];

  const scenario = expenseMessages.find(s => s.condition);
  const messages = scenario?.messages || [
    `Expense management: Cost analysis in progress`
  ];
  
  const index = Math.abs(Math.floor(expenses)) % messages.length;
  return messages[index];
};

// Additional contextual insights based on combined metrics
export const getBusinessInsight = (revenue: number, expenses: number, profit: number): string => {
  const efficiencyRatio = revenue > 0 ? (expenses / revenue) * 100 : 0;
  
  const insights = [
    {
      condition: efficiencyRatio < 20 && profit > 0,
      messages: [
        `Exceptional operational efficiency: Expense-to-revenue ratio demonstrates superior management`,
        `Optimal business model: Low cost structure supporting high profitability`,
        `Premium efficiency metrics: Business operations demonstrating best practices`,
        `Outstanding financial management: Cost control driving exceptional returns`
      ]
    },
    {
      condition: efficiencyRatio < 40 && profit > 0,
      messages: [
        `Strong operational performance: Balanced cost structure supporting profitability`,
        `Efficient business operations: Expense management contributing to financial health`,
        `Sustainable financial model: Cost-revenue alignment supporting growth`,
        `Effective resource allocation: Operational efficiency driving positive results`
      ]
    },
    {
      condition: efficiencyRatio > 80 && profit < 0,
      messages: [
        `Strategic review recommended: High expense ratio impacting profitability`,
        `Operational optimization opportunity: Cost structure analysis warranted`,
        `Financial restructuring consideration: Expense management requires attention`,
        `Business model assessment: Cost efficiency improvements identified`
      ]
    },
    {
      condition: revenue > 0 && expenses === 0,
      messages: [
        `Maximum operational efficiency: Revenue generation with minimal costs`,
        `Optimal business performance: Pure profit scenario achieved`,
        `Exceptional financial management: Revenue streams operating efficiently`,
        `Premium operational model: Cost-free revenue generation demonstrated`
      ]
    }
  ];

  const insight = insights.find(i => i.condition);
  if (insight) {
    const index = Math.abs(Math.floor(profit)) % insight.messages.length;
    return insight.messages[index];
  }
  
  return `Business performance: Comprehensive analysis ongoing`;
};