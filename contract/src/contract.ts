import { FTMetadata } from "./metadata";
import {
    NearBindgen,
    near,
    call,
    view,
    LookupMap,
    initialize,
    assert,
    validateAccountId,
} from "near-sdk-js";
import {
    internalGetAccountStorageUsage,
    internalGetBalance,
    internalRegisterAccount,
    internalSendNEAR,
    internalTransfer,
} from "./internal";
import { assertAtLeastOneYocto } from "./utils";
import { FtEventLogData, FtMintLog, FtTransferLog } from "./event";

const FT_SPEC = "ft-1.0.0";

@NearBindgen({ requireInit: true })
export class FTContract {
    tokenMetadata: FTMetadata;
    accounts: LookupMap<bigint>; // <AccountId, tokenAmount>
    accountRegistrants: LookupMap<string>;
    accountDeposits: LookupMap<bigint>;
    totalSupply: bigint;

    constructor() {
        this.tokenMetadata = {
            spec: "nep141",
            name: "p-coin",
            symbol: "ptit coin",
            decimals: 9,
        };
        this.accounts = new LookupMap("a");
        this.accountRegistrants = new LookupMap("r");
        this.accountDeposits = new LookupMap("d");
        this.totalSupply = BigInt("0");
    }

    @initialize({})
    init({
        owner_id,
        total_supply,
    }: {
        owner_id: string;
        total_supply: string;
    }) {
        assert(
            BigInt(total_supply) > BigInt(0),
            "Total supply must greater than 0"
        );
        validateAccountId(owner_id);
        this.totalSupply = BigInt(total_supply);
        this.accounts.set(owner_id, this.totalSupply);
        //Logging
        const mintLog: FtMintLog[] = [
            {
                owner_id,
                amount: total_supply,
            },
        ];
        const log: FtEventLogData = {
            standard: "nep141",
            version: "ft-1.0.0",
            event: "ft_mint",
            data: mintLog,
        };
        near.log(log);
    }

    @call({ payableFunction: true })
    storage_deposit({ account_id }: { account_id: string }) {
        const accountId = account_id || near.predecessorAccountId();
        validateAccountId(accountId);
        const attachedDeposit = near.attachedDeposit();
        if (this.accounts.containsKey(accountId)) {
            if (attachedDeposit > 0) {
                internalSendNEAR(near.predecessorAccountId(), attachedDeposit);
                return {
                    message:
                        "Account is already registered, deposit refunded to predecessor",
                };
            }
            return { message: "Account is already registered" };
        }
        const storageCost = internalGetAccountStorageUsage(
            this,
            accountId.length
        );
        if (attachedDeposit < storageCost) {
            internalSendNEAR(near.predecessorAccountId(), attachedDeposit);
            return {
                message: `Not enough attached deposit to cover storage cost. Required: ${storageCost.toString()}`,
            };
        }
        internalRegisterAccount(
            this,
            near.predecessorAccountId(),
            accountId,
            storageCost.toString()
        );
        const refund = attachedDeposit - storageCost;
        if (refund > 0) {
            near.log(
                "Storage registration refunding " +
                    refund +
                    " yoctoNEAR to " +
                    near.predecessorAccountId()
            );
            internalSendNEAR(near.predecessorAccountId(), refund);
        }
        return {
            message: `Account ${accountId} registered with storage deposit of ${storageCost.toString()}`,
        };
    }

    @call({ payableFunction: true })
    ft_transfer({
        receiver_id,
        amount,
        memo,
    }: {
        receiver_id: string;
        amount: string;
        memo?: string;
    }) {
        assertAtLeastOneYocto();
        const senderId = near.predecessorAccountId();
        //Logging
        const transferLog: FtTransferLog[] = [
            {
                amount,
                old_owner_id: senderId,
                new_owner_id: receiver_id,
                memo,
            },
        ];
        const log: FtEventLogData = {
            standard: "nep141",
            version: "ft-1.0.0",
            event: "ft_transfer",
            data: transferLog,
        };
        near.log(log);
        internalTransfer(this, senderId, receiver_id, amount, memo);
    }

    @call({ payableFunction: true })
    ft_transfer_call({
        receiver_id,
        amount,
        memo,
        msg,
    }: {
        receiver_id: string;
        amount: string;
        memo?: string;
        msg?: string;
    }) {
        assertAtLeastOneYocto();
        const senderId = near.predecessorAccountId();
        internalTransfer(this, senderId, receiver_id, amount, memo);
        const promise = near.promiseBatchCreate(receiver_id);
        const params = {
            sender_id: senderId,
            amount,
            msg,
            receiver_id,
        };
        //Logging
        const transferLog: FtTransferLog[] = [
            {
                amount,
                old_owner_id: senderId,
                new_owner_id: receiver_id,
                memo,
            },
        ];
        const log: FtEventLogData = {
            standard: "nep141",
            version: "ft-1.0.0",
            event: "ft_transfer",
            data: transferLog,
        };
        near.log(log);
        near.promiseBatchActionFunctionCall(
            promise,
            "ft_on_transfer",
            JSON.stringify(params),
            0,
            30_000_000_000_000_000
        );
        return near.promiseReturn(promise);
    }

    // @call({ payableFunction: true })
    // ft_resolve_transfer({
    //     sender_id,
    //     receiver_id,
    //     amount,
    // }: {
    //     sender_id: string;
    //     receiver_id: string;
    //     amount: string;
    // }) {}

    // @call({ privateFunction: true })
    // ft_on_transfer({
    //     sender_id,
    //     amount,
    //     msg,
    // }: {
    //     sender_id: string;
    //     amount: string;
    //     msg: string;
    // }) {}

    @view({})
    ft_total_supply() {
        return this.totalSupply;
    }

    @view({})
    ft_balance_of({ account_id }: { account_id: string }) {
        validateAccountId(account_id);
        return internalGetBalance(this, account_id);
    }
}
