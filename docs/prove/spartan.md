> Refer to the [Spartan circuit in `anonklub/anonklub` repository](https://github.com/anonklub/anonklub/tree/main/pkgs)
> This work here is mainly based on [spartan-ecdsa](https://github.com/personaelabs/spartan-ecdsa) from Personae labs.

> Requirements
>
> - [ ] Install [@anonklub/merkle-tree-worker](https://www.npmjs.com/package/@anonklub/merkle-tree-worker), a web worker that includes the WebAssembly compilation a binary merkle .
> - [ ] Install [@anonklub/spartan-ecdsa-worker](https://www.npmjs.com/package/@anonklub/spartan-ecdsa-worker), a web worker that contains the WebAssembly compilation of the Spartan circuit.

## TLDR

### 

```js
// React.js / Next.js example
import { type ProveMembershipFn, SpartanEcdsaWorker, type VerifyMembershipFn } from '@anonklub/spartan-ecdsa-worker'
import { type GenerateMerkleProofFn, MerkleTreeWorker } from '@anonklub/merkle-tree-worker'
import { useEffect, useState } from 'react'

export const useWorker = (
  worker: typeof SpartanEcdsaWorker | typeof MerkleTreeWorker
) => {
  const [isWorkerReady, setIsWorkerReady] = useState(false)

  useEffect(() => {
    void (async () => {
      await worker.prepare()
      setIsWorkerReady(true)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return isWorkerReady
}

export const useMerkleTreeWasmWorker = () => {
  const isWorkerReady = useWorker(MerkleTreeWorker)

  const generateMerkleProof: GenerateMerkleProofFn = async (
    leaves,
    leaf,
    depth,
  ): Promise<Uint8Array> => {
    process.env.NODE_ENV === 'development' && console.time('==>merkle')

    // eslint-disable-next-line no-useless-catch
    try {
      const proof = await MerkleTreeWorker.generateMerkleProof(
        leaves,
        leaf,
        depth,
      )

      process.env.NODE_ENV === 'development' && console.timeEnd('==>merkle')
      return proof
    } catch (error) {
      throw error
    }
  }

  return {
    generateMerkleProof,
    isWorkerReady,
  }
}

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

[@anonklub/merkle-tree-worker](#) and [@anonklub/spartan-ecdsa-worker](#) are designed to operate on the client side. In the example above, ensure that you run prepare from each worker using `await worker.prepare()`. This function initializes the WebAssembly (WASM) code from the underlying rust code:

#### `MerkleTreeWorker.prepare()`

```js
async prepare() {
    merkleTreeWasm = await import('@anonklub/merkle-tree-wasm')
}
```

#### `SpartanEcdsaWorker.prepare()`

```js
async prepare() {
    spartanEcdsaWasm = await import('@anonklub/spartan-ecdsa-wasm')
    spartanEcdsaWasm.init_panic_hook()

    if (!initialized) {
        spartanEcdsaWasm.prepare()
        initialized = true
    }
}
```

## Merkle Proof

Generating a Merkle proof to verify the inclusion of an Ethereum address within a Merkle tree is crucial for the circuit's functionality. We utilize a binary Merkle tree structure, and the `@anonklub/merkle-tree-worker` library provides a gadget that serves as a constraint for verifying the Merkle proof within the circuit. Follow these steps to generate a Merkle proof:

1. Call the `prepare()` function as previously described.
2. Prepare the list of Ethereum addresses. The Anonklub project can assist in scanning the blockchain to create this list.
3. Define the parameters needed to generate the Merkle proof, including the number of `leaves` in the tree, the tree's `depth` (e.g., default: 15), and the specific `leaf` (address) for which you want to prove membership.
4. The generated proof will be serialized, making it immediately usable as a parameter for the proof function in the circuit.

```js
export type GenerateMerkleProofFn = (
  leaves: string[],
  leaf: string,
  depth: number,
) => Promise<Uint8Array>
```

## Proof of Membership

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
import { useStore } from './useStore'

export const useProofResult = () => {
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

## Verify of Membership

After successfully generating the Spartan proof, you can proceed with verifying that proof in Spartan.

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
import { useStore } from './useStore';

export const useVerifyProof = () => {
  const { proof } = useStore();
  const { verifyMembership } = useSpartanEcdsaWorker();

  return useAsync(async () => {
    if (proof === null) return;

    return await verifyMembership(proof);
  }, [proof]);
};
```
