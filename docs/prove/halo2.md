> Refer to the [Halo2 circuit in `anonklub/anonklub` repository](https://github.com/anonklub/anonklub/tree/main/pkgs/halo2-eth-membership)

> Requirements
>
> - [ ] Install [@anonklub/halo2-binary-merkle-tree-worker](https://www.npmjs.com/package/@anonklub/halo2-binary-merkle-tree-worker), a web worker that includes the WebAssembly compilation of a [binary merkle tree rust implmentation with a Halo2 gadget for merkle proof verification](https://github.com/anonklub/anonklub/tree/main/pkgs/halo2-binary-merkle-tree).
> - [ ] Install [@anonklub/halo2-eth-membership-worker](https://www.npmjs.com/package/@anonklub/halo2-eth-membership-worker), a web worker that contains the WebAssembly compilation of the [Halo2 circuit](https://github.com/anonklub/anonklub/tree/main/pkgs/halo2-eth-membership).

## TLDR

```js
// React.js / Next.js example
import {
    Halo2EthMembershipWorker,
    type ProveMembershipFn,
    type VerifyMembershipFn,
} from '@anonklub/halo2-eth-membership-worker'
import {
  type GenerateMerkleProofFn,
  Halo2BinaryMerkleTreeWorker,
} from '@anonklub/halo2-binary-merkle-tree-worker'
import { useEffect, useState } from 'react'

// A React hook example for dealing with web-workers; i.e. https://github.com/anonklub/anonklub/blob/main/ui/src/hooks/useWorker.ts
export const useWorker = (
  worker:typeof Halo2EthMembershipWorker,
) => {
  const [isWorkerReady, setIsWorkerReady] = useState(false)

  useEffect(() => {
    void (async () => {
      await worker.prepare()
      setIsWorkerReady(true)
    })()
  }, [])

  return isWorkerReady
}

// A React hook example for integrating with `@anonklub/halo2-binary-merkle-tree-worker`; https://github.com/anonklub/anonklub/blob/main/ui/src/hooks/useHalo2BinaryMerkleTree.ts
export const useHalo2BinaryMerkleTreeWorker = () => {
  const isWorkerReady = useWorker(Halo2BinaryMerkleTreeWorker)

  const generateMerkleProof: GenerateMerkleProofFn = async (
    leaves,
    leaf,
    depth,
  ): Promise<Uint8Array> => {
    process.env.NODE_ENV === 'development' && console.time('==>merkle')

    const proof = await Halo2BinaryMerkleTreeWorker.generateMerkleProof(
        leaves,
        leaf,
        depth,
    )

    process.env.NODE_ENV === 'development' && console.timeEnd('==>merkle')
    return proof
  }

  return {
    generateMerkleProof,
    isWorkerReady,
  }
}

// A React hook example for integrating with `@anonklub/halo2-eth-membership-worker` circuit web-worker; https://github.com/anonklub/anonklub/blob/main/ui/src/hooks/useHalo2EthMembershipWorker.ts
export const useHalo2EthMembershipWorker = () => {
  const isWorkerReady = useWorker(Halo2EthMembershipWorker)

  const proveMembership: ProveMembershipFn = async ({
    sig,
    message,
    merkleProofBytesSerialized,
  }): Promise<Uint8Array> => {
    process.env.NODE_ENV === 'development' && console.time('==> Prove')

    const proof = await Halo2EthMembershipWorker.proveMembership({
      merkleProofBytesSerialized,
      message,
      sig,
    })

    process.env.NODE_ENV === 'development' && console.timeEnd('==> Prove')

    return proof
  }

  const verifyMembership: VerifyMembershipFn = async (proof): Promise<boolean> => {
    process.env.NODE_ENV === 'development' && console.time('==> Verify')

    const isVerified = await Halo2EthMembershipWorker.verifyMembership(proof)

    process.env.NODE_ENV === 'development' && console.timeEnd('==> Verify')

    return isVerified
  }

  return {
    isWorkerReady,
    proveMembership,
    verifyMembership,
  }
}
```

## Step By Step

> The examples are based on the [AnonKlub UI implementation](https://github.com/anonklub/anonklub/tree/main/ui), which especially features:
>
> - a TypeScript alias named `@hooks`
> - global state management with an [`easy-peasy`](https://easy-peasy.dev/) store
> - description of the parameters required to generate the proof with the `ProofRequest` object from [`@anonklub/proof`](https://www.npmjs.com/package/@anonklub/proof?activeTab=code) (see also [circom/Create a Proof Request](https://anonklub.github.io/#/prove/circom?id=create-proof-request))

### Prepare

[@anonklub/halo2-binary-merkle-tree-worker](https://www.npmjs.com/package/@anonklub/halo2-binary-merkle-tree-worker) and [@anonklub/halo2-eth-membership-worker](https://www.npmjs.com/package/@anonklub/halo2-eth-membership-worker) are designed to operate on the client side. In the example above, ensure that you prepare each worker using `await worker.prepare()`. Please check [`Wasm & Web-Workers`](https://anonklub.github.io/#/prove/wasm) doc for more details.

## Merkle Proof

Generating a Merkle proof to verify the inclusion of an Ethereum address within a Merkle tree is crucial for the circuit's functionality. We use a binary Merkle tree structure, and the `@anonklub/halo2-binary-merkle-tree-worker` library provides a [gadget](https://zcash.github.io/halo2/concepts/gadgets.html) that serves as a constraint for verifying the Merkle proof within the circuit. Follow these steps to generate a Merkle proof:

1. Call the `prepare()` function as previously described.
2. Prepare the list of Ethereum. The Anonklub project can assist in building this list by querying services that serve indexed blockchain data, check out [query docs](https://anonklub.github.io/#/apis?id=query).
3. Define the parameters needed to generate the Merkle proof, including the number of `leaves` in the tree, the tree's `depth` (e.g., default: 15), and the specific `leaf` (address) for which you want to prove membership.
4. The generated proof will be serialized, making it immediately usable as a parameter for the proof function in the circuit.

```js
export type GenerateMerkleProofFn = (
  leaves: string[],
  leaf: string,
  depth: number,
) => Promise<Uint8Array>
```

## Membership Proof

Once you have generated the Merkle proof for an Ethereum address (leaf), you can proceed to create a Halo2 proof for the membership of that address in the Merkle tree. Follow these steps to generate a Halo2 membership proof:

1. Call the `prepare()` function as outlined earlier.
2. Sign a `message`and obtain the signature `sig` in hexadecimal format.
3. Pass `message`, `sig` and the previously generated merkle proof `merkleProofBytesSerialized` as parameters to [`proveMembership`](https://github.com/anonklub/anonklub/blob/6884d934f95f2c153bd9531aca36ba7a6e6d4720/pkgs/halo2-eth-membership-worker/src/worker.ts#L37)
4. The generated Halo2 membership proof is serialized in a format (`Uint8Array`) appropriate for [verification](#membership-verification) purposes.

```js
export interface ProveInputs {
  sig: Hex
  message: string
  merkleProofBytesSerialized: Uint8Array,
}
```

### Example of use

```js
import { useAsync } from 'react-use'
import type { Hex } from 'viem'
import { useHalo2EthMembershipWorker } from '@hooks/useHalo2EthMembershipWorker'
import { useStore } from '@hooks/useStore' 

export const useProofResult = () => {
  const { proofRequest } = useStore()
  const { isWorkerReady, proveMembership } = useHalo2EthMembershipWorker()

  return useAsync(async () => {
    if (proofRequest === null || !isWorkerReady) return

    return await proveMembership({
      merkleProofBytesSerialized: proofRequest.merkleProof,
      message: proofRequest.message,
      sig: proofRequest.rawSignature as Hex,
    })
  }, [isWorkerReady, proofRequest])
}
```

## Membership Verification

After successfully generating the Halo2 proof, you can proceed with verifying that proof in Halo2. Follow these steps:

- Ensure you have the `membershipProofSerialized` output from the proof of membership step.
- Pass it as argument to [`verifyMembership`](https://github.com/anonklub/anonklub/blob/6884d934f95f2c153bd9531aca36ba7a6e6d4720/pkgs/halo2-eth-membership-worker/src/worker.ts#L56)

```js
export type VerifyInputs = Uint8Array
```

### Example of use

```js
import { useHalo2EthMembershipWorker } from '@hooks/useHalo2EthMembershipWorker';
import { useAsync } from 'react-use';
import { useStore } from '@hooks/useStore';

export const useVerifyProof = () => {
  const { proof } = useStore();
  const { verifyMembership } = useHalo2EthMembershipWorker();

  return useAsync(async () => {
    if (proof === null) return;

    return await verifyMembership(proof);
  }, [proof]);
};
```

## Benchmarks

### Overview

This benchmarking process evaluates the relationship between the parameter `k` and the performance metrics such as a proof generation time, proof size, and verification time. The results are stored in a CSV file and visualized using plots.

### Setup

Before running the benchmarks, ensure that your Rust environment is set up correctly and that the appropriate target is configured.

#### Configuring the Rust Target

This benchmarking process is intended to run on a native Linux target, not on WebAssembly (WASM). The project uses a specific Rust toolchain version.

1. Set Up the Rust Toolchain:
   Ensure to use the same nightly Rust version in the `rust-toolchain`.

```rs
[toolchain]
channel = "nightly-2024-07-25"
```

2. Check the Installed Targets:
   You can check which targets are installed in your Rust toolchain with:

```bash
rustup target list --installed
```

3. Add the Required Target:
   If the `x86_64-unknown-linux-gnu` target is not installed, you can add it with:

```bash
rustup target add x86_64-unknown-linux-gnu
```

4. Run the Benchmark:
   Ensure that the benchmark is run with the correct target by using the following command:

```bash
cargo test --target x86_64-unknown-linux-gnu --features "bench"
```

### Results

The benchmark results were obtained on `Lenovo Legion 5` running Linux (12 CPU cores, 62 GB RAM) -- no GPU was used.

| k  | numAdvice | numLookupAdvice | numInstance | numLookupBits | numVirtualInstance | proof_time | proof_size | verify_time |
| -- | --------- | --------------- | ----------- | ------------- | ------------------ | ---------- | ---------- | ----------- |
| 19 | 1         | 1               | 1           | 18            | 1                  | 176.9s     | 992        | 2.3s        |
| 18 | 2         | 1               | 1           | 17            | 1                  | 171.1s     | 1504       | 7.6s        |
| 17 | 4         | 1               | 1           | 16            | 1                  | 71.7s      | 2080       | 639.7ms     |
| 16 | 8         | 2               | 1           | 15            | 1                  | 59.3s      | 3584       | 365.1ms     |
| 15 | 17        | 3               | 1           | 14            | 1                  | 51.2s      | 6592       | 267.6ms     |
| 14 | 34        | 6               | 1           | 13            | 1                  | 51.6s      | 12736      | 283.8ms     |
| 13 | 68        | 12              | 1           | 12            | 1                  | 52.5s      | 25024      | 411.5ms     |
| 12 | 139       | 24              | 1           | 11            | 1                  | 58.3s      | 50528      | 761.7ms     |
| 11 | 291       | 53              | 1           | 10            | 1                  | 72.4s      | 106304     | 1.5s        |

> Note: those benchmark config parameters have been selected based on `halo2-lib` benchmark params [github.com/axiom-crypto/halo2-lib](https://github.com/axiom-crypto/halo2-lib?tab=readme-ov-file#secp256k1-ecdsa)

Based on these benchmark results, we choose to use KZG params with `K = 14`. Here, `K` refers to the degree of the polynomial or the size of the circuit size, where \(2^K\) represents the number of constraints. For `K = 14`, this corresponds to a circuit with `16,384` constraints/rows, that offers the best trede-off between proof speed, verification time and proof size.

KZG params are the precomputed values used in the [**Kate-Zaverucha-Goldberg (KZG) polynomial commitment scheme**](https://dankradfeist.de/ethereum/2020/06/16/kate-polynomial-commitments.html), which enables efficient proof generation and verification in Halo2. The KZG parameters vary with `K` to optimize for different circuit sizes.

The benchmark results are visualized in the plot below:

![Benchmark Plot](https://github.com/anonklub/anonklub/blob/main/pkgs/halo2-eth-membership/configs/benchmark_plot.png?raw=true)

### Results using `criterion.rs`

TODO
