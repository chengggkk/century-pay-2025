# Circuits

## Poseidon

### Compile

```sh
circom --wasm --r1cs poseidon.circom
```

### Download Ptau

```sh
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau
```

### Trusted Setup

```sh
npx snarkjs groth16 setup ./poseidon.r1cs ./powersOfTau28_hez_final_10.ptau ./poseidon_0000.zkey
npx snarkjs zkey contribute ./poseidon_0000.zkey ./poseidon_final.zkey \
      --name="Demo contribution" -e="0xdeadbeef"
```

### Generate Proof

```sh
npx snarkjs groth16 fullprove ./input.json ./poseidon_js/poseidon.wasm ./poseidon_final.zkey ./proof.json ./public.json
```

### Export Solidity

```sh
npx snarkjs zkey export solidityverifier poseidon_final.zkey PoseidonVerifier.sol
```