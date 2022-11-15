import { FTContract } from "./contract";
import { assert, near } from "near-sdk-js";

export function internalGetAccountStorageUsage(
    contract: FTContract,
    accountLength: number
): bigint {
    const initialStorageUsage = near.storageUsage();
    const tempAccountId = "a".repeat(64);
    contract.accounts.set(tempAccountId, BigInt(0));
    const len64StorageUsage = near.storageUsage() - initialStorageUsage;
    const len1StorageUsage = len64StorageUsage / BigInt(64);
    const lenAccountStorageUsage = len1StorageUsage * BigInt(accountLength);
    contract.accounts.remove(tempAccountId);
    return lenAccountStorageUsage * BigInt(3);
}

export function internalRegisterAccount(
    contract: FTContract,
    registrantAccountId: string,
    accountId: string,
    amount: string
) {
    assert(
        !contract.accounts.containsKey(accountId),
        "Account is already registered"
    );
    contract.accounts.set(accountId, BigInt(0));
    contract.accountRegistrants.set(accountId, registrantAccountId);
    contract.accountDeposits.set(accountId, BigInt(amount));
}

export function internalSendNEAR(receiverId: string, amount: bigint) {
    assert(amount > 0, "Sending amount must greater than 0");
    assert(
        near.accountBalance() > amount,
        `Not enough balance ${near.accountBalance()} to send ${amount}`
    );
    const promise = near.promiseBatchCreate(receiverId);
    near.promiseBatchActionTransfer(promise, amount);
    near.promiseReturn(promise);
}

export function internalGetBalance(
    contract: FTContract,
    accountId: string
): string {
    assert(
        contract.accounts.containsKey(accountId),
        `Account ${accountId} is not registered`
    );
    return contract.accounts.get(accountId).toString();
}

export function internalDeposit(
    contract: FTContract,
    accountId: string,
    amount: string
) {
    const balance = internalGetBalance(contract, accountId);
    const newBalance = BigInt(balance) + BigInt(amount);
    contract.accounts.set(accountId, newBalance);
    const newSupply = BigInt(contract.totalSupply) + BigInt(amount);
    contract.totalSupply = newSupply;
}

export function internalWithdraw(
    contract: FTContract,
    accountId: string,
    amount: string
) {
    const balance = internalGetBalance(contract, accountId);
    const newBalance = BigInt(balance) - BigInt(amount);
    const newSupply = BigInt(contract.totalSupply) - BigInt(amount);
    assert(newBalance > -1, `Account ${accountId} doesn't have enough balance`);
    assert(newSupply > -1, "Total supply overflow");
    contract.accounts.set(accountId, newBalance);
    contract.totalSupply = newSupply;
}

export function internalTransfer(
    contract: FTContract,
    senderId: string,
    receiverId: string,
    amount: string,
    memo: string = null
) {
    assert(senderId != receiverId, "Sender and receiver must be different");
    assert(BigInt(amount) > BigInt(0), "Transfer amount must greater than 0");
    internalWithdraw(contract, senderId, amount);
    internalDeposit(contract, receiverId, amount);
}
