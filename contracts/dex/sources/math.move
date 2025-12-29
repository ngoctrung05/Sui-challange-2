/// DEX Math Module - AMM calculations
/// Contains mathematical functions for constant product AMM
module dex::math;

// ===== Constants =====
/// Fee denominator (basis points: 10000 = 100%)
const FEE_DENOMINATOR: u64 = 10000;

// ===== Error Codes =====
const E_ZERO_AMOUNT: u64 = 0;
const E_RESERVES_EMPTY: u64 = 5;

// ===== Square Root Functions =====

/// Calculate square root using Newton's method (Babylonian method)
/// Used for initial LP token calculation: LP = sqrt(x * y)
public fun sqrt(x: u64): u64 {
    if (x == 0) return 0;

    let mut z = (x + 1) / 2;
    let mut y = x;

    while (z < y) {
        y = z;
        z = (x / z + z) / 2;
    };

    y
}

/// Calculate square root for u128 (for large intermediate values)
public fun sqrt_u128(x: u128): u128 {
    if (x == 0) return 0;

    let mut z = (x + 1) / 2;
    let mut y = x;

    while (z < y) {
        y = z;
        z = (x / z + z) / 2;
    };

    y
}

// ===== Utility Functions =====

/// Return the minimum of two values
public fun min(a: u64, b: u64): u64 {
    if (a < b) { a } else { b }
}

/// Return the maximum of two values
public fun max(a: u64, b: u64): u64 {
    if (a > b) { a } else { b }
}

// ===== AMM Calculation Functions =====

/// Calculate output amount for a swap using constant product formula with fees
///
/// Formula: dy = (dx * (FEE_DENOMINATOR - fee_bps) * y) / (x * FEE_DENOMINATOR + dx * (FEE_DENOMINATOR - fee_bps))
/// For 0.3% fee (30 bps): dy = (dx * 9970 * y) / (x * 10000 + dx * 9970)
public fun calculate_swap_output(
    amount_in: u64,
    reserve_in: u64,
    reserve_out: u64,
    fee_bps: u64,
): u64 {
    assert!(amount_in > 0, E_ZERO_AMOUNT);
    assert!(reserve_in > 0 && reserve_out > 0, E_RESERVES_EMPTY);

    // Use u128 to prevent overflow
    let amount_in_with_fee = (amount_in as u128) * ((FEE_DENOMINATOR - fee_bps) as u128);
    let numerator = amount_in_with_fee * (reserve_out as u128);
    let denominator = (reserve_in as u128) * (FEE_DENOMINATOR as u128) + amount_in_with_fee;

    ((numerator / denominator) as u64)
}

/// Calculate initial LP tokens using geometric mean
/// LP = sqrt(amount_x * amount_y)
public fun calculate_initial_lp(amount_x: u64, amount_y: u64): u64 {
    // Use u128 to prevent overflow during multiplication
    let product = (amount_x as u128) * (amount_y as u128);
    (sqrt_u128(product) as u64)
}

/// Calculate LP tokens for subsequent deposits
/// LP = min(dx/x, dy/y) * total_lp
/// Using: min((dx * total_lp) / x, (dy * total_lp) / y)
public fun calculate_subsequent_lp(
    amount_x: u64,
    amount_y: u64,
    reserve_x: u64,
    reserve_y: u64,
    lp_supply: u64,
): u64 {
    // Use u128 to prevent overflow
    let lp_from_x = ((amount_x as u128) * (lp_supply as u128) / (reserve_x as u128) as u64);
    let lp_from_y = ((amount_y as u128) * (lp_supply as u128) / (reserve_y as u128) as u64);

    min(lp_from_x, lp_from_y)
}

/// Calculate token amounts to return when removing liquidity
/// amount_out = (lp_burned / total_lp) * reserve
public fun calculate_remove_liquidity(
    lp_amount: u64,
    lp_supply: u64,
    reserve_x: u64,
    reserve_y: u64,
): (u64, u64) {
    // Use u128 to prevent overflow
    let amount_x = ((lp_amount as u128) * (reserve_x as u128) / (lp_supply as u128) as u64);
    let amount_y = ((lp_amount as u128) * (reserve_y as u128) / (lp_supply as u128) as u64);

    (amount_x, amount_y)
}

/// Get the fee denominator constant
public fun fee_denominator(): u64 {
    FEE_DENOMINATOR
}
