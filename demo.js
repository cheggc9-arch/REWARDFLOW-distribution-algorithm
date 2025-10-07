#!/usr/bin/env node

/**
 * RewardFlow Distribution Algorithm - Interactive Demo
 * 
 * An interactive tool to test the RewardFlow distribution algorithm.
 * Add holders, configure settings, and see how rewards are distributed.
 */

const readline = require('readline');
const { calculateWeightage, calculateDistribution, getDistributionStats, formatNumber, formatLargeNumber } = require('./formulas');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Global state
let config = {
  minBalance: 20000,          // 20K tokens minimum
  maxBalance: 100000000,      // 100M tokens maximum
  treasuryBalance: 10.0,      // 10 SOL treasury
  feeReserve: 0.05,          // 5% fee reserve
  hoursSinceLaunch: 48        // Hours since token launch
};

let holders = [];

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Helper function to ask yes/no questions
async function askYesNo(question) {
  while (true) {
    const answer = await askQuestion(`${question} (y/n): `);
    const lower = answer.toLowerCase();
    if (lower === 'y' || lower === 'yes') return true;
    if (lower === 'n' || lower === 'no') return false;
    console.log('Please enter y or n');
  }
}

// Helper function to ask for number
async function askNumber(question, min = null, max = null) {
  while (true) {
    const answer = await askQuestion(question);
    const num = parseFloat(answer);
    
    if (isNaN(num)) {
      console.log('Please enter a valid number');
      continue;
    }
    
    if (min !== null && num < min) {
      console.log(`Please enter a number >= ${min}`);
      continue;
    }
    
    if (max !== null && num > max) {
      console.log(`Please enter a number <= ${max}`);
      continue;
    }
    
    return num;
  }
}

// Display main menu
function displayMenu() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 RewardFlow Distribution Algorithm - Interactive Demo');
  console.log('='.repeat(60));
  console.log('1. Configure Settings');
  console.log('2. Add Holder');
  console.log('3. View Holders');
  console.log('4. Run Distribution & View Results');
  console.log('5. Clear All Data');
  console.log('6. Exit');
  console.log('='.repeat(60));
}

// Configure settings
async function configureSettings() {
  console.log('\n📋 Current Settings:');
  console.log(`   Min Balance: ${formatLargeNumber(config.minBalance)} tokens`);
  console.log(`   Max Balance: ${formatLargeNumber(config.maxBalance)} tokens`);
  console.log(`   Treasury Balance: ${config.treasuryBalance} SOL`);
  console.log(`   Fee Reserve: ${(config.feeReserve * 100).toFixed(1)}%`);
  console.log(`   Hours Since Launch: ${config.hoursSinceLaunch} hours`);
  
  const change = await askYesNo('\nDo you want to change any settings?');
  
  if (change) {
    config.minBalance = await askNumber('Enter minimum balance (tokens): ', 1);
    config.maxBalance = await askNumber('Enter maximum balance (tokens): ', config.minBalance);
    config.treasuryBalance = await askNumber('Enter treasury balance (SOL): ', 0.001);
    config.feeReserve = await askNumber('Enter fee reserve percentage (0-50): ', 0, 50) / 100;
    config.hoursSinceLaunch = await askNumber('Enter hours since launch: ', 1);
    
    console.log('\n✅ Settings updated!');
  }
}

