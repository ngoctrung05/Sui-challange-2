/// Mock ETH Token - Ethereum for testing
/// Follows Sui Currency Standard with faucet support
module dex::eth;

use sui::coin_registry;
use dex::faucet;

// ===== Constants =====
const DECIMALS: u8 = 8;
const SYMBOL: vector<u8> = b"ETH";
const NAME: vector<u8> = b"Ethereum";
const DESCRIPTION: vector<u8> = b"Mock ETH token for DEX testing";
const ICON_URL: vector<u8> = b"https://assets.coingecko.com/coins/images/279/small/ethereum.png";

/// Faucet mint amount: 1 ETH (with 8 decimals)
const FAUCET_MINT_AMOUNT: u64 = 100_000_000;
/// Faucet cooldown: 1 hour
const FAUCET_COOLDOWN_MS: u64 = 3_600_000;

// ===== One-Time Witness =====
public struct ETH has drop {}

// ===== Module Initialization =====
fun init(witness: ETH, ctx: &mut TxContext) {
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
    init(ETH {}, ctx);
}
