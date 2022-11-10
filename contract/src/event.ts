class FtEventLogData {
    standard: "nep141"
    version: "1.0.0"
    event: "ft_mint" | "ft_burn" | "ft_transfer"
    data: FtMintLog[] | FtBurnLog [] | FtTransferLog[]
}

class FtMintLog {
    owner_id: string
    amount: string
    memo?: string
}

class FtBurnLog {
    owner_id: string
    amount: string
    memo?: string
}

class FtTransferLog {
    old_owner_id: string
    new_owner_id: string
    amount: string
    memo?: string
}