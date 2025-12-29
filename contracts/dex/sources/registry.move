/// DEX Registry Module - Centralized pool lookup & management
/// Prevents duplicate pools and enables on-chain pool discovery
module dex::registry;

use sui::table::{Self, Table};
use std::type_name::{Self, TypeName};
use std::ascii;

// ===== Error Codes =====
const E_POOL_ALREADY_EXISTS: u64 = 100;
const E_POOL_NOT_FOUND: u64 = 101;

// ===== Registry Structure =====

/// Centralized registry holding all pool information
/// Uses TypeName pairs as keys to prevent duplicate pools
public struct Registry has key {
    id: UID,
    /// Maps token pair type names to pool IDs
    /// Key: (TypeName of X, TypeName of Y) sorted alphabetically
    pools: Table<PoolKey, PoolInfo>,
    /// Total number of pools registered
    pool_count: u64,
}

/// Key for pool lookup - sorted pair of type names
public struct PoolKey has copy, drop, store {
    type_x: TypeName,
    type_y: TypeName,
}

/// Information about a registered pool
public struct PoolInfo has copy, drop, store {
    /// Pool object ID
    pool_id: ID,
    /// Creation timestamp
    created_at: u64,
    /// Whether the pool is active
    is_active: bool,
}

// ===== Registry Creation =====

/// Create and share the registry (called once at package publish)
fun init(ctx: &mut TxContext) {
    let registry = Registry {
        id: object::new(ctx),
        pools: table::new(ctx),
        pool_count: 0,
    };
    transfer::share_object(registry);
}

// ===== Pool Registration =====

/// Register a new pool in the registry
/// Aborts if a pool for this token pair already exists
public fun register_pool<X, Y>(
    registry: &mut Registry,
    pool_id: ID,
    ctx: &TxContext,
) {
    let key = create_pool_key<X, Y>();

    assert!(!table::contains(&registry.pools, key), E_POOL_ALREADY_EXISTS);

    let info = PoolInfo {
        pool_id,
        created_at: ctx.epoch(),
        is_active: true,
    };

    table::add(&mut registry.pools, key, info);
    registry.pool_count = registry.pool_count + 1;
}

// ===== Pool Lookup =====

/// Check if a pool exists for the given token pair
public fun pool_exists<X, Y>(registry: &Registry): bool {
    let key = create_pool_key<X, Y>();
    table::contains(&registry.pools, key)
}

/// Get pool ID for a token pair
/// Aborts if pool doesn't exist
public fun get_pool_id<X, Y>(registry: &Registry): ID {
    let key = create_pool_key<X, Y>();
    assert!(table::contains(&registry.pools, key), E_POOL_NOT_FOUND);
    table::borrow(&registry.pools, key).pool_id
}

/// Get full pool info for a token pair
public fun get_pool_info<X, Y>(registry: &Registry): PoolInfo {
    let key = create_pool_key<X, Y>();
    assert!(table::contains(&registry.pools, key), E_POOL_NOT_FOUND);
    *table::borrow(&registry.pools, key)
}

/// Get total number of registered pools
public fun get_pool_count(registry: &Registry): u64 {
    registry.pool_count
}

// ===== Helper Functions =====

/// Create a sorted pool key from type names
/// Ensures X-Y and Y-X lookups return the same pool
fun create_pool_key<X, Y>(): PoolKey {
    let type_x = type_name::with_original_ids<X>();
    let type_y = type_name::with_original_ids<Y>();

    let str_x = type_name::into_string(type_x);
    let str_y = type_name::into_string(type_y);

    // Sort alphabetically to ensure consistent ordering
    // Compare byte arrays to determine ordering
    if (is_less_than(ascii::as_bytes(&str_x), ascii::as_bytes(&str_y))) {
        PoolKey { type_x, type_y }
    } else {
        PoolKey { type_x: type_y, type_y: type_x }
    }
}

/// Compare two byte vectors lexicographically
fun is_less_than(a: &vector<u8>, b: &vector<u8>): bool {
    let len_a = vector::length(a);
    let len_b = vector::length(b);
    let min_len = if (len_a < len_b) { len_a } else { len_b };

    let mut i = 0;
    while (i < min_len) {
        let byte_a = *vector::borrow(a, i);
        let byte_b = *vector::borrow(b, i);
        if (byte_a < byte_b) {
            return true
        };
        if (byte_a > byte_b) {
            return false
        };
        i = i + 1;
    };

    // If all compared bytes are equal, shorter string is "less"
    len_a < len_b
}

// ===== Admin Functions =====

/// Deactivate a pool (for emergency situations)
public fun deactivate_pool<X, Y>(
    registry: &mut Registry,
    _ctx: &TxContext,
) {
    let key = create_pool_key<X, Y>();
    assert!(table::contains(&registry.pools, key), E_POOL_NOT_FOUND);
    let info = table::borrow_mut(&mut registry.pools, key);
    info.is_active = false;
}

/// Reactivate a pool
public fun activate_pool<X, Y>(
    registry: &mut Registry,
    _ctx: &TxContext,
) {
    let key = create_pool_key<X, Y>();
    assert!(table::contains(&registry.pools, key), E_POOL_NOT_FOUND);
    let info = table::borrow_mut(&mut registry.pools, key);
    info.is_active = true;
}

// ===== Test-only Functions =====

#[test_only]
public fun create_registry_for_testing(ctx: &mut TxContext): Registry {
    Registry {
        id: object::new(ctx),
        pools: table::new(ctx),
        pool_count: 0,
    }
}

#[test_only]
public fun destroy_registry_for_testing(registry: Registry) {
    let Registry { id, pools, pool_count: _ } = registry;
    object::delete(id);
    table::drop(pools);
}
