/// DEX LP Token Module - LP token mint/burn
/// Contains LP token type definition and supply management
module dex::lp_token;

use sui::balance::{Self, Supply, Balance};
use sui::coin::{Self, Coin};

// ===== LP Token Type =====

/// LP Token representing liquidity provider shares
/// Phantom types ensure type safety for different pool pairs
public struct LP<phantom X, phantom Y> has drop {}

// ===== Supply Management =====

/// Create a new LP token supply
public fun create_supply<X, Y>(): Supply<LP<X, Y>> {
    balance::create_supply(LP<X, Y> {})
}

/// Mint LP tokens by increasing supply
public fun mint<X, Y>(
    supply: &mut Supply<LP<X, Y>>,
    amount: u64,
    ctx: &mut TxContext,
): Coin<LP<X, Y>> {
    let lp_balance = balance::increase_supply(supply, amount);
    coin::from_balance(lp_balance, ctx)
}

/// Burn LP tokens by decreasing supply
public fun burn<X, Y>(supply: &mut Supply<LP<X, Y>>, lp_coin: Coin<LP<X, Y>>): u64 {
    let lp_balance = coin::into_balance(lp_coin);
    let amount = balance::value(&lp_balance);
    balance::decrease_supply(supply, lp_balance);
    amount
}

/// Get the total supply of LP tokens
public fun total_supply<X, Y>(supply: &Supply<LP<X, Y>>): u64 {
    balance::supply_value(supply)
}

/// Get the value of an LP coin
public fun value<X, Y>(lp_coin: &Coin<LP<X, Y>>): u64 {
    coin::value(lp_coin)
}

/// Join two LP balances
public fun join<X, Y>(self: &mut Balance<LP<X, Y>>, other: Balance<LP<X, Y>>) {
    balance::join(self, other);
}

/// Split LP balance
public fun split<X, Y>(self: &mut Balance<LP<X, Y>>, amount: u64): Balance<LP<X, Y>> {
    balance::split(self, amount)
}

// ===== Test-only Functions =====
#[test_only]
use std::unit_test;

#[test_only]
public fun destroy_supply_for_testing<X, Y>(supply: Supply<LP<X, Y>>) {
    unit_test::destroy(supply);
}
