import { FTContract } from "./contract";
import { assert, near, validateAccountId } from "near-sdk-js";
import { internalSendNEAR } from "./internal";

//Reg account
export function internalOnRegister(contract: FTContract) {
    const accountId = near.signerAccountId();
    const registrantId = near.predecessorAccountId();
    const attachedDeposit = near.attachedDeposit();
    //Account existed
    if (contract.accounts.containsKey(accountId)) {
        //Refund directly to signer
        internalSendNEAR(accountId, attachedDeposit);
        return {
            success: true,
            msg: `Account ${accountId} is already registered`,
        };
    }
    //Calculate storage usage
    const initialStorage = near.storageUsage();
    contract.accounts.set(accountId, BigInt(0));
    contract.accountRegistrants.set(accountId, registrantId);
    contract.accountDeposits.set(accountId, BigInt(0));
    const requiredDeposit =
        (near.storageUsage() - initialStorage) * near.storageByteCost();
    contract.accountDeposits.set(accountId, requiredDeposit);
    //Not enough deposit
    if (requiredDeposit > attachedDeposit) {
        //Revert
        contract.accounts.remove(accountId);
        contract.accountRegistrants.remove(accountId);
        contract.accountDeposits.remove(accountId);
        //Refund to caller
        internalSendNEAR(registrantId, attachedDeposit);
        return {
            success: false,
            msg: "Not enough deposit for ft_on_register",
        };
    }
    //Refund over deposited to signer
    if (requiredDeposit < attachedDeposit) {
        internalSendNEAR(accountId, attachedDeposit - requiredDeposit);
    }
    return {
        success: true,
        msg: `Account ${accountId} registered successfully`,
    };
}

export function internalRegister(contract: FTContract, registerId: string) {
    const accountId = registerId || near.predecessorAccountId();
    assert(validateAccountId(accountId), "Invalid account");
    const attachedDeposit = near.attachedDeposit();
    //Account registered
    assert(
        !contract.accounts.containsKey(accountId),
        "Account is already registered"
    );
    //New account registration
    const initialStorage = near.storageUsage();
    contract.accounts.set(accountId, BigInt(0));
    contract.accountRegistrants.set(accountId, near.predecessorAccountId());
    contract.accountDeposits.set(accountId, BigInt(0));
    const requiredDeposit =
        (near.storageUsage() - initialStorage) * near.storageByteCost();
    contract.accountDeposits.set(accountId, requiredDeposit);
    //Deposit enough for data storage
    assert(
        attachedDeposit >= requiredDeposit,
        `Not enough attached deposit. Required: ${requiredDeposit.toString()}`
    );
    //Register is done then refund over deposited
    const refund = attachedDeposit - requiredDeposit;
    if (refund > 0) {
        near.log(
            `Refunding ${refund} yoctoNEAR to ${near.predecessorAccountId()}`
        );
        internalSendNEAR(near.predecessorAccountId(), refund);
    }
    return {
        success: true,
        message: `Account ${accountId} registered with storage deposit of ${requiredDeposit.toString()}`,
    };
}
