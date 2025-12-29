/// Mock SOL Token - Solana for testing
/// Follows Sui Currency Standard with faucet support
module dex::sol;

use sui::coin_registry;
use dex::faucet;

// ===== Constants =====
const DECIMALS: u8 = 9;
const SYMBOL: vector<u8> = b"SOL";
const NAME: vector<u8> = b"Solana";
const DESCRIPTION: vector<u8> = b"Mock SOL token for DEX testing";
const ICON_URL: vector<u8> = b"https://assets.coingecko.com/coins/images/4128/small/solana.png";

/// Faucet mint amount: 10 SOL (with 9 decimals)
const FAUCET_MINT_AMOUNT: u64 = 10_000_000_000;
/// Faucet cooldown: 1 hour
const FAUCET_COOLDOWN_MS: u64 = 3_600_000;

// ===== One-Time Witness =====
public struct SOL has drop {}

// ===== Module Initialization =====
fun init(witness: SOL, ctx: &mut TxContext) {
    let (currency, treasury_cap) = coin_registry::new_currency_with_otw(
        witness,
        DECIMALS,
        SYMBOL.to_string(),
        NAME.to_string(),
        DESCRIPTION.to_string(),
        ICON_URL.to_string(),
        ctx,
    );

    // Finalize the currency (no regulation needed for mock token)
    let metadata_cap = currency.finalize(ctx);

    // Create faucet with treasury cap
    let (faucet, faucet_admin_cap) = faucet::create_faucet_with_config(
        treasury_cap,
        FAUCET_MINT_AMOUNT,
        FAUCET_COOLDOWN_MS,
        ctx,
    );

    // Share faucet and transfer caps to deployer
    transfer::public_share_object(faucet);
    transfer::public_transfer(metadata_cap, ctx.sender());
    transfer::public_transfer(faucet_admin_cap, ctx.sender());
}

// ===== Test Helpers =====
#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(SOL {}, ctx);
}
