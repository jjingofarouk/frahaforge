// src/renderer/components/accounting/revenue/productSalesMessages.ts

// Revenue performance analysis
export const getRevenuePerformanceMessage = (totalRevenue: number, revenuePerProduct: number): string => {
  const revenueMessages = [
    // Exceptional revenue (50M+)
    {
      condition: totalRevenue > 50000000,
      messages: [
        `Premium revenue generation: UGX ${(totalRevenue/1000000).toFixed(1)}M demonstrates exceptional market performance`,
        `Outstanding sales achievement: Revenue levels indicate superior product positioning`,
        `Exceptional commercial performance: Current revenue supports significant business scaling`,
        `Market leadership demonstrated: Revenue metrics reflect competitive advantage`
      ]
    },
    // High revenue (10M-50M)
    {
      condition: totalRevenue > 10000000,
      messages: [
        `Strong revenue performance: UGX ${(totalRevenue/1000000).toFixed(1)}M indicates effective sales execution`,
        `Robust commercial activity: Revenue levels support comprehensive market coverage`,
        `Significant revenue achievement: Performance metrics align with growth objectives`,
        `Sustainable revenue generation: Current levels indicate market acceptance`
      ]
    },
    // Good revenue (1M-10M)
    {
      condition: totalRevenue > 1000000,
      messages: [
        `Solid revenue foundation: Sustainable income levels for business operations`,
        `Consistent sales performance: Revenue stream supports operational requirements`,
        `Reliable commercial activity: Current revenue enables strategic initiatives`,
        `Stable revenue pattern: Business model demonstrating consistent performance`
      ]
    },
    // Developing revenue
    {
      condition: totalRevenue > 0,
      messages: [
        `Building revenue momentum: Foundation for growth being established`,
        `Developing sales pipeline: Revenue levels support business continuity`,
        `Establishing market presence: Current revenue enables operational development`,
        `Growing revenue base: Performance indicates market penetration`
      ]
    }
  ];

  const scenario = revenueMessages.find(s => s.condition);
  const messages = scenario?.messages || [
    `Revenue analysis: Commercial performance under review`
  ];
  
  const index = Math.abs(Math.floor(totalRevenue)) % messages.length;
  return messages[index];
};

// Sales volume and quantity analysis
export const getSalesVolumeMessage = (totalQuantity: number, avgUnitsPerTransaction: number): string => {
  const volumeMessages = [
    // High volume (1000+ units)
    {
      condition: totalQuantity > 1000,
      messages: [
        `Exceptional sales volume: ${totalQuantity.toLocaleString()} units indicates strong customer demand`,
        `Outstanding quantity movement: High unit sales demonstrate product popularity`,
        `Massive sales throughput: Volume metrics reflect efficient inventory movement`,
        `Premium volume achievement: Unit sales support operational scale`
      ]
    },
    // Good volume (500-1000 units)
    {
      condition: totalQuantity > 500,
      messages: [
        `Strong sales volume: ${totalQuantity.toLocaleString()} units indicates healthy demand patterns`,
        `Robust quantity movement: Unit sales support business sustainability`,
        `Significant volume achievement: Sales levels indicate market responsiveness`,
        `Consistent sales throughput: Volume metrics align with operational capacity`
      ]
    },
    // Moderate volume (100-500 units)
    {
      condition: totalQuantity > 100,
      messages: [
        `Steady sales volume: Unit movement supports business operations`,
        `Sustainable quantity levels: Sales volume indicates market stability`,
        `Reliable unit movement: Volume metrics support inventory planning`,
        `Consistent sales activity: Quantity levels meet operational requirements`
      ]
    },
    // Developing volume
    {
      condition: totalQuantity > 0,
      messages: [
        `Building sales volume: Foundation for growth being established`,
        `Developing unit movement: Quantity levels support business development`,
        `Establishing sales patterns: Volume metrics indicate market testing`,
        `Growing sales activity: Unit movement supports operational learning`
      ]
    }
  ];

  const scenario = volumeMessages.find(s => s.condition);
  const messages = scenario?.messages || [
    `Volume analysis: Sales quantity metrics under assessment`
  ];
  
  const index = Math.abs(Math.floor(totalQuantity)) % messages.length;
  return messages[index];
};

