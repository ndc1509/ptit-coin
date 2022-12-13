import {
    assert,
    call,
    initialize,
    LookupMap,
    near,
    NearBindgen,
    validateAccountId,
    view,
} from "near-sdk-js";
import { FT } from "./enum";
import {
    internalFtOnPurchase,
    internalFtPurchase,
    internalOnPurchase,
    internalOnRefund,
    internalTransfer,
    internalTransferCall,
} from "./ft_core";
import { icon } from "./icon";
import { internalGetBalance } from "./internal";
import { FTMetadata } from "./metadata";
import { internalMint } from "./mint";
import { internalUpdateRate } from "./rate";
import { internalOnRegister, internalRegister } from "./registration";

@NearBindgen({ requireInit: true })
export class FTContract {
    owner_id: string; // Token creator
    rate: bigint; //1 token to yoctoNear
    tokenMetadata: FTMetadata;
    accounts: LookupMap<bigint>; // <AccountId, tokenAmount>
    accountRegistrants: LookupMap<string>; //<AccountId, registrant>
    accountDeposits: LookupMap<bigint>; //<AccountId, deposit>
    totalSupply: bigint; //Total tokens in the contract

    constructor() {
        this.owner_id = "";
        this.rate = BigInt(0);
        this.tokenMetadata = {
            spec: FT.METADATA_SPEC,
            name: "PTIT TOKEN",
            symbol: "ptitNEAR",
            icon,
            decimals: 0,
        };
        this.accounts = new LookupMap("a");
        this.accountRegistrants = new LookupMap("r");
        this.accountDeposits = new LookupMap("d");
        this.totalSupply = BigInt(0);
    }

    @initialize({})
    init({
        owner_id,
        rate,
        total_supply,
    }: {
        owner_id: string;
        rate: string;
        total_supply: string;
    }) {
        assert(validateAccountId(owner_id), "Invalid account ID");
        this.owner_id = owner_id;
        internalUpdateRate(this, rate);
        internalMint(this, BigInt(total_supply));
    }

    //Register new account
    //Allow a user pays for a different user to register
    @call({ payableFunction: true })
    ft_register({ account_id }: { account_id?: string }) {
        return internalRegister(this, account_id);
    }

    //Register
    @call({ payableFunction: true })
    ft_on_register() {
        return internalOnRegister(this);
    }

    // @call({ payableFunction: true })
    // on_buy_ft() {
    //     return internalFtOnPurchase(this);
    // }

    @call({ payableFunction: true })
    buy_ft() {
        return internalFtPurchase(this);
    }

    //Called by contract's owner and transfer to a receiver
    @call({ privateFunction: true, payableFunction: true })
    ft_transfer({
        receiver_id,
        amount,
        memo,
    }: {
        receiver_id: string;
        amount: string;
        memo?: string;
    }) {
        const senderId = near.predecessorAccountId();
        internalTransfer(this, senderId, receiver_id, amount, memo);
    }

    //Transfer token and call a method on receiver contract
    // @call({ privateFunction: true })
    // ft_transfer_call({
    //     receiver_id,
    //     amount,
    //     memo,
    //     msg,
    // }: {
    //     receiver_id: string;
    //     amount: string;
    //     memo?: string;
    //     msg?: string;
    // }) {
    //     const senderId = near.predecessorAccountId();
    //     internalTransferCall(this, senderId, receiver_id, amount, memo, msg);
    // }

    @call({ payableFunction: true })
    ft_on_purchase({ amount, memo }: { amount: string; memo?: string }) {
        return internalOnPurchase(this, amount, memo);
    }

    @call({ payableFunction: true })
    ft_on_refund({ amount, memo }: { amount: string; memo?: string }) {
        return internalOnRefund(this, amount, memo);
    }

    //Mint token
    @call({ privateFunction: true })
    ft_mint({ amount }: { amount: string }) {
        internalMint(this, BigInt(amount));
    }

    //Burn token
    // @call({ privateFunction: true })
    // ft_burn({ amount, memo }: { amount: string; memo?: string }) {
    //     internalBurn(this, BigInt(amount), memo);
    // }

    //Total supply
    @view({})
    ft_total_supply() {
        return this.totalSupply;
    }

    //Balance of an account
    @view({})
    ft_balance_of({ account_id }: { account_id: string }): string {
        return internalGetBalance(this, account_id);
    }

    //Token metadata
    @view({})
    ft_metadata() {
        return this.tokenMetadata;
    }

    //Near rate
    @view({})
    ft_rate(): string {
        return this.rate.toString();
    }

    //Update near rate
    @call({ privateFunction: true })
    ft_update_rate({ rate }: { rate: string }) {
        internalUpdateRate(this, rate);
    }
}
