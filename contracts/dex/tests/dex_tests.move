/// ============================================================================
/// DEX AMM Test Suite
/// ============================================================================
///
/// This test module validates the DEX AMM implementation based on:
/// - Constant Product Formula: x * y = k
/// - Uniswap V2 style AMM mechanics
///
/// WORKSHOP EXERCISE:
/// ------------------
/// The `dex::math` module has been left for you to implement!
/// Your task is to implement the following functions in `sources/math.move`:
///
/// 1. sqrt(x: u64): u64
///    - Calculate integer square root using Newton's method
///    - Used for initial LP calculation: LP = sqrt(x * y)
///
/// 2. sqrt_u128(x: u128): u128
///    - Same as sqrt but for u128 (handles large values)
///
/// 3. min(a: u64, b: u64): u64
///    - Return the smaller of two values
///
/// 4. calculate_swap_output(amount_in, reserve_in, reserve_out, fee_bps): u64
///    - Calculate output amount using constant product formula with fees
///    - Formula: dy = (dx * (10000 - fee) * y) / (x * 10000 + dx * (10000 - fee))
///
/// 5. calculate_initial_lp(amount_x, amount_y): u64
///    - Calculate LP tokens for first deposit: sqrt(x * y)
///
/// 6. calculate_subsequent_lp(amount_x, amount_y, reserve_x, reserve_y, lp_supply): u64
///    - Calculate LP tokens for subsequent deposits: min(dx/x, dy/y) * total_lp
///
/// 7. calculate_remove_liquidity(lp_amount, lp_supply, reserve_x, reserve_y): (u64, u64)
///    - Calculate tokens to return: (lp/total * reserve_x, lp/total * reserve_y)
///
/// Run tests with: sui move test --skip-fetch-latest-git-deps
/// ============================================================================

#[test_only]
module dex::dex_tests {
    use sui::coin::{Self, Coin};
    use sui::test_scenario::{Self as ts, Scenario};
    use dex::pool::{Self, Pool, AdminCap};
    use dex::lp_token::LP;
    use dex::liquidity;
    use dex::swap;
    use dex::math;

    // =========================================================================
    // TEST COINS - Simulated tokens for testing
    // =========================================================================

    /// Test coin representing SUI (native token)
    public struct SUI has drop {}

    /// Test coin representing USDC (stablecoin)
    public struct USDC has drop {}

    /// Test coin representing USDT (another stablecoin for multi-hop tests)
    public struct USDT has drop {}

    // =========================================================================
    // TEST CONSTANTS
    // =========================================================================

    /// Admin address for pool creation
    const ADMIN: address = @0xAD;

    /// User 1 - Primary liquidity provider
    const USER1: address = @0x1;

    /// User 2 - Trader/secondary LP
    const USER2: address = @0x2;

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================

    /// Create a test coin with specified amount
    /// @param amount - Amount of tokens to mint
    /// @param ctx - Transaction context
    /// @return Coin<T> - Minted test coin
    fun mint_coin<T: drop>(amount: u64, ctx: &mut TxContext): Coin<T> {
        coin::mint_for_testing<T>(amount, ctx)
    }

    /// Setup a pool with initial liquidity
    /// This helper creates a SUI-USDC pool and adds initial liquidity
    ///
    /// @param scenario - Test scenario
    /// @param sui_amount - Amount of SUI to deposit
    /// @param usdc_amount - Amount of USDC to deposit
    fun setup_pool_with_liquidity(
        scenario: &mut Scenario,
        sui_amount: u64,
        usdc_amount: u64
    ) {
        // Step 1: Admin creates the pool
        ts::next_tx(scenario, ADMIN);
        {
            let ctx = ts::ctx(scenario);
            let (pool, admin_cap) = pool::create_pool<SUI, USDC>(ctx);
            transfer::public_share_object(pool);  // Make pool accessible to everyone
            transfer::public_transfer(admin_cap, ADMIN);  // Admin keeps the cap
        };

        // Step 2: USER1 adds initial liquidity
        ts::next_tx(scenario, USER1);
        {
            let mut pool = ts::take_shared<Pool<SUI, USDC>>(scenario);
            let ctx = ts::ctx(scenario);

            let sui_coin = mint_coin<SUI>(sui_amount, ctx);
            let usdc_coin = mint_coin<USDC>(usdc_amount, ctx);

            // Add liquidity and receive LP tokens
            let lp_coin = liquidity::add_liquidity(&mut pool, sui_coin, usdc_coin, ctx);
            transfer::public_transfer(lp_coin, USER1);

            ts::return_shared(pool);
        };
    }

    // =========================================================================
    // MATH FUNCTION TESTS
    // These tests validate your math implementation
    // =========================================================================