// Add a new holder
async function addHolder() {
  console.log('\n👤 Adding New Holder');
  console.log('='.repeat(40));
  
  const address = await askQuestion('Enter wallet address: ');
  
  // Check if address already exists
  const existingHolder = holders.find(h => h.address.toLowerCase() === address.toLowerCase());
  if (existingHolder) {
    console.log('\n❌ This address already exists!');
    console.log(`   Address: ${existingHolder.address}`);
    console.log(`   Current Tokens: ${formatLargeNumber(existingHolder.tokens)}`);
    console.log(`   Bought at: Hour ${existingHolder.hoursAfterLaunch} after launch`);
    console.log('\nPress Enter to return to main menu...');
    await askQuestion('');
    return;
  }
  
  const tokens = await askNumber('Enter token balance: ', 1); // Allow any balance
  const hoursAfterLaunch = await askNumber(`Enter hours after launch when first bought (max ${config.hoursSinceLaunch}): `, 0, config.hoursSinceLaunch);
  
  // Calculate hours held
  const hoursHeld = config.hoursSinceLaunch - hoursAfterLaunch;
  
  // Calculate weightage using hours
  const weightage = calculateWeightage(tokens, hoursAfterLaunch, config.hoursSinceLaunch, config.minBalance);
  
  const holder = {
    address,
    tokens,
    hoursAfterLaunch,
    hoursHeld,
    minBalance: config.minBalance,
    maxBalance: config.maxBalance,
    hoursSinceLaunch: config.hoursSinceLaunch
  };
  
  holders.push(holder);
  
  console.log('\n✅ Holder added!');
  console.log(`   Address: ${address}`);
  console.log(`   Tokens: ${formatLargeNumber(tokens)}`);
  console.log(`   Bought at: Hour ${hoursAfterLaunch} after launch`);
  console.log(`   Hours Held: ${hoursHeld} hours`);
  console.log(`   Weight: ${formatNumber(weightage.totalWeight)}`);
  
  if (!weightage.qualified) {
    console.log('   ⚠️  This holder will NOT qualify for distribution (below min balance)');
  } else if (tokens > config.maxBalance) {
    console.log('   ⚠️  This holder will NOT qualify for distribution (above max balance)');
  } else {
    console.log('   ✅ This holder WILL qualify for distribution');
  }
}

// View all holders
async function viewHolders() {
  console.log('\n🔍 Checking holders...');
  
  if (holders.length === 0) {
    console.log('\n📋 No holders added yet');
    console.log('   Use option 2 to add your first holder');
    console.log('   Or use option 1 to configure settings first');
    console.log('\nPress Enter to return to main menu...');
    await askQuestion('');
    return;
  }
  
  console.log('\n📋 Current Holders:');
  console.log('='.repeat(120));
  console.log('Address'.padEnd(30) + ' | ' + 'Tokens'.padStart(15) + ' | ' + 'Hour Bought'.padStart(12) + ' | ' + 'Hours Held'.padStart(12) + ' | ' + 'Weight'.padStart(12) + ' | ' + 'Status'.padStart(10));
  console.log('-'.repeat(120));
  
  holders.forEach((holder, index) => {
    const weightage = calculateWeightage(holder.tokens, holder.hoursAfterLaunch, holder.hoursSinceLaunch, config.minBalance);
    
    // Check qualification status
    let status = '❌';
    let reason = '';
    
    if (!weightage.qualified) {
      reason = 'Below min';
    } else if (holder.tokens > config.maxBalance) {
      reason = 'Above max';
    } else {
      status = '✅';
      reason = 'Qualified';
    }
    
    console.log(
      holder.address.substring(0, 29).padEnd(30) + ' | ' +
      formatLargeNumber(holder.tokens).padStart(15) + ' | ' +
      `Hour ${holder.hoursAfterLaunch}`.padStart(12) + ' | ' +
      `${holder.hoursHeld}h`.padStart(12) + ' | ' +
      formatNumber(weightage.totalWeight).padStart(12) + ' | ' +
      status.padStart(10)
    );
  });
  
  console.log('-'.repeat(120));
  console.log(`Total: ${holders.length} holders`);
  console.log('\nPress Enter to return to main menu...');
  await askQuestion('');
}

