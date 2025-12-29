/// DEX Liquidity Module - Add/remove liquidity
/// Contains functions for managing liquidity positions
module dex::liquidity;

use dex::events;
use dex::lp_token::LP;
use dex::math;
use dex::pool::{Self, Pool};
use sui::balance;
use sui::coin::{Self, Coin};

// ===== Error Codes =====
const E_ZERO_AMOUNT: u64 = 0;
const E_INSUFFICIENT_LIQUIDITY: u64 = 1;
const E_POOL_EMPTY: u64 = 4;

// ===== Constants =====
/// Minimum liquidity locked forever to prevent division by zero attacks
const MINIMUM_LIQUIDITY: u64 = 1000;

// ===== Add Liquidity =====

/// Add liquidity to the pool
/// Returns LP tokens representing the provider's share
///
/// For initial liquidity: LP = sqrt(amount_x * amount_y) - MINIMUM_LIQUIDITY
/// For subsequent: LP = min(dx/x, dy/y) * total_lp
public fun add_liquidity<X, Y>(
    pool: &mut Pool<X, Y>,
    coin_x: Coin<X>,
    coin_y: Coin<Y>,
    ctx: &mut TxContext,
): Coin<LP<X, Y>> {
    let amount_x = coin::value(&coin_x);
    let amount_y = coin::value(&coin_y);

    assert!(amount_x > 0 && amount_y > 0, E_ZERO_AMOUNT);

    let (reserve_x, reserve_y) = pool::get_reserves(pool);
    let lp_supply = pool::get_lp_supply(pool);

    let lp_amount = if (lp_supply == 0) {
        // Initial liquidity: geometric mean (sqrt(x * y))
        let initial_lp = math::calculate_initial_lp(amount_x, amount_y);

        // Lock minimum liquidity to prevent manipulation
        assert!(initial_lp > MINIMUM_LIQUIDITY, E_INSUFFICIENT_LIQUIDITY);

        // Burn MINIMUM_LIQUIDITY tokens (they stay in supply but are never owned)
        initial_lp - MINIMUM_LIQUIDITY
    } else {
        // Subsequent liquidity: proportional to existing reserves
        math::calculate_subsequent_lp(amount_x, amount_y, reserve_x, reserve_y, lp_supply)
    };

    assert!(lp_amount > 0, E_INSUFFICIENT_LIQUIDITY);

    // Add tokens to pool reserves
    balance::join(pool::borrow_balance_x_mut(pool), coin::into_balance(coin_x));
    balance::join(pool::borrow_balance_y_mut(pool), coin::into_balance(coin_y));

    // Mint LP tokens
    let lp_balance = balance::increase_supply(pool::borrow_lp_supply_mut(pool), lp_amount);

    events::emit_liquidity_added(
        pool::get_pool_id(pool),
        amount_x,
        amount_y,
        lp_amount,
    );

    coin::from_balance(lp_balance, ctx)
}

// ===== Remove Liquidity =====

/// Remove liquidity from the pool
/// Burns LP tokens and returns proportional amounts of both tokens
///
/// amount_x_out = (lp_burned / total_lp) * reserve_x
/// amount_y_out = (lp_burned / total_lp) * reserve_y
public fun remove_liquidity<X, Y>(
    pool: &mut Pool<X, Y>,
    lp_coin: Coin<LP<X, Y>>,
    ctx: &mut TxContext,
): (Coin<X>, Coin<Y>) {
    let lp_amount = coin::value(&lp_coin);
    assert!(lp_amount > 0, E_ZERO_AMOUNT);

    let (reserve_x, reserve_y) = pool::get_reserves(pool);
    let lp_supply = pool::get_lp_supply(pool);

    assert!(reserve_x > 0 && reserve_y > 0, E_POOL_EMPTY);

    // Calculate proportional amounts
    let (amount_x, amount_y) = math::calculate_remove_liquidity(
        lp_amount,
        lp_supply,
        reserve_x,
        reserve_y,
    );

    assert!(amount_x > 0 && amount_y > 0, E_INSUFFICIENT_LIQUIDITY);

    // Burn LP tokens
    balance::decrease_supply(pool::borrow_lp_supply_mut(pool), coin::into_balance(lp_coin));

    // Withdraw tokens from pool
    let coin_x = coin::from_balance(
        balance::split(pool::borrow_balance_x_mut(pool), amount_x),
        ctx,
    );
    let coin_y = coin::from_balance(
        balance::split(pool::borrow_balance_y_mut(pool), amount_y),
        ctx,
    );

    events::emit_liquidity_removed(
        pool::get_pool_id(pool),
        amount_x,
        amount_y,
        lp_amount,
    );

    (coin_x, coin_y)
}

/// Get minimum liquidity constant
public fun minimum_liquidity(): u64 {
    MINIMUM_LIQUIDITY
}
