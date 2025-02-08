# Contracts

## PoseidonDeposit

This contract is used to deposit and withdraw ETH using ZK posiedon proofs.
When a user wants to send ETH to another user through Century Pay 2025, but the recipient hasn't connected to a wallet yet, then the smart contract will help store the ETH. The `deposit` function takes the recipient's discord ID poseidon hash as the input, and save the amount of ETH in the mapping.

```sh
deposit(poseidon(recipient_discord_id))
```

In this way, other users won't know the pre-image of the poseidon hash, and the recipient's discord ID is not exposed. So other people cannot fake the recipient's discord ID to withdraw the ETH.

Once the real recipient connects to a wallet, the smart contract will help the user withdraw the ETH. When the recipient calls the `withdraw` function with a ZK proof that proves the hash of the recipient's discord ID, the smart contract will check the proof and send the ETH to the recipient.

```sh
withdraw(recipient_address, zk_proof_of_poseidon_hash)
```

### Deployment

The contracts have already been deployed on testnet through Remix.

-   base-sepolia:
    -   PoseidonVerifier: [0xebf308dda3bf1c88b2f23f51353af2a9f3831eec](https://sepolia.basescan.org/address/0xebf308dda3bf1c88b2f23f51353af2a9f3831eec#code)
    -   PoseidonDeposit: [0x7bf3ee9a6e4a7172d5916cdb8e501346262b3d78](https://sepolia.basescan.org/address/0x7bf3ee9a6e4a7172d5916cdb8e501346262b3d78#code)
