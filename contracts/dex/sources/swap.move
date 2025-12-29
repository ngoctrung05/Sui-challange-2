/// DEX Swap Module - Token swap logic
/// Contains functions for swapping tokens using constant product formula
module dex::swap;

use dex::events;
use dex::math;
use dex::pool::{Self, Pool};
use sui::balance;
use sui::coin::{Self, Coin};

// ===== Error Codes =====
const E_ZERO_AMOUNT: u64 = 0;
const E_SLIPPAGE_EXCEEDED: u64 = 2;

// ===== Swap Functions =====

/// Swap token X for token Y
/// Uses constant product formula: x * y = k
/// Includes slippage protection with min_out parameter
public fun swap_x_to_y<X, Y>(
    pool: &mut Pool<X, Y>,
    coin_in: Coin<X>,
    min_out: u64,
    ctx: &mut TxContext,
): Coin<Y> {
    let amount_in = coin::value(&coin_in);
    assert!(amount_in > 0, E_ZERO_AMOUNT);

    let (reserve_x, reserve_y) = pool::get_reserves(pool);
    let fee_bps = pool::get_fee_bps(pool);

    // Calculate output with fee
    let amount_out = math::calculate_swap_output(
        amount_in,
        reserve_x,
        reserve_y,
        fee_bps,
    );

    // Slippage protection
    assert!(amount_out >= min_out, E_SLIPPAGE_EXCEEDED);

    // Add input to pool
    balance::join(pool::borrow_balance_x_mut(pool), coin::into_balance(coin_in));

    // Remove output from pool
    let coin_out = coin::from_balance(
        balance::split(pool::borrow_balance_y_mut(pool), amount_out),
        ctx,
    );

    events::emit_swapped(
        pool::get_pool_id(pool),
        amount_in,
        amount_out,
        true, // is_x_to_y
    );

    coin_out
}

/// Swap token Y for token X
public fun swap_y_to_x<X, Y>(
    pool: &mut Pool<X, Y>,
    coin_in: Coin<Y>,
    min_out: u64,
    ctx: &mut TxContext,
): Coin<X> {
    let amount_in = coin::value(&coin_in);
    assert!(amount_in > 0, E_ZERO_AMOUNT);

    let (reserve_x, reserve_y) = pool::get_reserves(pool);
    let fee_bps = pool::get_fee_bps(pool);

    // Calculate output with fee
    let amount_out = math::calculate_swap_output(
        amount_in,
        reserve_y,
        reserve_x,
        fee_bps,
    );

    // Slippage protection
    assert!(amount_out >= min_out, E_SLIPPAGE_EXCEEDED);

    // Add input to pool
    balance::join(pool::borrow_balance_y_mut(pool), coin::into_balance(coin_in));

    // Remove output from pool
    let coin_out = coin::from_balance(
        balance::split(pool::borrow_balance_x_mut(pool), amount_out),
        ctx,
    );

    events::emit_swapped(
        pool::get_pool_id(pool),
        amount_in,
        amount_out,
        false, // is_x_to_y
    );

    coin_out
}

// ===== Quote Functions =====

/// Get a quote for swapping X to Y (view function, no state change)
public fun quote_x_to_y<X, Y>(pool: &Pool<X, Y>, amount_in: u64): u64 {
    let (reserve_x, reserve_y) = pool::get_reserves(pool);
    let fee_bps = pool::get_fee_bps(pool);

    math::calculate_swap_output(amount_in, reserve_x, reserve_y, fee_bps)
}

/// Get a quote for swapping Y to X (view function, no state change)
public fun quote_y_to_x<X, Y>(pool: &Pool<X, Y>, amount_in: u64): u64 {
    let (reserve_x, reserve_y) = pool::get_reserves(pool);
    let fee_bps = pool::get_fee_bps(pool);

    math::calculate_swap_output(amount_in, reserve_y, reserve_x, fee_bps)
}
