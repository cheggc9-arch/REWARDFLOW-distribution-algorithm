# RewardFlow Distribution Algorithm - Interactive Demo

An interactive, open-source tool to test the RewardFlow distribution algorithm with your own data. Add holders, configure settings, and see how the fair distribution algorithm works in real-time.

🌐 **Main Website:** [https://rewardflow.org/]

## 🚀 Quick Start

```bash
# Run the interactive demo
node demo.js
```

## 🎯 What This Does

This interactive tool lets you:
- **Add holders** with their token balance and purchase timing (hours-based system)
- **Configure settings** like minimum balance (default: 20,000 tokens), treasury amount, and hours since launch
- **View holders** in a clean, professional table format with perfect alignment
- **Run distribution** and see detailed step-by-step calculations for each holder
- **Test different scenarios** including holders below/above limits to see filtering in action
- **Prevent duplicates** - can't add the same wallet address twice

## 🧮 The Algorithm

**This uses the EXACT same formula as the main RewardFlow website!**

The RewardFlow algorithm uses a sophisticated multi-factor weighting system:

### 1. Balance Weight (Commitment)
```
balanceWeight = 1 + log10(tokens / minBalance)
```
- Rewards holders based on their token commitment
- Uses logarithmic scaling to prevent whale dominance

### 2. Earlyness Bonus (Timing)
```
earlyBonus = 1 + 2 * exp(-daysSinceLaunch / 2)
```
- Exponential decay rewards early adopters
- Maximum 3x multiplier for launch day buyers

### 3. Tenure Bonus (Loyalty)
```
tenureBonus = 1 + 0.6 * log2(daysHeld + 1)
```
- Logarithmic scaling rewards long-term holders
- Encourages diamond hands behavior

### 4. Total Weight
```
totalWeight = balanceWeight × earlyBonus × tenureBonus
```

**Source:** This formula is copied directly from `src/utils/cache.ts` in the main RewardFlow project.

## 📖 How to Use

1. **Run the script**: `node demo.js`
2. **Configure settings**: Set minimum balance (default: 20,000), treasury amount, hours since launch
3. **Add holders**: Enter wallet address, token balance, and hours after launch when first bought
4. **View holders**: See all holders in a clean table with qualification status
5. **Run distribution**: Get detailed step-by-step calculations and final results
6. **Analyze results**: See exact formulas, percentages, and SOL received for each holder

### 🎮 Menu Options

- **1. Configure Settings** - Set minimum/maximum balance, treasury, hours since launch
- **2. Add Holder** - Add wallet with token balance and purchase timing
- **3. View Holders** - See all holders in professional table format
- **4. Run Distribution & View Results** - Calculate and show detailed results
- **5. Clear All Data** - Reset everything for new test
- **6. Exit** - Close the application

## 🎬 Perfect for Demos

This tool is perfect for:
- **Community testing** - let people try their own data with hours-based system
- **Educational purposes** - understand the algorithm with transparent math

## 🔧 Files

- **`demo.js`** - Main interactive script
- **`formulas.js`** - Algorithm implementation
- **`README.md`** - This documentation

**Built for the Solana ecosystem with ❤️ by the RewardFlow team.**