    /// Test: Square Root Function
    ///
    /// YOUR IMPLEMENTATION MUST:
    /// - Return 0 for sqrt(0)
    /// - Return correct values for perfect squares (4, 9, 16, 100, etc.)
    /// - Round DOWN for non-perfect squares (sqrt(5) = 2, not 3)
    ///
    /// Algorithm hint: Use Newton's method (Babylonian method)
    /// z = x
    /// y = (x + 1) / 2
    /// while y < z:
    ///     z = y
    ///     y = (x/y + y) / 2
    /// return z
    #[test]
    fun test_sqrt() {
        // Perfect squares
        assert!(math::sqrt(0) == 0, 0);
        assert!(math::sqrt(1) == 1, 1);
        assert!(math::sqrt(4) == 2, 2);
        assert!(math::sqrt(9) == 3, 3);
        assert!(math::sqrt(16) == 4, 4);
        assert!(math::sqrt(100) == 10, 5);
        assert!(math::sqrt(10000) == 100, 6);
        assert!(math::sqrt(1000000) == 1000, 7);

        // Non-perfect squares - should round DOWN
        assert!(math::sqrt(2) == 1, 8);   // sqrt(2) ≈ 1.41 → 1
        assert!(math::sqrt(3) == 1, 9);   // sqrt(3) ≈ 1.73 → 1
        assert!(math::sqrt(5) == 2, 10);  // sqrt(5) ≈ 2.23 → 2
        assert!(math::sqrt(8) == 2, 11);  // sqrt(8) ≈ 2.83 → 2
        assert!(math::sqrt(99) == 9, 12); // sqrt(99) ≈ 9.95 → 9
    }

    /// Test: Minimum Function
    ///
    /// Simple: return the smaller of two values
    #[test]
    fun test_min() {
        assert!(math::min(0, 0) == 0, 0);
        assert!(math::min(1, 2) == 1, 1);
        assert!(math::min(2, 1) == 1, 2);
        assert!(math::min(100, 100) == 100, 3);
        assert!(math::min(0, 1000) == 0, 4);
    }

    // =========================================================================
    // POOL CREATION TESTS
    // =========================================================================

    /// Test: Pool Creation
    ///
    /// Verifies that a new pool starts with:
    /// - Zero reserves for both tokens
    /// - Zero LP token supply
    /// - Default fee of 30 basis points (0.3%)
    #[test]
    fun test_create_pool() {
        let mut scenario = ts::begin(ADMIN);
        {
            let ctx = ts::ctx(&mut scenario);
            let (pool, admin_cap) = pool::create_pool<SUI, USDC>(ctx);

            // Verify initial state
            let (reserve_x, reserve_y) = pool::get_reserves(&pool);
            assert!(reserve_x == 0, 0);  // No SUI yet
            assert!(reserve_y == 0, 1);  // No USDC yet
            assert!(pool::get_lp_supply(&pool) == 0, 2);  // No LP tokens yet
            assert!(pool::get_fee_bps(&pool) == 30, 3);   // 0.3% fee

            pool::destroy_pool_for_testing(pool);
            pool::destroy_admin_cap_for_testing(admin_cap);
        };
        ts::end(scenario);
    }

    // =========================================================================
    // ADD LIQUIDITY TESTS
    // =========================================================================

    /// Test: Initial Liquidity (First Depositor)
    ///
    /// For the FIRST deposit, LP tokens are calculated as:
    ///   LP = sqrt(amount_x * amount_y) - MINIMUM_LIQUIDITY
    ///
    /// The MINIMUM_LIQUIDITY (1000) is permanently locked to prevent
    /// division-by-zero attacks and price manipulation.
    ///
    /// Example:
    ///   100 SUI (100_000_000 units) + 200,000 USDC (200_000_000_000 units)
    ///   LP = sqrt(100_000_000 * 200_000_000_000) - 1000
    ///   LP = sqrt(20_000_000_000_000_000_000) - 1000
    ///   LP ≈ 4,472,135,954 - 1000
    #[test]
    fun test_add_initial_liquidity() {
        let mut scenario = ts::begin(ADMIN);

        // Admin creates the pool
        {
            let ctx = ts::ctx(&mut scenario);
            let (pool, admin_cap) = pool::create_pool<SUI, USDC>(ctx);
            transfer::public_share_object(pool);
            transfer::public_transfer(admin_cap, ADMIN);
        };

        // USER1 adds initial liquidity
        ts::next_tx(&mut scenario, USER1);
        {
            let mut pool = ts::take_shared<Pool<SUI, USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);

            // Deposit: 100 SUI + 200,000 USDC
            // Using 8 decimals for SUI, 6 decimals for USDC (realistic)
            let sui_coin = mint_coin<SUI>(100_000_000, ctx);      // 100 SUI
            let usdc_coin = mint_coin<USDC>(200_000_000_000, ctx); // 200,000 USDC

            let lp_coin = liquidity::add_liquidity(&mut pool, sui_coin, usdc_coin, ctx);

            // Verify LP tokens were minted
            let lp_amount = coin::value(&lp_coin);
            assert!(lp_amount > 0, 0);

            // Verify reserves match deposits
            let (reserve_x, reserve_y) = pool::get_reserves(&pool);
            assert!(reserve_x == 100_000_000, 1);
            assert!(reserve_y == 200_000_000_000, 2);

            transfer::public_transfer(lp_coin, USER1);
            ts::return_shared(pool);
        };

