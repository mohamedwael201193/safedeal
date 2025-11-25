import { stringToBytes } from "@massalabs/as-types";
import { Context, generateEvent, Storage } from "@massalabs/massa-as-sdk";

/**
 * Minimal test contract to verify SDK 3.0.2 works on MAIN.4.0
 * Uses only basic functions confirmed available in abi_gas_costs.json
 */

export function constructor(_: StaticArray<u8>): void {
  assert(Context.isDeployingContract());
  Storage.set("initialized", "true");
  generateEvent("TestMinimal contract deployed successfully");
}

/**
 * Test basic Context and Storage functions
 */
export function testBasicFunctions(args: StaticArray<u8>): StaticArray<u8> {
  const period = Context.currentPeriod();
  const caller = Context.caller();
  const coins = Context.transferredCoins();

  // Store test data
  Storage.set("lastCaller", caller.toString());
  Storage.set("lastPeriod", period.toString());
  Storage.set("lastCoins", coins.toString());

  // Generate event
  generateEvent(
    `Test OK - Period: ${period.toString()}, Caller: ${caller.toString()}, Coins: ${coins.toString()}`
  );

  // Return success message
  return stringToBytes("Test completed successfully");
}

/**
 * Test reading stored data
 */
export function getStoredData(_: StaticArray<u8>): StaticArray<u8> {
  const caller = Storage.get("lastCaller");
  const period = Storage.get("lastPeriod");
  const coins = Storage.get("lastCoins");

  const message = `Stored - Caller: ${caller}, Period: ${period}, Coins: ${coins}`;
  return stringToBytes(message);
}
