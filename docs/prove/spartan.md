> Refer to the [Spartan circuit in `anonklub/anonklub` repository](https://github.com/anonklub/anonklub/tree/main/pkgs/spartan-ecdsa-wasm)
> This work here is mainly based on [spartan-ecdsa](https://github.com/personaelabs/spartan-ecdsa) from Personae labs.

> Requirements
>
> - [ ] Install [@anonklub/merkle-tree-worker](https://www.npmjs.com/package/@anonklub/merkle-tree-worker), a web worker that includes the WebAssembly compilation of a [binary merkle tree rust implementation](https://github.com/anonklub/anonklub/tree/main/pkgs/merkle-tree-wasm).
> - [ ] Install [@anonklub/spartan-ecdsa-worker](https://www.npmjs.com/package/@anonklub/spartan-ecdsa-worker), a web worker that contains the WebAssembly compilation of the [Spartan circuit](https://github.com/anonklub/anonklub/tree/main/pkgs/spartan-ecdsa-wasm), implemented with the [`sapir`](https://github.com/personaelabs/sapir) rust crate.

## TLDR

```js
// React.js / Next.js example
import { type ProveMembershipFn, SpartanEcdsaWorker, type VerifyMembershipFn } from '@anonklub/spartan-ecdsa-worker'
import { type GenerateMerkleProofFn, MerkleTreeWorker } from '@anonklub/merkle-tree-worker'
import { useEffect, useState } from 'react'

// A React hook example for dealing with web-workers; i.e. https://github.com/anonklub/anonklub/blob/main/ui/src/hooks/useWorker.ts
export const useWorker = (
  worker: typeof SpartanEcdsaWorker | typeof MerkleTreeWorker
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

// A React hook example for integrating with `@anonklub/merkle-tree-worker`; https://github.com/anonklub/anonklub/blob/main/ui/src/hooks/useMerkleTreeWorker.ts
export const useMerkleTreeWasmWorker = () => { 
  const isWorkerReady = useWorker(MerkleTreeWorker)

  const generateMerkleProof: GenerateMerkleProofFn = async (
    leaves,
    leaf,
    depth,
  ): Promise<Uint8Array> => {
    process.env.NODE_ENV === 'development' && console.time('==>merkle')

    const proof = await MerkleTreeWorker.generateMerkleProof(
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

// A React hook example for integrating with `@anonklub/spartan-ecdsa-worker` circuit web-worker; https://github.com/anonklub/anonklub/blob/main/ui/src/hooks/useSpartanEcdsaWorker.ts
export const useSpartanEcdsaWorker = () => {
  const isWorkerReady = useWorker(SpartanEcdsaWorker)

  const proveMembership: ProveMembershipFn = async ({
    merkleProofBytesSerialized,
    message,
    sig,
  }): Promise<Uint8Array> => {
    process.env.NODE_ENV === 'development' && console.time('==> Prove')

    const proof = await SpartanEcdsaWorker.proveMembership({
      merkleProofBytesSerialized,
      message,
      sig,
    })

    process.env.NODE_ENV === 'development' && console.timeEnd('==> Prove')

    return proof
  }

  const verifyMembership: VerifyMembershipFn = async (
    anonklubProof: Uint8Array,
  ): Promise<boolean> => {
    process.env.NODE_ENV === 'development' && console.time('==> Verify')

    const isVerified = await SpartanEcdsaWorker.verifyMembership(anonklubProof)

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

### Prepare

[@anonklub/merkle-tree-worker](https://www.npmjs.com/package/@anonklub/merkle-tree-worker) and [@anonklub/spartan-ecdsa-worker](https://www.npmjs.com/package/@anonklub/spartan-ecdsa-worker) are designed to operate on the client side. In the example above, ensure that you prepare each worker using `await worker.prepare()`. Please check [`Wasm & Web-Workers`](https://anonklub.github.io/#/prove/wasm) doc for more details.

## Merkle Proof

Generating a Merkle proof to verify the inclusion of an Ethereum address within a Merkle tree is crucial for the circuit's functionality. We use a binary Merkle tree structure `@anonklub/merkle-tree-worker` library in case of Spartan circuits. Follow these steps to generate a Merkle proof:

1. Call the `prepare()` function as previously described.
2. Prepare the list of Ethereum addresses. The Anonklub project can assist in building this list by querying services that serve indexed blockchain data, check out [query docs](https://anonklub.github.io/#/apis?id=query).
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

Once you have generated the Merkle proof for an Ethereum address (leaf), you can proceed to create a Spartan proof for the membership of that address in the Merkle tree. Follow these steps to generate a Spartan membership proof:

1. Call the `prepare()` function as outlined earlier.
2. Sign a `message`and obtain the `signature` in hexadecimal format.
3. The generated Spartan membership proof `membershipProofSerialized` is in a serialized form and it will be ready for immediate use in the `verifyMembership()` function.

```js
export interface ProveInputs {
  sig: Hex
  message: string
  merkleProofBytesSerialized: Uint8Array
}
```

### Example of use

```js
import { useAsync } from 'react-use'
import type { Hex } from 'viem'
import { useSpartanEcdsaWorker } from './useSpartanEcdsaWorker'
// useStore is a custom React hook for managing global state in the application
// using the `easy-peasy` state management library.`
//
// Hook Path: `@/hook` alias points to `src/hooks` for convenient imports.//
//
// `easy-peasy`: https://github.com/ctrlplusb/easy-peasy
// 
// For more detailed info you can refer to the full source code here:: 
// https://github.com/anonklub/anonklub/blob/main/ui/src/hooks/useStore.ts
import { useStore } from '@/hooks/useStore' 

export const useProofResult = () => {
  // proofRequest is an object that holds the parameters required to generate, 
  // that is stored in the `useStore()` hook. 
  // 
  // In the example below the params needed for generating a halo2 proof are:
  //  1. `merkleProof: Uint8Array` in a serialized version. 
  //  2. `message: string` the message to be signed.
  //  3. `rawSignature: string` the user signature on the message.
  // For more info on how to generate those params as example please refer to:
  // Source code: https://github.com/anonklub/anonklub/blob/main/ui/src/hooks/useProofRequest.ts
  // Please note that the referred example was for Halo2 but in case of Spartan remember to use
  // `@anonklub/merkle-tree-worker` modules instead of `@anonklub/halo2-binary-merkle-tree-worker` 
  // as stated here in this custom react hook example:
  // `useMerkleTreeWasmWorker`: https://github.com/anonklub/anonklub/blob/main/ui/src/hooks/useMerkleTreeWorker.ts
  // 
  // For more detailed information on proof requests,
  // refer to the @anonklub/proof documentation: https://anonklub.github.io/#/prove/circom?id=create-proof-request
  // refer to source code: https://github.com/anonklub/anonklub/blob/6884d934f95f2c153bd9531aca36ba7a6e6d4720/pkgs/proof/src/ProofRequest.ts
  const { proofRequest } = useStore()
  const { isWorkerReady, proveMembership } = useSpartanEcdsaWorker()

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

After successfully generating the Spartan proof, you can proceed with verifying that proof.

- Ensure you have the `membershipProofSerialized` output from the proof of membership step.

```js
export interface VerifyInputs {
anonklubProof: Uint8Array
}
```

### Example of use

```js
import { useAsync } from 'react-use';
import { useSpartanEcdsaWorker } from './useSpartanEcdsaWorker';
// useStore is a custom React hook for managing global state in the application
// using the `easy-peasy` state management library.`
//
// Hook Path: `@/hooks` alias points to `src/hooks` for convenient imports.//
//
// `easy-peasy`: https://github.com/ctrlplusb/easy-peasy
//
// For more detailed info you can refer to the full source code here::
// https://github.com/anonklub/anonklub/blob/main/ui/src/hooks/useStore.ts
import { useStore } from '@/hooks/useStore';

export const useVerifyProof = () => {
  const { proof } = useStore();
  const { verifyMembership } = useSpartanEcdsaWorker();

  return useAsync(async () => {
    if (proof === null) return;

    return await verifyMembership(proof);
  }, [proof]);
};
```
