import { assert, near } from "near-sdk-js";
import { FTContract } from "./contract";
import { FT, METADATA_SPEC, STANDARD_NAME } from "./enum";
import { FtMintLog, FtEventLogData, FtBurnLog } from "./event";
export function internalMint(contract: FTContract, amount: bigint) {
    assert(amount > BigInt(0), "New supply must greater than 0");
    const contractOwner = near.currentAccountId();
    const ownerSupply = contract.accounts.containsKey(contractOwner) ? contract.accounts.get(contractOwner) : BigInt(0);
    contract.accounts.set(contractOwner, ownerSupply + amount);
    contract.totalSupply += amount;

    //Logging
    const mintLog: FtMintLog[] = [
        {
            owner_id: contractOwner,
            amount: amount.toString(),
        },
    ];
    const log: FtEventLogData = {
        standard: STANDARD_NAME,
        version: METADATA_SPEC,
        event: "ft_mint",
        data: mintLog,
    };
    near.log(`EVENT_JSON:${JSON.stringify(log)}`);
}

//! Khong dung
export function internalBurn(
    contract: FTContract,
    amount: bigint,
    memo?: string
) {
    const contractOwner = near.currentAccountId();
    const ownerSupply = contract.accounts.get(contractOwner);
    assert(amount <= ownerSupply, "Can't burn more tokens than you have");
    contract.accounts.set(contractOwner, ownerSupply - amount);
    contract.totalSupply -= amount;

    //Logging
    const burnLog: FtBurnLog[] = [
        {
            owner_id: contractOwner,
            amount: amount.toString(),
            memo,
        },
    ];
    const log: FtEventLogData = {
        standard: STANDARD_NAME,
        version: METADATA_SPEC,
        event: "ft_burn",
        data: burnLog,
    };
    near.log(`EVENT_JSON:${JSON.stringify(log)}`);
}
