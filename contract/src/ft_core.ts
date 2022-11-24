import { assert, near } from "near-sdk-js";
import { FTContract } from "./contract";
import { FT, GAS, METADATA_SPEC, STANDARD_NAME } from "./enum";
import { FtEventLogData, FtTransferLog } from "./event";
import { internalGetBalance, internalSendNEAR } from "./internal";
import { assertCrossContractCall, assertOneYocto } from "./utils";

// Transfer tokens
export function internalTransfer(
    contract: FTContract,
    senderId: string,
    receiverId: string,
    amount: string,
    memo: string = null
) {
    assertOneYocto();
    assert(senderId != receiverId, "Sender and receiver must be different");
    assert(BigInt(amount) > BigInt(0), "Transfer amount must greater than 0");
    internalWithdraw(contract, senderId, amount);
    internalDeposit(contract, receiverId, amount);
    //Logging
    const transferLog: FtTransferLog[] = [
        {
            amount,
            old_owner_id: senderId,
            new_owner_id: receiverId,
            memo,
        },
    ];
    const log: FtEventLogData = {
        standard: STANDARD_NAME,
        version: METADATA_SPEC,
        event: "ft_transfer",
        data: transferLog,
    };
    near.log(`EVENT_JSON:${JSON.stringify(log)}`);
}

export function internalTransferCall(
    contract: FTContract,
    senderId: string,
    receiverId: string,
    amount: string,
    memo: string = null,
    msg: string = null
) {
    internalTransfer(contract, senderId, receiverId, amount, memo);
    const promise = near.promiseBatchCreate(receiverId);
    const params = {
        sender_id: senderId,
        amount,
        msg,
        receiver_id: receiverId,
    };
    near.promiseBatchActionFunctionCall(
        promise,
        "ft_on_transfer",
        JSON.stringify(params),
        0,
        GAS.FOR_FT_ON_TRANSFER
    );
    return near.promiseReturn(promise);
}

//Subtract sender's balance
export function internalWithdraw(
    contract: FTContract,
    accountId: string,
    amount: string
) {
    const balance = internalGetBalance(contract, accountId);
    const newBalance = BigInt(balance) - BigInt(amount);
    const newSupply = BigInt(contract.totalSupply) - BigInt(amount);
    assert(newBalance >= 0, `Account ${accountId} doesn't have enough balance`);
    assert(newSupply >= 0, "Total supply overflow");
    contract.accounts.set(accountId, newBalance);
    contract.totalSupply = newSupply;
}

//Add to receiver's balance
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

export function internalFtOnPurchase(contract: FTContract) {
    assertCrossContractCall();
    const receiverId = near.signerAccountId();
    const senderId = near.currentAccountId();
    const nearAmount = near.attachedDeposit();
    assert(nearAmount >= contract.rate, "Must buy at least 1 token");
    const tokenAmount = (nearAmount / contract.rate).toString();
    internalWithdraw(contract, senderId, tokenAmount);
    internalDeposit(contract, receiverId, tokenAmount);
    near.log(`${receiverId} bought ${tokenAmount} successfully`);
    //Refund over deposited
    const refundAmount = nearAmount % contract.rate;
    if (refundAmount > 0) {
        internalSendNEAR(receiverId, refundAmount);
        near.log(`Refund ${refundAmount} NEAR to ${receiverId}`);
    }
    return `${receiverId} bought ${tokenAmount} successfully`;
}

export function internalFtPurchase(contract: FTContract) {
    const receiverId = near.predecessorAccountId();
    const senderId = near.currentAccountId();
    const nearAmount = near.attachedDeposit();
    assert(nearAmount >= contract.rate, "Must buy at least 1 token");
    const tokenAmount = (nearAmount / contract.rate).toString();
    internalWithdraw(contract, senderId, tokenAmount);
    internalDeposit(contract, receiverId, tokenAmount);
    near.log(`${receiverId} bought ${tokenAmount} successfully`);
    //Refund over deposited
    const refundAmount = nearAmount % contract.rate;
    if (refundAmount > 0) {
        internalSendNEAR(receiverId, refundAmount);
        near.log(`Refund ${refundAmount} NEAR to ${receiverId}`);
    }
}

export function internalOnPurchase(
    contract: FTContract,
    amount: string,
    memo: string
) {
    assertCrossContractCall();
    const senderId = near.signerAccountId();
    const receiverId = near.currentAccountId();
    internalTransfer(contract, senderId, receiverId, amount, memo);
    return `Send ${amount} PTIT TOKEN to ${receiverId} successfully`;
}

export function internalOnRefund(
    contract: FTContract,
    amount: string,
    memo: string
) {
    assertCrossContractCall();
    const receiverId = near.signerAccountId();
    const senderId = near.currentAccountId();
    internalTransfer(contract, senderId, receiverId, amount, memo);
    return `Refund ${amount} PTIT TOKEN to ${receiverId} successfully`;
}
