import { NearBindgen, near, call, view, LookupMap } from "near-sdk-js";

@NearBindgen({ requireInit: true })
class FTContract {
    accounts: LookupMap<bigint>;
    accountRegistrants: LookupMap<string>;
    accountDeposits: LookupMap<string>;
    totalSupply: bigint;

    @call({ payableFunction: true })
    ft_transfer({
        receiver_id,
        amount,
        memo,
    }: {
        receiver_id: string;
        amount: string;
        memo?: string;
    }) {}

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
        msg: string;
    }) {}

    @call({ payableFunction: true })
    ft_resolve_transfer({
        sender_id,
        receiver_id,
        amount,
    }: {
        sender_id: string;
        receiver_id: string;
        amount: string;
    }) {}

    @call({ privateFunction: true })
    ft_on_transfer({
        sender_id,
        amount,
        msg,
    }: {
        sender_id: string;
        amount: string;
        msg: string;
    }) {}

    @view({})
    ft_total_supply() {}

    @view({})
    ft_balance_of({ account_id }: { account_id: string }) {}
}
