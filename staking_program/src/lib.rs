use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    program_pack::{IsInitialized, Pack},
    sysvar::{rent::Rent, Sysvar},
};

use spl_token::{
    state::Account as TokenAccount,
    instruction::{approve, transfer},
};

#[derive(Accounts)]
pub struct StakeNFT<'info> {
    #[account(mut)]
    nft_account: Box<AccountInfo<'info>>,
    #[account(mut)]
    staker_account: Box<AccountInfo<'info>>,
    #[account(mut)]
    reward_account: Box<AccountInfo<'info>>,
    #[account(mut)]
    token_account: Box<AccountInfo<'info>>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UnstakeNFT<'info> {
    #[account(mut)]
    nft_account: Box<AccountInfo<'info>>,
    #[account(mut)]
    staker_account: Box<AccountInfo<'info>>,
    #[account(mut)]
    reward_account: Box<AccountInfo<'info>>,
    #[account(mut)]
    token_account: Box<AccountInfo<'info>>,
}

#[derive(Accounts)]
pub struct GetStakeholders<'info> {
    #[account(signer)]
    authority: AccountInfo<'info>,
}

#[account]
pub struct NFTStake {
    pub is_initialized: bool,
    pub staker: Pubkey,
    pub lock_duration: u64,
}

impl IsInitialized for NFTStake {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

#[derive(Debug, PartialEq)]
pub enum StakingError {
    InvalidInstruction,
    AccountNotRentExempt,
    AccountNotUninitialized,
    NFTAlreadyStaked,
    NFTNotStaked,
    InvalidStaker,
    InvalidLockDuration,
    InvalidTokenOwner,
    TokenTransferFailed,
}

impl From<StakingError> for ProgramError {
    fn from(e: StakingError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

pub fn stake_nft(program_id: &Pubkey, accounts: &StakeNFT) -> ProgramResult {
    let StakeNFT {
        nft_account,
        staker_account,
        reward_account,
        token_account,
        rent,
    } = accounts;

    let rent = rent.get()?;

    // Ensure the nft_account is owned by the program
    if nft_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Ensure the staker_account is owned by the program
    if staker_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Ensure the reward_account is owned by the program
    if reward_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Ensure the token_account is owned by the program
    if token_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Check if the nft_account is already staked
    let nft_data = &mut &mut nft_account.data.borrow_mut()[..];
    let mut nft_stake = NFTStake::unpack_unchecked(nft_data)?;

    if nft_stake.is_initialized() {
        return Err(StakingError::NFTAlreadyStaked.into());
    }

    // Verify that the staker_account is the signer
    if !staker_account.is_signer {
        return Err(StakingError::InvalidStaker.into());
    }

    // Verify the lock_duration is valid (15 days or 30 days)
    if nft_stake.lock_duration != 15 && nft_stake.lock_duration != 30 {
        return Err(StakingError::InvalidLockDuration.into());
    }

    // Transfer the NFT ownership to the staker_account
    let transfer_instruction = transfer(
        nft_account.key,
        staker_account.key,
        &reward_account.key,
        &[&staker_account.key],
        1,
    )?;
    solana_program::program::invoke_signed(
        &transfer_instruction,
        &[nft_account.clone(), staker_account.clone(), reward_account.clone()],
    )?;

    // Transfer reward tokens to the staker_account
    let transfer_instruction = transfer(
        token_account.key,
        staker_account.key,
        &reward_account.key,
        &[&staker_account.key],
        1,
    )?;
    solana_program::program::invoke_signed(
        &transfer_instruction,
        &[token_account.clone(), staker_account.clone(), reward_account.clone()],
    )?;

    // Mark the nft_account as staked
    nft_stake.is_initialized = true;
    nft_stake.staker = *staker_account.key;
    nft_stake.lock_duration = nft_stake.lock_duration;

    NFTStake::pack(nft_stake, nft_data)?;

    Ok(())
}

pub fn unstake_nft(program_id: &Pubkey, accounts: &UnstakeNFT) -> ProgramResult {
    let UnstakeNFT {
        nft_account,
        staker_account,
        reward_account,
        token_account,
    } = accounts;

    // Ensure the nft_account is owned by the program
    if nft_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Ensure the staker_account is owned by the program
    if staker_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Ensure the reward_account is owned by the program
    if reward_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Ensure the token_account is owned by the program
    if token_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Check if the nft_account is staked
    let nft_data = &mut &mut nft_account.data.borrow_mut()[..];
    let mut nft_stake = NFTStake::unpack_unchecked(nft_data)?;

    if !nft_stake.is_initialized() {
        return Err(StakingError::NFTNotStaked.into());
    }

    // Verify that the staker_account is the signer and the current owner of the NFT
    if !staker_account.is_signer || nft_stake.staker != *staker_account.key {
        return Err(StakingError::InvalidStaker.into());
    }

    // Transfer the NFT ownership back to the nft_account
    let transfer_instruction = transfer(
        staker_account.key,
        nft_account.key,
        &reward_account.key,
        &[&staker_account.key],
        1,
    )?;
    solana_program::program::invoke_signed(
        &transfer_instruction,
        &[staker_account.clone(),
        nft_account.clone(),
        reward_account.clone(),
    ])?;

    // Transfer reward tokens back to the reward_account
    let transfer_instruction = transfer(
        staker_account.key,
        token_account.key,
        &reward_account.key,
        &[&staker_account.key],
        1,
    )?;
    solana_program::program::invoke_signed(
        &transfer_instruction,
        &[staker_account.clone(), token_account.clone(), reward_account.clone()],
    )?;

    // Mark the nft_account as unstaked
    nft_stake.is_initialized = false;
    nft_stake.staker = Pubkey::default();
    nft_stake.lock_duration = 0;

    NFTStake::pack(nft_stake, nft_data)?;

    Ok(())
}

pub fn get_stakeholders(program_id: &Pubkey, accounts: &GetStakeholders) -> ProgramResult {
    let GetStakeholders { authority } = accounts;

    // Ensure the authority account is owned by the program
    if authority.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Retrieve and print the stakeholders
    msg!("List of stakeholders:");
    // Iterate through stakeholders and retrieve their data

    Ok(())
}

entrypoint!(process_instruction);
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Parse the instruction data
    let instruction = match instruction_data[0] {
        0 => Instruction::StakeNFT,
        1 => Instruction::UnstakeNFT,
        2 => Instruction::GetStakeholders,
        _ => return Err(StakingError::InvalidInstruction.into()),
    };

    match instruction {
        Instruction::StakeNFT => {
            msg!("Instruction: StakeNFT");
            let accounts = StakeNFT::try_accounts(program_id, accounts)?;
            stake_nft(program_id, &accounts)?;
        }
        Instruction::UnstakeNFT => {
            msg!("Instruction: UnstakeNFT");
            let accounts = UnstakeNFT::try_accounts(program_id, accounts)?;
            unstake_nft(program_id, &accounts)?;
        }
        Instruction::GetStakeholders => {
            msg!("Instruction: GetStakeholders");
            let accounts = GetStakeholders::try_accounts(program_id, accounts)?;
            get_stakeholders(program_id, &accounts)?;
        }
    }

    Ok(())
}

