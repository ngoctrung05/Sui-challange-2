/// DEX Faucet Module - Test token minting for development
/// Allows users to mint test tokens with rate limiting
module dex::faucet;

use sui::coin::{Self, Coin, TreasuryCap};
use sui::table::{Self, Table};
use sui::clock::Clock;
use sui::event;

// ===== Error Codes =====
const E_COOLDOWN_NOT_ELAPSED: u64 = 200;
const E_FAUCET_EMPTY: u64 = 201;

// ===== Constants =====
/// Default cooldown period: 1 hour (in milliseconds)
const DEFAULT_COOLDOWN_MS: u64 = 3600000;
/// Default mint amount per request (in base units)
const DEFAULT_MINT_AMOUNT: u64 = 1000000000; // 1000 tokens with 6 decimals

// ===== Faucet Structures =====

/// Faucet holding a TreasuryCap for minting tokens
/// Each token type has its own Faucet object
public struct Faucet<phantom T> has key, store {
    id: UID,
    /// Treasury cap for minting tokens
    treasury_cap: TreasuryCap<T>,
    /// Amount to mint per request
    mint_amount: u64,
    /// Cooldown period in milliseconds
    cooldown_ms: u64,
    /// Last request timestamp per user
    last_request: Table<address, u64>,
    /// Whether the faucet is active
    is_active: bool,
}

/// Admin capability for faucet management
public struct FaucetAdminCap has key, store {
    id: UID,
}

// ===== Events =====

/// Emitted when tokens are minted from faucet
public struct FaucetMinted has copy, drop {
    recipient: address,
    amount: u64,
    timestamp: u64,
}

/// Emitted when faucet is created
public struct FaucetCreated has copy, drop {
    faucet_id: ID,
    mint_amount: u64,
    cooldown_ms: u64,
}

/// Emitted when faucet settings are updated
public struct FaucetUpdated has copy, drop {
    faucet_id: ID,
    mint_amount: u64,
    cooldown_ms: u64,
}

// ===== Faucet Creation =====

/// Create a new faucet with default settings
/// Returns FaucetAdminCap for management
public fun create_faucet<T>(
    treasury_cap: TreasuryCap<T>,
    ctx: &mut TxContext,
): (Faucet<T>, FaucetAdminCap) {
    create_faucet_with_config(
        treasury_cap,
        DEFAULT_MINT_AMOUNT,
        DEFAULT_COOLDOWN_MS,
        ctx,
    )
}

/// Create a new faucet with custom settings
public fun create_faucet_with_config<T>(
    treasury_cap: TreasuryCap<T>,
    mint_amount: u64,
    cooldown_ms: u64,
    ctx: &mut TxContext,
): (Faucet<T>, FaucetAdminCap) {
    let faucet = Faucet<T> {
        id: object::new(ctx),
        treasury_cap,
        mint_amount,
        cooldown_ms,
        last_request: table::new(ctx),
        is_active: true,
    };

    let admin_cap = FaucetAdminCap {
        id: object::new(ctx),
    };

    event::emit(FaucetCreated {
        faucet_id: object::id(&faucet),
        mint_amount,
        cooldown_ms,
    });

    (faucet, admin_cap)
}

/// Create faucet and share it
public fun create_faucet_and_share<T>(
    treasury_cap: TreasuryCap<T>,
    ctx: &mut TxContext,
) {
    let (faucet, admin_cap) = create_faucet(treasury_cap, ctx);
    transfer::share_object(faucet);
    transfer::transfer(admin_cap, ctx.sender());
}

/// Create faucet with config and share it
public fun create_faucet_with_config_and_share<T>(
    treasury_cap: TreasuryCap<T>,
    mint_amount: u64,
    cooldown_ms: u64,
    ctx: &mut TxContext,
) {
    let (faucet, admin_cap) = create_faucet_with_config(
        treasury_cap,
        mint_amount,
        cooldown_ms,
        ctx,
    );
    transfer::share_object(faucet);
    transfer::transfer(admin_cap, ctx.sender());
}

// ===== Minting Functions =====