// Product mix and diversity analysis
export const getProductMixMessage = (totalProducts: number, topCategory: string): string => {
  const productMessages = [
    // Diverse portfolio (20+ products)
    {
      condition: totalProducts > 20,
      messages: [
        `Extensive product portfolio: ${totalProducts} SKUs demonstrate comprehensive market coverage`,
        `Diverse product offering: Wide selection supports customer acquisition and retention`,
        `Comprehensive product mix: Multiple categories enhance business resilience`,
        `Broad market presence: Product diversity indicates strategic positioning`
      ]
    },
    // Good diversity (10-20 products)
    {
      condition: totalProducts > 10,
      messages: [
        `Balanced product portfolio: ${totalProducts} SKUs support sustainable operations`,
        `Strategic product mix: Diversity enhances customer value proposition`,
        `Managed product offering: Portfolio size supports operational efficiency`,
        `Optimized product range: Selection meets market demand effectively`
      ]
    },
    // Focused portfolio (5-10 products)
    {
      condition: totalProducts > 5,
      messages: [
        `Focused product strategy: ${totalProducts} SKUs indicate targeted market approach`,
        `Specialized product offering: Portfolio supports niche market positioning`,
        `Streamlined product mix: Selection demonstrates operational focus`,
        `Concentrated product range: Portfolio size enables deep market penetration`
      ]
    },
    // Limited portfolio
    {
      condition: totalProducts > 0,
      messages: [
        `Developing product portfolio: Foundation for expansion being established`,
        `Strategic product focus: Limited selection enables market specialization`,
        `Targeted product offering: Portfolio supports specific customer segments`,
        `Emerging product mix: Current selection indicates market testing phase`
      ]
    }
  ];

  const scenario = productMessages.find(s => s.condition);
  const messages = scenario?.messages || [
    `Portfolio analysis: Product mix strategy under review`
  ];
  
  const index = Math.abs(Math.floor(totalProducts)) % messages.length;
  return messages[index];
};

// Transaction efficiency analysis
export const getTransactionEfficiencyMessage = (totalTransactions: number, avgTransactionValue: number): string => {
  const transactionMessages = [
    // High transaction volume (50+)
    {
      condition: totalTransactions > 50,
      messages: [
        `Exceptional transaction volume: ${totalTransactions} sales indicate strong customer traffic`,
        `Outstanding sales frequency: High transaction count demonstrates business vitality`,
        `Premium transaction efficiency: Volume metrics reflect operational excellence`,
        `Massive sales throughput: Transaction levels support business scalability`
      ]
    },
    // Good transaction volume (20-50)
    {
      condition: totalTransactions > 20,
      messages: [
        `Strong transaction activity: ${totalTransactions} sales support business sustainability`,
        `Robust sales frequency: Transaction levels indicate healthy customer engagement`,
        `Significant transaction volume: Count metrics align with operational capacity`,
        `Consistent sales throughput: Transaction frequency supports revenue generation`
      ]
    },
    // Moderate transaction volume (5-20)
    {
      condition: totalTransactions > 5,
      messages: [
        `Steady transaction flow: Sales frequency supports operational continuity`,
        `Sustainable transaction levels: Volume metrics indicate business stability`,
        `Reliable sales activity: Transaction count meets operational requirements`,
        `Consistent customer engagement: Sales frequency supports business development`
      ]
    },
    // Developing transaction volume
    {
      condition: totalTransactions > 0,
      messages: [
        `Building transaction momentum: Foundation for growth being established`,
        `Developing sales frequency: Transaction levels support business learning`,
        `Establishing customer patterns: Sales volume indicates market exploration`,
        `Growing transaction activity: Frequency metrics support operational planning`
      ]
    }
  ];

  const scenario = transactionMessages.find(s => s.condition);
  const messages = scenario?.messages || [
    `Transaction analysis: Sales efficiency metrics under assessment`
  ];
  
  const index = Math.abs(Math.floor(totalTransactions)) % messages.length;
  return messages[index];
};