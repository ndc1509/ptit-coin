import { assert, near } from "near-sdk-js";

export function assertOneYocto() {
    const deposited = near.attachedDeposit();
    assert(deposited == BigInt(1), "Requires 1 yoctoNEAR");
}

export function assertAtLeastOneYocto() {
    const deposited = near.attachedDeposit();
    assert(deposited >= BigInt(1), "Requires at least 1 yoctoNEAR");
}