/// Request tokens from the faucet
/// Enforces cooldown period between requests
public fun request_tokens<T>(
    faucet: &mut Faucet<T>,
    clock: &Clock,
    ctx: &mut TxContext,
): Coin<T> {
    assert!(faucet.is_active, E_FAUCET_EMPTY);

    let sender = ctx.sender();
    let current_time = clock.timestamp_ms();

    // Check cooldown
    if (table::contains(&faucet.last_request, sender)) {
        let last_time = *table::borrow(&faucet.last_request, sender);
        assert!(
            current_time >= last_time + faucet.cooldown_ms,
            E_COOLDOWN_NOT_ELAPSED,
        );
        // Update last request time
        *table::borrow_mut(&mut faucet.last_request, sender) = current_time;
    } else {
        // First request from this user
        table::add(&mut faucet.last_request, sender, current_time);
    };

    // Mint tokens
    let minted_coin = coin::mint(&mut faucet.treasury_cap, faucet.mint_amount, ctx);

    event::emit(FaucetMinted {
        recipient: sender,
        amount: faucet.mint_amount,
        timestamp: current_time,
    });

    minted_coin
}

/// Request tokens and transfer directly to sender
public entry fun request_tokens_entry<T>(
    faucet: &mut Faucet<T>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let coin = request_tokens(faucet, clock, ctx);
    transfer::public_transfer(coin, ctx.sender());
}

// ===== View Functions =====

/// Get faucet mint amount
public fun get_mint_amount<T>(faucet: &Faucet<T>): u64 {
    faucet.mint_amount
}

/// Get faucet cooldown period
public fun get_cooldown_ms<T>(faucet: &Faucet<T>): u64 {
    faucet.cooldown_ms
}

/// Check if faucet is active
public fun is_active<T>(faucet: &Faucet<T>): bool {
    faucet.is_active
}

/// Get time until next request is allowed (0 if ready)
public fun get_time_until_next_request<T>(
    faucet: &Faucet<T>,
    clock: &Clock,
    user: address,
): u64 {
    if (!table::contains(&faucet.last_request, user)) {
        return 0
    };

    let last_time = *table::borrow(&faucet.last_request, user);
    let current_time = clock.timestamp_ms();
    let next_allowed = last_time + faucet.cooldown_ms;

    if (current_time >= next_allowed) {
        0
    } else {
        next_allowed - current_time
    }
}

/// Check if user can request tokens now
public fun can_request<T>(
    faucet: &Faucet<T>,
    clock: &Clock,
    user: address,
): bool {
    if (!faucet.is_active) {
        return false
    };

    get_time_until_next_request(faucet, clock, user) == 0
}

// ===== Admin Functions =====

/// Update faucet mint amount
public fun set_mint_amount<T>(
    _admin_cap: &FaucetAdminCap,
    faucet: &mut Faucet<T>,
    new_amount: u64,
) {
    faucet.mint_amount = new_amount;

    event::emit(FaucetUpdated {
        faucet_id: object::id(faucet),
        mint_amount: new_amount,
        cooldown_ms: faucet.cooldown_ms,
    });
}

/// Update faucet cooldown period
public fun set_cooldown<T>(
    _admin_cap: &FaucetAdminCap,
    faucet: &mut Faucet<T>,
    new_cooldown_ms: u64,
) {
    faucet.cooldown_ms = new_cooldown_ms;

    event::emit(FaucetUpdated {
        faucet_id: object::id(faucet),
        mint_amount: faucet.mint_amount,
        cooldown_ms: new_cooldown_ms,
    });
}

/// Pause the faucet
public fun pause<T>(
    _admin_cap: &FaucetAdminCap,
    faucet: &mut Faucet<T>,
) {
    faucet.is_active = false;
}

/// Resume the faucet
public fun resume<T>(
    _admin_cap: &FaucetAdminCap,
    faucet: &mut Faucet<T>,
) {
    faucet.is_active = true;
}

// ===== Test-only Functions =====

#[test_only]
public fun destroy_faucet_for_testing<T>(faucet: Faucet<T>): TreasuryCap<T> {
    let Faucet {
        id,
        treasury_cap,
        mint_amount: _,
        cooldown_ms: _,
        last_request,
        is_active: _,
    } = faucet;

    object::delete(id);
    table::drop(last_request);

    treasury_cap
}

#[test_only]
public fun destroy_admin_cap_for_testing(cap: FaucetAdminCap) {
    let FaucetAdminCap { id } = cap;
    object::delete(id);
}
