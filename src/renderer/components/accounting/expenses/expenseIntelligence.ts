// src/renderer/src/components/accounting/expenseIntelligence.ts

export const getExpenseEfficiencyMessage = (efficiencyScore: number, totalExpenses: number): string => {
  const messages = [
    {
      condition: efficiencyScore >= 90,
      messages: [
        "Exceptional cost control maintained",
        "Premium expense management efficiency",
        "Outstanding financial discipline demonstrated",
        "Optimal cost structure achieved"
      ]
    },
    {
      condition: efficiencyScore >= 75,
      messages: [
        "Strong expense management performance",
        "Effective cost control measures in place",
        "Sustainable expense patterns established",
        "Reliable financial oversight maintained"
      ]
    },
    {
      condition: efficiencyScore >= 60,
      messages: [
        "Moderate expense efficiency achieved",
        "Acceptable cost management levels",
        "Standard operational expense patterns",
        "Manageable cost structure maintained"
      ]
    },
    {
      condition: efficiencyScore > 0,
      messages: [
        "Cost optimization opportunities identified",
        "Expense management review recommended",
        "Financial efficiency improvements possible",
        "Cost structure analysis warranted"
      ]
    }
  ];

  const scenario = messages.find(s => s.condition) || { messages: ["Analyzing expense patterns"] };
  const index = Math.abs(Math.floor(totalExpenses)) % scenario.messages.length;
  return scenario.messages[index];
};

export const getExpenseTrendMessage = (averageExpense: number, expenseCount: number): string => {
  const transactionDensity = expenseCount > 0 ? averageExpense / expenseCount : 0;
  
  const messages = [
    {
      condition: expenseCount > 20 && averageExpense < 100000,
      messages: [
        "High volume, low value transaction pattern",
        "Efficient small-expense management",
        "Optimized operational cost distribution",
        "Effective micro-expense control"
      ]
    },
    {
      condition: expenseCount > 10 && averageExpense > 500000,
      messages: [
        "Strategic high-value expense pattern",
        "Premium transaction management",
        "Significant capital allocation efficiency",
        "Major expense optimization achieved"
      ]
    },
    {
      condition: expenseCount > 5,
      messages: [
        "Balanced expense distribution",
        "Sustainable transaction frequency",
        "Managed operational cost flow",
        "Consistent expense pattern established"
      ]
    },
    {
      condition: expenseCount > 0,
      messages: [
        "Developing expense patterns",
        "Initial transaction analysis complete",
        "Foundation for cost management established",
        "Basic expense tracking operational"
      ]
    }
  ];

  const scenario = messages.find(s => s.condition) || { messages: ["Transaction analysis in progress"] };
  const index = Math.abs(expenseCount) % scenario.messages.length;
  return scenario.messages[index];
};

export const getCategoryInsightMessage = (topCategory: string | undefined, categoryBreakdown: Record<string, number>): string => {
  if (!topCategory) return "Category analysis pending";
  
  const categoryPercentage = categoryBreakdown[topCategory] / Object.values(categoryBreakdown).reduce((a, b) => a + b, 0) * 100;
  
  const messages = [
    {
      condition: categoryPercentage > 50,
      messages: [
        `${topCategory} dominates expense allocation`,
        `Primary cost center: ${topCategory}`,
        `Major expense focus: ${topCategory} category`,
        `${topCategory} represents significant cost portion`
      ]
    },
    {
      condition: categoryPercentage > 30,
      messages: [
        `${topCategory} leads expense categories`,
        `Key expense driver: ${topCategory}`,
        `${topCategory} category shows highest utilization`,
        `Primary operational cost: ${topCategory}`
      ]
    },
    {
      condition: categoryPercentage > 15,
      messages: [
        `${topCategory} emerges as top category`,
        `Leading expense category: ${topCategory}`,
        `${topCategory} demonstrates significant usage`,
        `Notable cost category: ${topCategory}`
      ]
    },
    {
      condition: true,
      messages: [
        `${topCategory} identified as primary category`,
        `Top spending category: ${topCategory}`,
        `${topCategory} category analysis complete`,
        `Category leadership: ${topCategory}`
      ]
    }
  ];

  const scenario = messages.find(s => s.condition);
  const messagesList = scenario?.messages || ["Category analysis complete"];
  const index = Math.abs(topCategory.length) % messagesList.length;
  return messagesList[index];
};

export const getExpenseOptimizationSuggestion = (stats: any): string | null => {
  const { efficiencyScore, averageExpense, expenseCount, categoryBreakdown } = stats;
  
  const suggestions = [
    {
      condition: efficiencyScore < 60 && averageExpense > 500000,
      messages: [
        "Consider expense approval workflow for high-value transactions",
        "Review high-value expense categories for optimization opportunities",
        "Implement spending limits for major expense categories",
        "Analyze high-cost transactions for efficiency improvements"
      ]
    },
    {
      condition: Object.keys(categoryBreakdown).length < 3 && expenseCount > 10,
      messages: [
        "Diversify expense categories for better cost allocation",
        "Consider expanding expense category structure",
        "Review category distribution for optimization",
        "Analyze expense categorization for improvements"
      ]
    },
    {
      condition: efficiencyScore < 70 && expenseCount > 15,
      messages: [
        "Implement regular expense review procedures",
        "Consider automated expense tracking solutions",
        "Review expense patterns for optimization",
        "Analyze recurring expenses for efficiency"
      ]
    },
    {
      condition: averageExpense < 50000 && expenseCount > 25,
      messages: [
        "Excellent micro-expense management demonstrated",
        "Consider bulk purchasing for frequent small expenses",
        "Micro-expense pattern indicates operational efficiency",
        "Small transaction management working effectively"
      ]
    }
  ];

  const suggestion = suggestions.find(s => s.condition);
  if (!suggestion) return null;
  
  const index = Math.abs(Math.floor(stats.totalExpenses)) % suggestion.messages.length;
  return suggestion.messages[index];
};