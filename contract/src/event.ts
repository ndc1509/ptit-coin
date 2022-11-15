export class FtEventLogData {
    standard: "nep141"
    version: "ft-1.0.0"
    event: "ft_mint" | "ft_burn" | "ft_transfer"
    data: FtMintLog[] | FtBurnLog [] | FtTransferLog[]
}

export class FtMintLog {
    owner_id: string
    amount: string
    memo?: string
}

export class FtBurnLog {
    owner_id: string
    amount: string
    memo?: string
}

export class FtTransferLog {
    old_owner_id: string
    new_owner_id: string
    amount: string
    memo?: string
}