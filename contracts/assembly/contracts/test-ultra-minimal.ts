import { stringToBytes } from "@massalabs/as-types";
import { Context, generateEvent } from "@massalabs/massa-as-sdk";

/**
 * Ultra minimal test - no constructor, no Storage, just pure functions
 */

export function hello(args: StaticArray<u8>): StaticArray<u8> {
  const period = Context.currentPeriod();
  const message = `Hello from period ${period.toString()}`;
  generateEvent(message);
  return stringToBytes(message);
}
