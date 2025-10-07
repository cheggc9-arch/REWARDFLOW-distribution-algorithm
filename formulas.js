/**
 * RewardFlow Distribution Algorithm - Core Formulas
 * 
 * This file contains the mathematical formulas used to calculate
 * fair reward distributions to token holders.
 */

/**
 * Calculate the weightage for a single holder
 *
 * Uses the EXACT formulas provided by the user:
 * 
 * token_balance_weight = 1 + log10(token_balance / min_threshold)
 * early_bonus = 1 + 2 × exp(-days_since_launch / 2)
 * tenure_bonus = 1 + 0.6 × log2(days_held + 1)
 * time_weight = early_bonus × tenure_bonus
 * total_weight = token_balance_weight × time_weight
 *
 * @param {number} tokens - Number of tokens held
 * @param {number} hoursAfterLaunch - Hours after launch when first bought
 * @param {number} hoursSinceLaunch - Total hours since launch
 * @param {number} minBalance - Minimum balance required to qualify
 * @returns {object} Detailed weightage breakdown
 */
function calculateWeightage(tokens, hoursAfterLaunch, hoursSinceLaunch, minBalance) {
  try {
    // Only include holders with balance ≥ minimum threshold
    if (tokens < minBalance) {
      return {
        balanceWeight: 0,
        earlyBonus: 0,
        tenureBonus: 0,
        timeWeight: 0,
        totalWeight: 0,
        hoursSinceLaunch: 0,
        hoursHeld: 0,
        qualified: false
      };
    }
    
    // Calculate time differences in hours
    const hoursHeld = hoursSinceLaunch - hoursAfterLaunch;
    
    // Convert to days for the same formula as main website
    const daysSinceLaunch = hoursAfterLaunch / 24;
    const daysHeld = hoursHeld / 24;
    
    // 1. Token Balance Weight - EXACT FORMULA FROM USER
    const tokenBalanceWeight = 1 + Math.log10(tokens / minBalance);
    
    // 2. Early Bonus - EXACT FORMULA FROM USER
    const earlyBonus = 1 + 2 * Math.exp(-daysSinceLaunch / 2);
    
    // 3. Tenure Bonus - EXACT FORMULA FROM USER
    const tenureBonus = 1 + 0.6 * Math.log2(daysHeld + 1);
    
    // 4. Time Weight - EXACT FORMULA FROM USER
    const timeWeight = earlyBonus * tenureBonus;
    
    // 5. Total Weight - EXACT FORMULA FROM USER
    const totalWeight = tokenBalanceWeight * timeWeight;
    
    return {
      balanceWeight: tokenBalanceWeight,
      earlyBonus,
      tenureBonus,
      timeWeight,
      totalWeight,
      hoursSinceLaunch: hoursAfterLaunch,
      hoursHeld,
      qualified: true
    };
    
  } catch (error) {
    console.error('Error calculating weightage:', error);
    return {
      balanceWeight: 0,
      earlyBonus: 0,
      tenureBonus: 0,
      timeWeight: 0,
      totalWeight: 0,
      hoursSinceLaunch: 0,
      hoursHeld: 0,
      qualified: false
    };
  }
}

/**
 * Calculate distribution amounts for all holders
 * 
 * Uses the EXACT reward formula: reward = (your_weight / total_weights_all) × total_rewards
 * 
 * @param {Array} holders - Array of holder objects
 * @param {number} totalTreasury - Total treasury amount to distribute
 * @param {number} feeReserve - Percentage to reserve for fees (0-1)
 * @returns {Array} Distribution results for each holder
 */
function calculateDistribution(holders, totalTreasury, feeReserve = 0.05) {
  // Filter out holders with zero weightage or above max balance
  const validHolders = holders
    .map(holder => ({
      ...holder,
      weightage: calculateWeightage(
        holder.tokens, 
        holder.hoursAfterLaunch, 
        holder.hoursSinceLaunch, 
        holder.minBalance
      )
    }))
    .filter(holder => {
      // Check if qualified (meets min balance) AND not above max balance
      return holder.weightage.qualified && holder.tokens <= holder.maxBalance;
    });

  if (validHolders.length === 0) {
    return [];
  }

  // Calculate total weightage
  const totalWeightage = validHolders.reduce((sum, holder) => sum + holder.weightage.totalWeight, 0);

  // Reserve fees
  const feeAmount = totalTreasury * feeReserve;
  const availableForDistribution = totalTreasury - feeAmount;

  // Calculate distribution amounts
  const distributionResults = validHolders.map(holder => {
    const share = holder.weightage.totalWeight / totalWeightage;
    const amount = availableForDistribution * share;

    return {
      address: holder.address,
      tokens: holder.tokens,
      weightage: holder.weightage,
      share,
      amount,
      sharePercentage: share * 100
    };
  });

  // Filter out very small amounts (less than 0.000001)
  const filteredResults = distributionResults.filter(result => result.amount >= 0.000001);

  return filteredResults;
}

/**
 * Get distribution statistics
 * 
 * @param {Array} holders - Array of holder objects
 * @param {Array} distribution - Distribution results
 * @returns {object} Statistics about the distribution
 */
function getDistributionStats(holders, distribution) {
  const validHolders = holders.filter(h => h.tokens >= h.minBalance);
  const totalTokens = validHolders.reduce((sum, h) => sum + h.tokens, 0);
  const totalWeightage = distribution.reduce((sum, d) => sum + d.weightage.totalWeight, 0);
  const totalDistributed = distribution.reduce((sum, d) => sum + d.amount, 0);

  // Calculate averages
  const averageWeight = totalWeightage / distribution.length;
  const averageReward = totalDistributed / distribution.length;

  // Find top and bottom recipients
  const sortedByWeight = [...distribution].sort((a, b) => b.weightage.totalWeight - a.weightage.totalWeight);
  const sortedByReward = [...distribution].sort((a, b) => b.amount - a.amount);

  return {
    totalHolders: holders.length,
    validHolders: validHolders.length,
    totalTokens,
    totalWeightage,
    totalDistributed,
    averageWeight,
    averageReward,
    topWeight: sortedByWeight[0],
    topReward: sortedByReward[0],
    bottomWeight: sortedByWeight[sortedByWeight.length - 1],
    bottomReward: sortedByReward[sortedByReward.length - 1]
  };
}

/**
 * Format number for display
 * 
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
function formatNumber(num, decimals = 4) {
  return num.toFixed(decimals);
}

/**
 * Format large numbers with commas
 * 
 * @param {number} num - Number to format
 * @returns {string} Formatted number with commas
 */
function formatLargeNumber(num) {
  return num.toLocaleString();
}

module.exports = {
  calculateWeightage,
  calculateDistribution,
  getDistributionStats,
  formatNumber,
  formatLargeNumber
};
