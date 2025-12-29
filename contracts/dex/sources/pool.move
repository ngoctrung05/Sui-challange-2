/// DEX Pool Module - Pool creation & reserves
/// Contains Pool struct definition and pool management functions
module dex::pool;

use dex::events;
use dex::lp_token::{Self, LP};
use sui::balance::{Self, Supply, Balance};

// ===== Error Codes =====
const E_INVALID_FEE: u64 = 3;

// ===== Constants =====
/// Default fee: 30 basis points = 0.3%
const DEFAULT_FEE_BPS: u64 = 30;
/// Fee denominator (basis points: 10000 = 100%)
const FEE_DENOMINATOR: u64 = 10000;

// ===== Pool Structure =====

/// AMM Pool holding two token reserves
/// Uses phantom types for compile-time type safety
public struct Pool<phantom X, phantom Y> has key, store {
    id: UID,
    /// Reserve of token X
    balance_x: Balance<X>,
    /// Reserve of token Y
    balance_y: Balance<Y>,
    /// Supply of LP tokens for this pool
    lp_supply: Supply<LP<X, Y>>,
    /// Trading fee in basis points (e.g., 30 = 0.3%)
    fee_bps: u64,
}

// ===== Admin Capability =====

/// Admin capability for pool management
public struct AdminCap has key, store {
    id: UID,
}

// ===== Pool Creation =====

/// Create a new liquidity pool
/// Returns AdminCap for pool management
public fun create_pool<X, Y>(ctx: &mut TxContext): (Pool<X, Y>, AdminCap) {
    let pool = Pool<X, Y> {
        id: object::new(ctx),
        balance_x: balance::zero<X>(),
        balance_y: balance::zero<Y>(),
        lp_supply: lp_token::create_supply<X, Y>(),
        fee_bps: DEFAULT_FEE_BPS,
    };

    let admin_cap = AdminCap {
        id: object::new(ctx),
    };

    events::emit_pool_created(object::id(&pool), DEFAULT_FEE_BPS);

    (pool, admin_cap)
}

/// Create pool and share it
public fun create_pool_and_share<X, Y>(ctx: &mut TxContext) {
    let (pool, admin_cap) = create_pool<X, Y>(ctx);
    transfer::share_object(pool);
    transfer::transfer(admin_cap, ctx.sender());
}

// ===== Pool Accessors =====

/// Get pool reserves
public fun get_reserves<X, Y>(pool: &Pool<X, Y>): (u64, u64) {
    (balance::value(&pool.balance_x), balance::value(&pool.balance_y))
}

/// Get LP token supply
public fun get_lp_supply<X, Y>(pool: &Pool<X, Y>): u64 {
    balance::supply_value(&pool.lp_supply)
}

/// Get pool fee in basis points
public fun get_fee_bps<X, Y>(pool: &Pool<X, Y>): u64 {
    pool.fee_bps
}

/// Get pool ID
public fun get_pool_id<X, Y>(pool: &Pool<X, Y>): ID {
    object::id(pool)
}

/// Calculate the current price (Y per X)
public fun get_price_x_to_y<X, Y>(pool: &Pool<X, Y>): u64 {
    let reserve_x = balance::value(&pool.balance_x);
    let reserve_y = balance::value(&pool.balance_y);

    if (reserve_x == 0) return 0;

    reserve_y / reserve_x
}

/// Calculate the current price (X per Y)
public fun get_price_y_to_x<X, Y>(pool: &Pool<X, Y>): u64 {
    let reserve_x = balance::value(&pool.balance_x);
    let reserve_y = balance::value(&pool.balance_y);

    if (reserve_y == 0) return 0;

    reserve_x / reserve_y
}

// ===== Pool Mutators (Friend functions for liquidity/swap modules) =====

/// Get mutable reference to balance_x
public(package) fun borrow_balance_x_mut<X, Y>(pool: &mut Pool<X, Y>): &mut Balance<X> {
    &mut pool.balance_x
}

/// Get mutable reference to balance_y
public(package) fun borrow_balance_y_mut<X, Y>(pool: &mut Pool<X, Y>): &mut Balance<Y> {
    &mut pool.balance_y
}

/// Get mutable reference to lp_supply
public(package) fun borrow_lp_supply_mut<X, Y>(pool: &mut Pool<X, Y>): &mut Supply<LP<X, Y>> {
    &mut pool.lp_supply
}

/// Get immutable reference to balance_x
public fun borrow_balance_x<X, Y>(pool: &Pool<X, Y>): &Balance<X> {
    &pool.balance_x
}

/// Get immutable reference to balance_y
public fun borrow_balance_y<X, Y>(pool: &Pool<X, Y>): &Balance<Y> {
    &pool.balance_y
}

// ===== Admin Functions =====

/// Update the pool fee (only admin)
public fun set_fee<X, Y>(_admin_cap: &AdminCap, pool: &mut Pool<X, Y>, new_fee_bps: u64) {
    assert!(new_fee_bps < FEE_DENOMINATOR, E_INVALID_FEE);
    let old_fee = pool.fee_bps;
    pool.fee_bps = new_fee_bps;
    events::emit_fee_updated(object::id(pool), old_fee, new_fee_bps);
}

// ===== Test-only Functions =====
#[test_only]
use std::unit_test;

#[test_only]
public fun destroy_pool_for_testing<X, Y>(pool: Pool<X, Y>) {
    let Pool { id, balance_x, balance_y, lp_supply, fee_bps: _ } = pool;
    object::delete(id);
    balance::destroy_for_testing(balance_x);
    balance::destroy_for_testing(balance_y);
    unit_test::destroy(lp_supply);
}

#[test_only]
public fun destroy_admin_cap_for_testing(cap: AdminCap) {
    let AdminCap { id } = cap;
    object::delete(id);
}
