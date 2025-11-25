const { ClientFactory, DefaultProviderUrls, WalletClient, Args } = require('@massalabs/massa-web3');
const fs = require('fs');
const path = require('path');

async function deployContract() {
  const privateKey = process.env.WALLET_SECRET_KEY;
  if (!privateKey) {
    throw new Error('WALLET_SECRET_KEY environment variable not set');
  }

  console.log('📡 Connecting to Massa mainnet...');
  const publicApi = await ClientFactory.createDefaultClient(
    DefaultProviderUrls.MAINNET,
    true,
    { PERIOD_OFFSET: 5, requestTimeout: 30000 }
  );

  const account = await WalletClient.getAccountFromSecretKey(privateKey);
  const deployer = account.address;
  console.log(`👤 Deployer address: ${deployer}`);

  const balance = await publicApi.wallet().getAccountBalance(deployer);
  console.log(`💰 Balance: ${Number(balance.final) / 1e9} MAS`);

  const wasmPath = path.join(__dirname, 'build', 'safedeal.wasm');
  const contractCode = new Uint8Array(fs.readFileSync(wasmPath));
  console.log(`📦 Contract size: ${contractCode.length} bytes`);

  console.log('🚀 Deploying contract...');
  const operationId = await publicApi.smartContracts().deploySmartContract({
    contractDataBinary: contractCode,
    maxGas: 500000000n,
    coins: 10000000n, // 0.01 MAS initial balance for booking fees
    fee: 100000n,
  }, account);

  console.log(`⏳ Operation ID: ${operationId}`);
  console.log('⌛ Waiting for finalization (this takes ~30 seconds)...');

  const events = await publicApi.smartContracts().getFilteredScOutputEvents({
    start: null,
    end: null,
    original_caller_address: deployer,
    emitter_address: null,
    original_operation_id: operationId,
  });

  if (events.length === 0) {
    throw new Error('No events found - deployment may have failed');
  }

  const contractAddress = events[0].context.call_stack[0];
  console.log(`✅ Contract deployed: ${contractAddress}`);
  console.log(`🔗 Explorer: https://explorer.massa.net/mainnet/address/${contractAddress}`);

  return contractAddress;
}

deployContract().catch(console.error);
