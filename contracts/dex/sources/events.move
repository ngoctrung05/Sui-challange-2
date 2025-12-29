/// DEX Events Module - Emit swap/LP events
/// Contains all event definitions for the DEX
module dex::events;

use sui::event;

// ===== Event Structs =====

/// Emitted when a new pool is created
public struct PoolCreated has copy, drop {
    pool_id: ID,
    fee_bps: u64,
}

/// Emitted when liquidity is added
public struct LiquidityAdded has copy, drop {
    pool_id: ID,
    amount_x: u64,
    amount_y: u64,
    lp_minted: u64,
}

/// Emitted when liquidity is removed
public struct LiquidityRemoved has copy, drop {
    pool_id: ID,
    amount_x: u64,
    amount_y: u64,
    lp_burned: u64,
}

/// Emitted when a swap occurs
public struct Swapped has copy, drop {
    pool_id: ID,
    amount_in: u64,
    amount_out: u64,
    is_x_to_y: bool,
}

/// Emitted when pool fee is updated
public struct FeeUpdated has copy, drop {
    pool_id: ID,
    old_fee_bps: u64,
    new_fee_bps: u64,
}

// ===== Event Emission Functions =====

/// Emit pool created event
public fun emit_pool_created(pool_id: ID, fee_bps: u64) {
    event::emit(PoolCreated { pool_id, fee_bps });
}

/// Emit liquidity added event
public fun emit_liquidity_added(pool_id: ID, amount_x: u64, amount_y: u64, lp_minted: u64) {
    event::emit(LiquidityAdded {
        pool_id,
        amount_x,
        amount_y,
        lp_minted,
    });
}

/// Emit liquidity removed event
public fun emit_liquidity_removed(pool_id: ID, amount_x: u64, amount_y: u64, lp_burned: u64) {
    event::emit(LiquidityRemoved {
        pool_id,
        amount_x,
        amount_y,
        lp_burned,
    });
}

/// Emit swap event
public fun emit_swapped(pool_id: ID, amount_in: u64, amount_out: u64, is_x_to_y: bool) {
    event::emit(Swapped {
        pool_id,
        amount_in,
        amount_out,
        is_x_to_y,
    });
}

/// Emit fee updated event
public fun emit_fee_updated(pool_id: ID, old_fee_bps: u64, new_fee_bps: u64) {
    event::emit(FeeUpdated {
        pool_id,
        old_fee_bps,
        new_fee_bps,
    });
}