// Run distribution calculation and show detailed results
async function runDistributionAndResults() {
  if (holders.length === 0) {
    console.log('\n❌ No holders added. Please add some holders first.');
    console.log('\nPress Enter to return to main menu...');
    await askQuestion('');
    return;
  }
  
  console.log('\n🧮 Running Distribution Calculation...');
  console.log('='.repeat(50));
  
  // Show filtering info
  const totalHolders = holders.length;
  const qualifiedHolders = holders.filter(h => {
    const weightage = calculateWeightage(h.tokens, h.hoursAfterLaunch, h.hoursSinceLaunch, config.minBalance);
    return weightage.qualified && h.tokens <= config.maxBalance;
  }).length;
  
  console.log(`📊 Total holders: ${totalHolders}`);
  console.log(`✅ Qualified holders: ${qualifiedHolders}`);
  console.log(`❌ Filtered out: ${totalHolders - qualifiedHolders}`);
  
  // Calculate distribution
  const distribution = calculateDistribution(holders, config.treasuryBalance, config.feeReserve);
  
  if (distribution.length === 0) {
    console.log('❌ No valid holders for distribution');
    console.log('\nPress Enter to return to main menu...');
    await askQuestion('');
    return;
  }
  
  // Get statistics
  const stats = getDistributionStats(holders, distribution);
  
  console.log('\n📊 Distribution Results:');
  console.log('='.repeat(80));
  console.log('Address'.padEnd(20) + 'Tokens'.padStart(15) + 'Weight'.padStart(12) + 'Share%'.padStart(10) + 'Reward'.padStart(12));
  console.log('-'.repeat(80));
  
  // Sort by reward amount (highest first)
  const sortedDistribution = [...distribution].sort((a, b) => b.amount - a.amount);
  
  sortedDistribution.forEach((result, index) => {
    console.log(
      result.address.substring(0, 19).padEnd(20) +
      formatLargeNumber(result.tokens).padStart(15) +
      formatNumber(result.weightage.totalWeight).padStart(12) +
      formatNumber(result.sharePercentage, 2).padStart(10) +
      formatNumber(result.amount, 6).padStart(12)
    );
  });
  
  console.log('-'.repeat(80));
  console.log(`Total Distributed: ${formatNumber(stats.totalDistributed, 6)} SOL`);
  console.log(`Valid Holders: ${stats.validHolders}`);
  console.log(`Average Weight: ${formatNumber(stats.averageWeight)}`);
  console.log(`Average Reward: ${formatNumber(stats.averageReward, 6)} SOL`);
  
  // Show top and bottom recipients
  console.log('\n🏆 Top Recipient:');
  console.log(`   ${stats.topReward.address}: ${formatNumber(stats.topReward.amount, 6)} SOL`);
  
  console.log('\n📉 Bottom Recipient:');
  console.log(`   ${stats.bottomReward.address}: ${formatNumber(stats.bottomReward.amount, 6)} SOL`);
  
  // Show detailed breakdown for each holder
  console.log('\n📊 Detailed Results:');
  console.log('='.repeat(120));
  
  distribution.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.address}`);
    console.log('   ' + '─'.repeat(80));
    
    // Basic Info
    console.log(`   📊 Basic Information:`);
    console.log(`      Tokens Held: ${formatLargeNumber(result.tokens)}`);
    console.log(`      Bought at: Hour ${result.weightage.hoursSinceLaunch} after launch`);
    console.log(`      Hours Held: ${result.weightage.hoursHeld} hours`);
    console.log(`      Days Held: ${formatNumber(result.weightage.hoursHeld / 24, 1)} days`);
    
    // Weightage Calculation Details
    console.log(`\n   🧮 Weightage Calculation:`);
    console.log(`      Formula: token_balance_weight × time_weight`);
    console.log(`      Formula: (1 + log10(tokens/min)) × (early_bonus × tenure_bonus)`);
    console.log(`      `);
    console.log(`      Step 1 - Balance Weight:`);
    console.log(`         Formula: 1 + log10(${formatLargeNumber(result.tokens)} / ${formatLargeNumber(config.minBalance)})`);
    console.log(`         Calculation: 1 + log10(${formatNumber(result.tokens / config.minBalance, 2)})`);
    console.log(`         Result: ${formatNumber(result.weightage.balanceWeight, 4)}`);
    console.log(`      `);
    console.log(`      Step 2 - Early Bonus:`);
    console.log(`         Formula: 1 + 2 × exp(-${formatNumber(result.weightage.hoursSinceLaunch / 24, 2)} / 2)`);
    console.log(`         Calculation: 1 + 2 × exp(-${formatNumber(result.weightage.hoursSinceLaunch / 24, 2)} / 2)`);
    console.log(`         Result: ${formatNumber(result.weightage.earlyBonus, 4)}`);
    console.log(`      `);
    console.log(`      Step 3 - Tenure Bonus:`);
    console.log(`         Formula: 1 + 0.6 × log2(${formatNumber(result.weightage.hoursHeld / 24, 2)} + 1)`);
    console.log(`         Calculation: 1 + 0.6 × log2(${formatNumber(result.weightage.hoursHeld / 24 + 1, 2)})`);
    console.log(`         Result: ${formatNumber(result.weightage.tenureBonus, 4)}`);
    console.log(`      `);
    console.log(`      Step 4 - Time Weight:`);
    console.log(`         Formula: early_bonus × tenure_bonus`);
    console.log(`         Calculation: ${formatNumber(result.weightage.earlyBonus, 4)} × ${formatNumber(result.weightage.tenureBonus, 4)}`);
    console.log(`         Result: ${formatNumber(result.weightage.timeWeight, 4)}`);
    console.log(`      `);
    console.log(`      Step 5 - Total Weight:`);
    console.log(`         Formula: balance_weight × time_weight`);
    console.log(`         Calculation: ${formatNumber(result.weightage.balanceWeight, 4)} × ${formatNumber(result.weightage.timeWeight, 4)}`);
    console.log(`         Final Weight: ${formatNumber(result.weightage.totalWeight, 4)}`);
    
    // Distribution Calculation
    console.log(`\n   💰 Distribution Calculation:`);
    console.log(`      Your Weight: ${formatNumber(result.weightage.totalWeight, 4)}`);
    console.log(`      Total Weights: ${formatNumber(stats.totalWeightage, 4)}`);
    console.log(`      Your Share: ${formatNumber(result.sharePercentage, 4)}%`);
    console.log(`      Available SOL: ${formatNumber(stats.totalDistributed, 6)} SOL`);
    console.log(`      Your Reward: ${formatNumber(result.amount, 6)} SOL`);
    console.log(`      `);
    console.log(`      Formula: (your_weight / total_weights) × total_rewards`);
    console.log(`      Calculation: (${formatNumber(result.weightage.totalWeight, 4)} / ${formatNumber(stats.totalWeightage, 4)}) × ${formatNumber(stats.totalDistributed, 6)}`);
    console.log(`      Result: ${formatNumber(result.amount, 6)} SOL`);
  });
  
  console.log('\n📈 Summary Statistics:');
  console.log(`   Total Holders: ${stats.totalHolders}`);
  console.log(`   Valid Holders: ${stats.validHolders}`);
  console.log(`   Total Tokens: ${formatLargeNumber(stats.totalTokens)}`);
  console.log(`   Total Distributed: ${formatNumber(stats.totalDistributed, 6)} SOL`);
  
  console.log('\n💰 Distribution Summary:');
  console.log('='.repeat(80));
  console.log('Wallet Address'.padEnd(30) + ' | ' + 'Percentage'.padStart(12) + ' | ' + 'SOL Received'.padStart(15));
  console.log('-'.repeat(80));
  
  // Sort by reward amount (highest first) for summary
  const sortedForSummary = [...distribution].sort((a, b) => b.amount - a.amount);
  
  sortedForSummary.forEach((result, index) => {
    console.log(
      result.address.substring(0, 29).padEnd(30) + ' | ' +
      `${formatNumber(result.sharePercentage, 2)}%`.padStart(12) + ' | ' +
      `${formatNumber(result.amount, 6)} SOL`.padStart(15)
    );
  });
  
  console.log('-'.repeat(80));
  
  console.log('\nPress Enter to return to main menu...');
  await askQuestion('');
}

// Clear all data
async function clearData() {
  const confirm = await askYesNo('Are you sure you want to clear all data?');
  
  if (confirm) {
    holders = [];
    global.distributionResults = null;
    global.distributionStats = null;
    console.log('\n✅ All data cleared!');
  }
}

// Main application loop
async function main() {
  console.log('🚀 Welcome to RewardFlow Distribution Algorithm Demo!');
  console.log('This interactive tool lets you test the fair distribution algorithm.');
  
  while (true) {
    displayMenu();
    
    const choice = await askQuestion('\nEnter your choice (1-6): ');
    
    switch (choice) {
      case '1':
        await configureSettings();
        break;
      case '2':
        await addHolder();
        break;
      case '3':
        await viewHolders();
        break;
      case '4':
        await runDistributionAndResults();
        break;
      case '5':
        await clearData();
        break;
      case '6':
        console.log('\n👋 Thanks for using RewardFlow Distribution Algorithm!');
        rl.close();
        return;
      default:
        console.log('\n❌ Invalid choice. Please enter 1-6.');
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Thanks for using RewardFlow Distribution Algorithm!');
  rl.close();
  process.exit(0);
});

// Start the application
main().catch(console.error);
