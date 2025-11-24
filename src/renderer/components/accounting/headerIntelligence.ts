// src/renderer/components/accounting/headerIntelligence.ts

export const getTimeContext = (startDate: Date, endDate: Date): string => {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const isToday = start.toDateString() === today.toDateString() && end.toDateString() === today.toDateString();
  const isThisWeek = getDaysDifference(start, end) <= 7;
  const isThisMonth = start.getMonth() === today.getMonth() && start.getFullYear() === today.getFullYear();
  
  if (isToday) {
    const hour = today.getHours();
    if (hour < 12) return "Morning Analysis";
    if (hour < 17) return "Afternoon Review";
    return "Evening Summary";
  }
  
  if (isThisWeek) {
    return "Weekly Performance";
  }
  
  if (isThisMonth) {
    return "Monthly Overview";
  }
  
  const daysDiff = getDaysDifference(start, end);
  if (daysDiff <= 30) {
    return "Multi-Week Analysis";
  }
  
  return "Historical Review";
};

export const getDateRangeInsight = (startDate: Date, endDate: Date, transactionCount: number): string => {
  const daysDiff = getDaysDifference(startDate, endDate) + 1;
  const transactionsPerDay = transactionCount / daysDiff;
  
  const insights = [
    {
      condition: transactionsPerDay > 50,
      messages: [
        "High-volume period detected",
        "Peak business activity",
        "Exceptional transaction frequency",
        "Maximum operational throughput"
      ]
    },
    {
      condition: transactionsPerDay > 20,
      messages: [
        "Strong daily performance",
        "Consistent business activity",
        "Healthy transaction volume",
        "Sustainable operational pace"
      ]
    },
    {
      condition: transactionsPerDay > 5,
      messages: [
        "Steady operational flow",
        "Moderate activity levels",
        "Consistent performance",
        "Stable business rhythm"
      ]
    },
    {
      condition: transactionsPerDay > 0,
      messages: [
        "Developing activity patterns",
        "Building operational momentum",
        "Establishing business rhythm",
        "Growing transaction base"
      ]
    }
  ];
  
  const scenario = insights.find(s => s.condition) || { messages: ["Analyzing business patterns"] };
  const index = Math.abs(transactionCount) % scenario.messages.length;
  return scenario.messages[index];
};

export const getPerformanceSuggestion = (revenue: number, expenses: number, transactionCount: number): string | null => {
  const profit = revenue - expenses;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const revenuePerTransaction = transactionCount > 0 ? revenue / transactionCount : 0;
  
  const suggestions = [
    {
      condition: profitMargin > 50 && revenuePerTransaction > 50000,
      messages: [
        "Consider scaling high-margin products for maximum profitability",
        "Premium pricing strategy working effectively - explore expansion",
        "Excellent unit economics - ideal conditions for growth investment",
        "Superior margin performance - optimize inventory for high-value items"
      ]
    },
    {
      condition: profitMargin > 30 && transactionCount > 20,
      messages: [
        "Strong performance - focus on customer retention and repeat business",
        "Healthy margins with good volume - consider marketing expansion",
        "Balanced growth achieved - explore operational efficiency improvements",
        "Sustainable model - invest in customer experience enhancements"
      ]
    },
    {
      condition: profitMargin < 10 && revenue > 0,
      messages: [
        "Review pricing strategy and cost structure for margin improvement",
        "Consider product mix optimization to enhance profitability",
        "Evaluate operational efficiency for cost reduction opportunities",
        "Analyze customer segments for higher-value service opportunities"
      ]
    },
    {
      condition: expenses > revenue * 0.8,
      messages: [
        "High expense ratio detected - recommend cost optimization review",
        "Operational costs impacting profitability - efficiency analysis needed",
        "Expense management opportunity identified - strategic review recommended",
        "Cost structure analysis warranted for improved financial performance"
      ]
    },
    {
      condition: revenuePerTransaction < 10000 && transactionCount > 10,
      messages: [
        "Low average transaction value - consider upselling and cross-selling",
        "Volume-based model detected - focus on increasing customer value",
        "Transaction efficiency opportunity - implement value enhancement strategies",
        "Customer value optimization potential - develop premium service tiers"
      ]
    }
  ];
  
  const suggestion = suggestions.find(s => s.condition);
  if (!suggestion) return null;
  
  const index = Math.abs(Math.floor(profit)) % suggestion.messages.length;
  return suggestion.messages[index];
};

const getDaysDifference = (start: Date, end: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((start.getTime() - end.getTime()) / oneDay));
};

// Additional utility for seasonal insights
export const getSeasonalContext = (date: Date): string => {
  const month = date.getMonth();
  const isHolidaySeason = month === 11 || month === 0; // Dec-Jan
  const isBackToSchool = month === 7 || month === 8; // Aug-Sep
  const isSummer = month >= 5 && month <= 7; // Jun-Aug
  
  if (isHolidaySeason) return "Holiday Season";
  if (isBackToSchool) return "Back-to-School Period";
  if (isSummer) return "Summer Season";
  return "Standard Period";
};