        ts::end(scenario);
    }

    /// Test: Subsequent Liquidity (Adding to Existing Pool)
    ///
    /// For subsequent deposits, LP tokens are calculated as:
    ///   LP = min(dx/x, dy/y) * total_lp_supply
    ///
    /// This ensures:
    /// - Price ratio is preserved
    /// - No arbitrage opportunity for new LPs
    /// - Fair distribution of LP tokens
    #[test]
    fun test_add_subsequent_liquidity() {
        let mut scenario = ts::begin(ADMIN);

        // Setup: Pool with 100 SUI / 200,000 USDC
        setup_pool_with_liquidity(&mut scenario, 100_000_000, 200_000_000_000);

        // USER2 adds 10% more liquidity (maintaining ratio)
        ts::next_tx(&mut scenario, USER2);
        {
            let mut pool = ts::take_shared<Pool<SUI, USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);

            let initial_lp_supply = pool::get_lp_supply(&pool);

            // Add 10 SUI + 20,000 USDC (same 1:2000 ratio)
            let sui_coin = mint_coin<SUI>(10_000_000, ctx);
            let usdc_coin = mint_coin<USDC>(20_000_000_000, ctx);

            let lp_coin = liquidity::add_liquidity(&mut pool, sui_coin, usdc_coin, ctx);
            let lp_amount = coin::value(&lp_coin);

            // Should receive ~10% of existing LP supply
            assert!(lp_amount > 0, 0);

            // Verify reserves increased correctly
            let (reserve_x, reserve_y) = pool::get_reserves(&pool);
            assert!(reserve_x == 110_000_000, 1);      // 100 + 10 SUI
            assert!(reserve_y == 220_000_000_000, 2);  // 200k + 20k USDC

            // Verify LP supply increased
            assert!(pool::get_lp_supply(&pool) > initial_lp_supply, 3);

            transfer::public_transfer(lp_coin, USER2);
            ts::return_shared(pool);
        };

        ts::end(scenario);
    }

    // =========================================================================
    // REMOVE LIQUIDITY TESTS
    // =========================================================================

    /// Test: Remove Liquidity
    ///
    /// When burning LP tokens, you receive proportional amounts:
    ///   amount_x_out = (lp_burned / total_lp) * reserve_x
    ///   amount_y_out = (lp_burned / total_lp) * reserve_y
    ///
    /// This is fair because LP tokens represent ownership percentage.
    #[test]
    fun test_remove_liquidity() {
        let mut scenario = ts::begin(ADMIN);

        // Setup pool with initial liquidity
        setup_pool_with_liquidity(&mut scenario, 100_000_000, 200_000_000_000);

        // USER1 removes their liquidity
        ts::next_tx(&mut scenario, USER1);
        {
            let mut pool = ts::take_shared<Pool<SUI, USDC>>(&scenario);
            let lp_coin = ts::take_from_sender<Coin<LP<SUI, USDC>>>(&scenario);
            let ctx = ts::ctx(&mut scenario);

            let _initial_lp_amount = coin::value(&lp_coin);
            let (initial_reserve_x, initial_reserve_y) = pool::get_reserves(&pool);

            // Burn all LP tokens
            let (sui_out, usdc_out) = liquidity::remove_liquidity(&mut pool, lp_coin, ctx);

            // Verify tokens received
            let sui_amount = coin::value(&sui_out);
            let usdc_amount = coin::value(&usdc_out);

            assert!(sui_amount > 0, 0);
            assert!(usdc_amount > 0, 1);

            // Verify reserves decreased
            let (reserve_x, reserve_y) = pool::get_reserves(&pool);
            assert!(reserve_x < initial_reserve_x, 2);
            assert!(reserve_y < initial_reserve_y, 3);

            coin::burn_for_testing(sui_out);
            coin::burn_for_testing(usdc_out);

            ts::return_shared(pool);
        };

        ts::end(scenario);
    }

    // =========================================================================
    // SWAP TESTS - Core AMM Functionality
    // =========================================================================

    /// Test: Swap X to Y (SUI → USDC)
    ///
    /// Uses constant product formula with 0.3% fee:
    ///   dy = (dx * 997 * y) / (x * 1000 + dx * 997)
    ///
    /// Example: Pool 100 SUI / 200,000 USDC, swap 10 SUI
    ///   dy = (10 * 997 * 200,000) / (100 * 1000 + 10 * 997)
    ///   dy = 1,994,000,000 / 10,997
    ///   dy ≈ 18,131 USDC
    ///
    /// Note: This is LESS than naive (10/100 * 200,000 = 20,000) due to:
    /// 1. Price impact (constant product curve)
    /// 2. Trading fee (0.3%)
    #[test]
    fun test_swap_x_to_y() {
        let mut scenario = ts::begin(ADMIN);

        // Setup: Pool with 100 SUI / 200,000 USDC
        setup_pool_with_liquidity(&mut scenario, 100_000_000, 200_000_000_000);

        // USER2 swaps 10 SUI for USDC
        ts::next_tx(&mut scenario, USER2);
        {
            let mut pool = ts::take_shared<Pool<SUI, USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);

            let sui_in = mint_coin<SUI>(10_000_000, ctx);  // 10 SUI

            // min_out = 18B (slippage protection)
            let usdc_out = swap::swap_x_to_y(&mut pool, sui_in, 18_000_000_000, ctx);
            let usdc_amount = coin::value(&usdc_out);

            // Should get ~18,xxx USDC (not 20,000 due to price impact + fee)
            assert!(usdc_amount > 18_000_000_000, 0);
            assert!(usdc_amount < 20_000_000_000, 1);

            // Verify reserves updated
            let (reserve_x, reserve_y) = pool::get_reserves(&pool);
            assert!(reserve_x == 110_000_000, 2);  // 100 + 10 SUI
            assert!(reserve_y == 200_000_000_000 - usdc_amount, 3);

            coin::burn_for_testing(usdc_out);
            ts::return_shared(pool);
        };

        ts::end(scenario);
    }

    /// Test: Swap Y to X (USDC → SUI)
    ///
    /// Same formula, just reversed tokens
    #[test]
    fun test_swap_y_to_x() {
        let mut scenario = ts::begin(ADMIN);

        setup_pool_with_liquidity(&mut scenario, 100_000_000, 200_000_000_000);

        ts::next_tx(&mut scenario, USER2);
        {
            let mut pool = ts::take_shared<Pool<SUI, USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);

            let usdc_in = mint_coin<USDC>(20_000_000_000, ctx);  // 20,000 USDC

            let sui_out = swap::swap_y_to_x(&mut pool, usdc_in, 9_000_000, ctx);
            let sui_amount = coin::value(&sui_out);

            // Should get ~9.xxx SUI (not 10 SUI due to price impact + fee)
            assert!(sui_amount > 9_000_000, 0);
            assert!(sui_amount < 10_000_000, 1);

            coin::burn_for_testing(sui_out);
            ts::return_shared(pool);
        };

        ts::end(scenario);
    }

    /// Test: Swap Output Calculation
    ///
    /// YOUR IMPLEMENTATION MUST:
    /// Use formula: dy = (dx * (10000 - fee_bps) * y) / (x * 10000 + dx * (10000 - fee_bps))
    ///
    /// With 0.3% fee (30 bps):
    ///   dy = (dx * 9970 * y) / (x * 10000 + dx * 9970)
    #[test]
    fun test_swap_output_calculation() {
        // Test Case 1: Pool 100/200, swap 10 (small trade)
        // dy = (10 * 9970 * 200) / (100 * 10000 + 10 * 9970)
        //    = 19,940,000 / 1,099,700 = 18.13...
        let amount_out = math::calculate_swap_output(10, 100, 200, 30);
        assert!(amount_out == 18, 0);

        // Test Case 2: Pool 1000/2000, swap 100 (same ratio, 10x scale)
        // dy = (100 * 9970 * 2000) / (1000 * 10000 + 100 * 9970)
        //    = 1,994,000,000 / 10,997,000 = 181.3...
        let amount_out2 = math::calculate_swap_output(100, 1000, 2000, 30);
        assert!(amount_out2 == 181, 1);

        // Test Case 3: Large trade (50% of reserve) - HIGH price impact
        // dy = (50 * 9970 * 200) / (100 * 10000 + 50 * 9970)
        //    = 99,700,000 / 1,498,500 = 66.5...
        let amount_out3 = math::calculate_swap_output(50, 100, 200, 30);
        assert!(amount_out3 == 66, 2);
    }

    /// Test: Slippage Protection
    ///
    /// If actual output < min_out, transaction should REVERT
    /// This protects users from:
    /// - Front-running attacks
    /// - Price changes between quote and execution
    #[test]
    #[expected_failure(abort_code = 2)] // E_SLIPPAGE_EXCEEDED
    fun test_swap_slippage_exceeded() {
        let mut scenario = ts::begin(ADMIN);

        setup_pool_with_liquidity(&mut scenario, 100_000_000, 200_000_000_000);

        ts::next_tx(&mut scenario, USER2);
        {
            let mut pool = ts::take_shared<Pool<SUI, USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);

            let sui_in = mint_coin<SUI>(10_000_000, ctx);

            // Unrealistic expectation: want 20B USDC but will only get ~18B
            // This should FAIL with E_SLIPPAGE_EXCEEDED
            let usdc_out = swap::swap_x_to_y(&mut pool, sui_in, 20_000_000_000, ctx);
            coin::burn_for_testing(usdc_out);
            ts::return_shared(pool);
        };

        ts::end(scenario);
    }

    /// Test: Zero Amount Swap
    ///
    /// Swapping zero tokens should REVERT
    #[test]
    #[expected_failure(abort_code = 0)] // E_ZERO_AMOUNT
    fun test_swap_zero_amount() {
        let mut scenario = ts::begin(ADMIN);

        setup_pool_with_liquidity(&mut scenario, 100_000_000, 200_000_000_000);

        ts::next_tx(&mut scenario, USER2);
        {
            let mut pool = ts::take_shared<Pool<SUI, USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);

            let sui_in = mint_coin<SUI>(0, ctx);  // Zero amount!
            let usdc_out = swap::swap_x_to_y(&mut pool, sui_in, 0, ctx);
            coin::burn_for_testing(usdc_out);
            ts::return_shared(pool);
        };

        ts::end(scenario);
    }

    // =========================================================================
    // ADMIN TESTS
    // =========================================================================

    /// Test: Admin Fee Update
    ///
    /// Only admin (holder of AdminCap) can update pool fees
    #[test]
    fun test_set_fee() {
        let mut scenario = ts::begin(ADMIN);

        {
            let ctx = ts::ctx(&mut scenario);
            let (pool, admin_cap) = pool::create_pool<SUI, USDC>(ctx);
            transfer::public_share_object(pool);
            transfer::public_transfer(admin_cap, ADMIN);
        };

        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut pool = ts::take_shared<Pool<SUI, USDC>>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

            // Verify default fee
            assert!(pool::get_fee_bps(&pool) == 30, 0);  // 0.3%

            // Update to 0.5%
            pool::set_fee(&admin_cap, &mut pool, 50);

            // Verify new fee
            assert!(pool::get_fee_bps(&pool) == 50, 1);  // 0.5%

            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(pool);
        };

        ts::end(scenario);
    }

    // =========================================================================
    // INVARIANT TESTS
    // =========================================================================

    /// Test: Constant Product Invariant (k increases with fees)
    ///
    /// After each swap:
    /// - k = x * y should INCREASE (fees stay in pool)
    /// - This is how LPs earn yield!
    #[test]
    fun test_constant_product_maintained() {
        let mut scenario = ts::begin(ADMIN);

        setup_pool_with_liquidity(&mut scenario, 100_000_000, 200_000_000_000);

        ts::next_tx(&mut scenario, USER2);
        {
            let mut pool = ts::take_shared<Pool<SUI, USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);

            // Calculate initial k
            let (reserve_x_before, reserve_y_before) = pool::get_reserves(&pool);
            let k_before = (reserve_x_before as u128) * (reserve_y_before as u128);

            // Perform swap
            let sui_in = mint_coin<SUI>(10_000_000, ctx);
            let usdc_out = swap::swap_x_to_y(&mut pool, sui_in, 0, ctx);

            // Calculate new k
            let (reserve_x_after, reserve_y_after) = pool::get_reserves(&pool);
            let k_after = (reserve_x_after as u128) * (reserve_y_after as u128);

            // k should INCREASE (0.3% fee stays in pool)
            assert!(k_after >= k_before, 0);

            coin::burn_for_testing(usdc_out);
            ts::return_shared(pool);
        };

        ts::end(scenario);
    }

    // =========================================================================
    // PRICE IMPACT TESTS
    // =========================================================================

    /// Test: Price Impact Increases with Trade Size
    ///
    /// Larger trades relative to pool size = worse exchange rate
    /// This is a fundamental property of constant product AMMs
    #[test]
    fun test_price_impact_increases_with_size() {
        let mut scenario = ts::begin(ADMIN);

        // Large pool: 1000 SUI / 2,000,000 USDC
        setup_pool_with_liquidity(&mut scenario, 1_000_000_000, 2_000_000_000_000);

        ts::next_tx(&mut scenario, USER2);
        {
            let pool = ts::take_shared<Pool<SUI, USDC>>(&scenario);
            let (reserve_x, reserve_y) = pool::get_reserves(&pool);
            let fee_bps = pool::get_fee_bps(&pool);

            // Small trade: 1 SUI (0.1% of pool)
            let out_small = math::calculate_swap_output(1_000_000, reserve_x, reserve_y, fee_bps);
            let effective_price_small = (out_small as u128) * 1_000_000 / (1_000_000 as u128);

            // Medium trade: 10 SUI (1% of pool)
            let out_medium = math::calculate_swap_output(10_000_000, reserve_x, reserve_y, fee_bps);
            let effective_price_medium = (out_medium as u128) * 1_000_000 / (10_000_000 as u128);

            // Large trade: 100 SUI (10% of pool)
            let out_large = math::calculate_swap_output(100_000_000, reserve_x, reserve_y, fee_bps);
            let effective_price_large = (out_large as u128) * 1_000_000 / (100_000_000 as u128);

            // Price per unit DECREASES as trade size increases
            assert!(effective_price_small > effective_price_medium, 0);
            assert!(effective_price_medium > effective_price_large, 1);

            ts::return_shared(pool);
        };

        ts::end(scenario);
    }

    // =========================================================================
    // VIEW FUNCTION TESTS
    // =========================================================================

    /// Test: Price Calculation
    #[test]
    fun test_get_price() {
        let mut scenario = ts::begin(ADMIN);

        // Pool: 100 SUI / 200,000 USDC (price = 2000 USDC per SUI)
        setup_pool_with_liquidity(&mut scenario, 100_000_000, 200_000_000_000);

        ts::next_tx(&mut scenario, USER1);
        {
            let pool = ts::take_shared<Pool<SUI, USDC>>(&scenario);

            let price_x_to_y = pool::get_price_x_to_y(&pool);
            let price_y_to_x = pool::get_price_y_to_x(&pool);

            // 200B / 100M = 2000 USDC per SUI
            assert!(price_x_to_y == 2000, 0);

            // 100M / 200B = 0 (integer division truncates)
            assert!(price_y_to_x == 0, 1);

            ts::return_shared(pool);
        };

        ts::end(scenario);
    }

    /// Test: Quote Functions
    #[test]
    fun test_quote_functions() {
        let mut scenario = ts::begin(ADMIN);

        setup_pool_with_liquidity(&mut scenario, 100_000_000, 200_000_000_000);

        ts::next_tx(&mut scenario, USER1);
        {
            let pool = ts::take_shared<Pool<SUI, USDC>>(&scenario);

            // Quote should match actual swap calculation
            let quote_x_to_y = swap::quote_x_to_y(&pool, 10_000_000);
            let (reserve_x, reserve_y) = pool::get_reserves(&pool);
            let expected = math::calculate_swap_output(10_000_000, reserve_x, reserve_y, 30);

            assert!(quote_x_to_y == expected, 0);

            ts::return_shared(pool);
        };

        ts::end(scenario);
    }

    // =========================================================================
    // PTB COMPOSABILITY TEST - Multi-hop Swap
    // =========================================================================

    /// Test: Multi-hop Swap (SUI → USDC → USDT)
    ///
    /// Demonstrates Sui's PTB composability:
    /// - One transaction, multiple pool interactions
    /// - Output from first swap flows into second swap
    /// - All atomic - if any step fails, everything reverts
    #[test]
    fun test_multi_hop_swap() {
        let mut scenario = ts::begin(ADMIN);

        // Create Pool 1: SUI-USDC
        {
            let ctx = ts::ctx(&mut scenario);
            let (pool1, admin_cap1) = pool::create_pool<SUI, USDC>(ctx);
            transfer::public_share_object(pool1);
            transfer::public_transfer(admin_cap1, ADMIN);
        };

        // Create Pool 2: USDC-USDT
        ts::next_tx(&mut scenario, ADMIN);
        {
            let ctx = ts::ctx(&mut scenario);
            let (pool2, admin_cap2) = pool::create_pool<USDC, USDT>(ctx);
            transfer::public_share_object(pool2);
            transfer::public_transfer(admin_cap2, ADMIN);
        };

        // Add liquidity to Pool 1
        ts::next_tx(&mut scenario, USER1);
        {
            let mut pool = ts::take_shared<Pool<SUI, USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);

            let sui = mint_coin<SUI>(100_000_000, ctx);
            let usdc = mint_coin<USDC>(200_000_000_000, ctx);
            let lp = liquidity::add_liquidity(&mut pool, sui, usdc, ctx);
            transfer::public_transfer(lp, USER1);

            ts::return_shared(pool);
        };

        // Add liquidity to Pool 2
        ts::next_tx(&mut scenario, USER1);
        {
            let mut pool = ts::take_shared<Pool<USDC, USDT>>(&scenario);
            let ctx = ts::ctx(&mut scenario);

            let usdc = mint_coin<USDC>(100_000_000_000, ctx);
            let usdt = mint_coin<USDT>(100_000_000_000, ctx);
            let lp = liquidity::add_liquidity(&mut pool, usdc, usdt, ctx);
            transfer::public_transfer(lp, USER1);

            ts::return_shared(pool);
        };

        // Multi-hop: SUI → USDC → USDT (in one transaction!)
        ts::next_tx(&mut scenario, USER2);
        {
            let mut pool1 = ts::take_shared<Pool<SUI, USDC>>(&scenario);
            let mut pool2 = ts::take_shared<Pool<USDC, USDT>>(&scenario);
            let ctx = ts::ctx(&mut scenario);

            // Step 1: SUI → USDC
            let sui_in = mint_coin<SUI>(1_000_000, ctx);
            let usdc_mid = swap::swap_x_to_y(&mut pool1, sui_in, 0, ctx);
            let _usdc_amount = coin::value(&usdc_mid);

            // Step 2: USDC → USDT (using output from step 1!)
            let usdt_out = swap::swap_x_to_y(&mut pool2, usdc_mid, 0, ctx);
            let usdt_amount = coin::value(&usdt_out);

            // Successfully received USDT
            assert!(usdt_amount > 0, 0);

            coin::burn_for_testing(usdt_out);

            ts::return_shared(pool1);
            ts::return_shared(pool2);
        };

        ts::end(scenario);
    }

    // =========================================================================
    // OVERFLOW TESTS
    // These tests verify math functions handle large values without overflow
    // =========================================================================

    /// Test: Square Root with Large Values
    ///
    /// YOUR IMPLEMENTATION MUST:
    /// - Handle values near u64::MAX without overflow
    /// - Use u128 for intermediate calculations when necessary
    ///
    /// sqrt(u64::MAX) ≈ 4,294,967,295 (which is u32::MAX)
    #[test]
    fun test_sqrt_large_values() {
        // sqrt(u64::MAX) = sqrt(18,446,744,073,709,551,615) ≈ 4,294,967,295
        let max_u64: u64 = 18_446_744_073_709_551_615;
        let sqrt_max = math::sqrt(max_u64);
        assert!(sqrt_max == 4_294_967_295, 0);

        // Verify: (4,294,967,295)^2 <= max_u64 < (4,294,967,296)^2
        assert!((sqrt_max as u128) * (sqrt_max as u128) <= (max_u64 as u128), 1);

        // Large but not max
        let large_val: u64 = 10_000_000_000_000_000_000; // 10^19
        let sqrt_large = math::sqrt(large_val);
        assert!(sqrt_large == 3_162_277_660, 2); // sqrt(10^19) ≈ 3.16 * 10^9

        // Verify result is correct (result^2 <= input < (result+1)^2)
        assert!((sqrt_large as u128) * (sqrt_large as u128) <= (large_val as u128), 3);
    }

    /// Test: sqrt_u128 for Very Large Values
    ///
    /// When multiplying two u64 values, result can exceed u64::MAX
    /// sqrt_u128 handles these cases for initial LP calculation
    #[test]
    fun test_sqrt_u128_large_values() {
        // Test: sqrt(u64::MAX * u64::MAX) should work
        let max_u64: u128 = 18_446_744_073_709_551_615;
        let product = max_u64 * max_u64;
        let sqrt_result = math::sqrt_u128(product);

        // sqrt(max^2) = max
        assert!(sqrt_result == max_u64, 0);

        // Test: sqrt of large product
        let large_a: u128 = 1_000_000_000_000; // 10^12
        let large_b: u128 = 1_000_000_000_000; // 10^12
        let sqrt_large = math::sqrt_u128(large_a * large_b);
        assert!(sqrt_large == 1_000_000_000_000, 1); // 10^12
    }

    /// Test: Swap Output with Large Reserves (Overflow Protection)
    ///
    /// Formula: dy = (dx * (10000 - fee) * y) / (x * 10000 + dx * (10000 - fee))
    ///
    /// With large reserves, intermediate calculations can overflow.
    /// YOUR IMPLEMENTATION MUST use u128 for intermediate values.
    #[test]
    fun test_swap_output_large_reserves() {
        // Large reserves: 1 trillion tokens each (10^12)
        let reserve_in: u64 = 1_000_000_000_000;
        let reserve_out: u64 = 1_000_000_000_000;
        let amount_in: u64 = 1_000_000_000; // 1 billion swap

        // Should not overflow
        let amount_out = math::calculate_swap_output(amount_in, reserve_in, reserve_out, 30);

        // Verify output is reasonable (should be close to amount_in due to 1:1 reserves)
        assert!(amount_out > 0, 0);
        assert!(amount_out < amount_in, 1); // Less due to fee + price impact

        // Very large reserves near u64::MAX / 10000
        let huge_reserve: u64 = 1_000_000_000_000_000; // 10^15
        let huge_out = math::calculate_swap_output(
            1_000_000_000_000, // 10^12 swap
            huge_reserve,
            huge_reserve,
            30
        );
        assert!(huge_out > 0, 2);
    }

    /// Test: Initial LP with Large Amounts (Overflow in Multiplication)
    ///
    /// LP = sqrt(amount_x * amount_y)
    ///
    /// When amount_x and amount_y are both large, their product can overflow u64.
    /// YOUR IMPLEMENTATION MUST:
    /// - Convert to u128 before multiplication
    /// - Use sqrt_u128 for the square root
    /// - Convert result back to u64
    #[test]
    fun test_initial_lp_large_amounts() {
        // Large amounts that would overflow if multiplied as u64
        // 10^10 * 10^10 = 10^20 > u64::MAX (≈ 1.8 * 10^19)
        let amount_x: u64 = 10_000_000_000; // 10^10
        let amount_y: u64 = 10_000_000_000; // 10^10

        // Should not overflow - uses u128 internally
        let lp = math::calculate_initial_lp(amount_x, amount_y);

        // LP = sqrt(10^20) = 10^10
        assert!(lp == 10_000_000_000, 0);

        // Even larger: near max safe values
        let big_x: u64 = 1_000_000_000_000; // 10^12
        let big_y: u64 = 1_000_000_000_000; // 10^12

        let big_lp = math::calculate_initial_lp(big_x, big_y);
        // LP = sqrt(10^24) = 10^12
        assert!(big_lp == 1_000_000_000_000, 1);
    }

    /// Test: Subsequent LP with Large Values
    ///
    /// LP = min(dx/x, dy/y) * total_lp
    ///
    /// When reserves and supplies are large, calculations must use u128.
    #[test]
    fun test_subsequent_lp_large_values() {
        // Large existing pool
        let reserve_x: u64 = 1_000_000_000_000; // 10^12
        let reserve_y: u64 = 2_000_000_000_000; // 2 * 10^12
        let lp_supply: u64 = 1_414_213_562_373; // sqrt(10^12 * 2*10^12)

        // Add 10% more
        let amount_x: u64 = 100_000_000_000; // 10^11
        let amount_y: u64 = 200_000_000_000; // 2 * 10^11

        let lp = math::calculate_subsequent_lp(
            amount_x,
            amount_y,
            reserve_x,
            reserve_y,
            lp_supply
        );

        // Should get ~10% of existing LP supply
        assert!(lp > 0, 0);
        // lp ≈ min(10^11/10^12, 2*10^11/2*10^12) * 1.41*10^12 ≈ 0.1 * 1.41*10^12 ≈ 1.41*10^11
        assert!(lp > 100_000_000_000, 1); // > 10^11
        assert!(lp < 200_000_000_000, 2); // < 2*10^11
    }

    /// Test: Remove Liquidity with Large Values
    ///
    /// amount_out = (lp_burned / total_lp) * reserve
    ///
    /// Large reserves with small LP burns must maintain precision.
    #[test]
    fun test_remove_liquidity_large_values() {
        // Large pool
        let reserve_x: u64 = 1_000_000_000_000_000; // 10^15
        let reserve_y: u64 = 2_000_000_000_000_000; // 2 * 10^15
        let lp_supply: u64 = 1_000_000_000_000;     // 10^12

        // Remove 1% of LP
        let lp_amount: u64 = 10_000_000_000; // 10^10

        let (amount_x, amount_y) = math::calculate_remove_liquidity(
            lp_amount,
            lp_supply,
            reserve_x,
            reserve_y
        );

        // Should get 1% of reserves
        // amount_x = (10^10 / 10^12) * 10^15 = 10^13
        // amount_y = (10^10 / 10^12) * 2*10^15 = 2*10^13
        assert!(amount_x == 10_000_000_000_000, 0);     // 10^13
        assert!(amount_y == 20_000_000_000_000, 1);     // 2 * 10^13
    }

    /// Test: Full Flow with Large Values (Integration)
    ///
    /// End-to-end test with large token amounts to verify
    /// no overflow occurs in real usage scenarios.
    #[test]
    fun test_large_value_full_flow() {
        let mut scenario = ts::begin(ADMIN);

        // Create pool
        {
            let ctx = ts::ctx(&mut scenario);
            let (pool, admin_cap) = pool::create_pool<SUI, USDC>(ctx);
            transfer::public_share_object(pool);
            transfer::public_transfer(admin_cap, ADMIN);
        };

        // Add large initial liquidity: 1 billion SUI / 2 trillion USDC
        ts::next_tx(&mut scenario, USER1);
        {
            let mut pool = ts::take_shared<Pool<SUI, USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);

            let sui = mint_coin<SUI>(1_000_000_000_000, ctx);    // 10^12
            let usdc = mint_coin<USDC>(2_000_000_000_000_000, ctx); // 2 * 10^15

            let lp = liquidity::add_liquidity(&mut pool, sui, usdc, ctx);
            let lp_amount = coin::value(&lp);

            // LP should be sqrt(10^12 * 2*10^15) = sqrt(2*10^27) ≈ 1.41 * 10^13
            assert!(lp_amount > 1_000_000_000_000, 0);

            transfer::public_transfer(lp, USER1);
            ts::return_shared(pool);
        };

        // Large swap: 100 billion SUI
        ts::next_tx(&mut scenario, USER2);
        {
            let mut pool = ts::take_shared<Pool<SUI, USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);

            let sui_in = mint_coin<SUI>(100_000_000_000, ctx); // 10^11

            // Should not overflow during swap calculation
            let usdc_out = swap::swap_x_to_y(&mut pool, sui_in, 0, ctx);
            let usdc_amount = coin::value(&usdc_out);

            assert!(usdc_amount > 0, 1);

            coin::burn_for_testing(usdc_out);
            ts::return_shared(pool);
        };

        ts::end(scenario);
    }
}
