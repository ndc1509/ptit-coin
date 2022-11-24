import { assert } from "near-sdk-js";
import { FTContract } from "./contract";
export function internalUpdateRate(contract: FTContract, rate: string) {
    assert(BigInt(rate) > BigInt(0), "Rate must greater than 0");
    contract.rate = BigInt(rate);
}
