# DEX Workshop Challenge

Complete the following functions to enable DEX features. Work through them in order to see your changes progressively in the frontend.

## Order to Complete

### 1. `usePoolsFromRegistry()`
**File:** `src/hooks/usePoolsFromRegistry.ts`

**What it does:**
- Fetches all liquidity pools from the on-chain registry
- Uses Sui client to read dynamic fields from the registry table
- Returns array of `PoolData` objects with token info, reserves, fees

**Frontend change:** Pool list will appear in the Pools page

---

### 2. `calculateOutputAmount()`
**File:** `src/hooks/useSwapQuote.ts`

**What it does:**
- Implements AMM constant product formula
- Formula: `dy = y * dx * (1-fee) / (x + dx * (1-fee))`
- Calculates how many tokens you receive for tokens you input

**Frontend change:** Swap page will show output amount when you enter input

---

### 3. `calculatePriceImpact()`
**File:** `src/hooks/useSwapQuote.ts`

**What it does:**
- Compares spot price vs actual execution price
- Shows how much your trade moves the market price
- Returns percentage value

**Frontend change:** Price impact % appears on swap preview

---

### 4. `useSwapQuote()`
**File:** `src/hooks/useSwapQuote.ts`

**What it does:**
- Combines `calculateOutputAmount` and `calculatePriceImpact`
- Finds the correct pool for token pair
- Handles token decimal scaling
- Returns complete `SwapQuote` object

**Frontend change:** Complete swap preview works with all details

---

### 5. `useSwapRate()`
**File:** `src/hooks/useSwapQuote.ts`

**What it does:**
- Calculates exchange rate between two tokens
- Example output: "1 SUI = 2.5 USDC"
- Accounts for decimal differences between tokens

**Frontend change:** Exchange rate display works on swap page

---

## Tips

- Reference implementations are in **block comments** at the bottom of each file
- Look for `REFERENCE IMPLEMENTATION (uncomment if you get stuck)`
- Use `console.log` to debug - check browser DevTools console
- The Sui client is already available via `useSuiClient()` hook

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Good luck!
