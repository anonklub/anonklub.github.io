> Refer to the [Halo2 circuit in `anonklub/anonklub` repository](https://github.com/anonklub/anonklub/tree/main/pkgs)

> Requirements
>
> - [ ] Install [@anonklub/halo2-binary-merkle-tree](#), a web worker that includes the WebAssembly compilation of the Halo2 Merkle tree gadget.
> - [ ] Install [@anonklub/halo2-eth-membership-worker](#), a web worker that contains the WebAssembly compilation of the Halo2 circuit.


## TLDR

### 

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

export const useWorker = (
  worker:typeof Halo2EthMembershipWorker,
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

export const useHalo2BinaryMerkleTreeWorker = () => {
  const isWorkerReady = useWorker(Halo2BinaryMerkleTreeWorker)

  const generateMerkleProof: GenerateMerkleProofFn = async (
    leaves,
    leaf,
    depth,
  ): Promise<Uint8Array> => {
    process.env.NODE_ENV === 'development' && console.time('==>merkle')

    // eslint-disable-next-line no-useless-catch
    try {
      const proof = await Halo2BinaryMerkleTreeWorker.generateMerkleProof(
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

export const useHalo2EthMembershipWorker = () => {
  const isWorkerReady = useWorker(Halo2EthMembershipWorker)

  const proveMembership: ProveMembershipFn = async ({
    sig,
    message,
    merkleProofBytesSerialized,
    k
  }): Promise<Uint8Array> => {
    process.env.NODE_ENV === 'development' && console.time('==> Prove')

    const proof = await Halo2EthMembershipWorker.proveMembership({
      merkleProofBytesSerialized,
      message,
      sig,
      k
    })

    process.env.NODE_ENV === 'development' && console.timeEnd('==> Prove')

    return proof
  }

  const verifyMembership: VerifyMembershipFn = async ({
    membershipProofSerialized,
    k
  }): Promise<boolean> => {
    process.env.NODE_ENV === 'development' && console.time('==> Verify')

    const isVerified = await Halo2EthMembershipWorker.verifyMembership({
      membershipProofSerialized,
      k
    })

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

[@anonklub/halo2-binary-merkle-tree](#) and [@anonklub/halo2-eth-membership-worker](#) are designed to operate on the client side. In the example above, ensure that you run prepare from each worker using `await worker.prepare()`. This function initializes the WebAssembly (WASM) circuit and determines the number of available threads in the browser to initialize the thread pool:

#### `useHalo2BinaryMerkleTreeWorker.prepare()`
```js
async prepare() {
    halo2BinaryMerkleTreeWasm = await import(
        '@anonklub/halo2-binary-merkle-tree/dist/'
    )

    const wasmModuleUrl = new URL(
        '@anonklub/halo2-binary-merkle-tree/dist/index_bg.wasm',
        import.meta.url,
    )
    const response = await fetch(wasmModuleUrl)
    const bufferSource = await response.arrayBuffer()

    await halo2BinaryMerkleTreeWasm.initSync(bufferSource)
    await halo2BinaryMerkleTreeWasm.initPanicHook()
    const numThreads = navigator.hardwareConcurrency
    await halo2BinaryMerkleTreeWasm.initThreadPool(numThreads)
}
```

#### `useHalo2EthMembershipWorker.prepare()`
```js
// eslint-disable-next-line @typescript-eslint/no-misused-promises
async prepare() {
    halo2EthMembershipWasm = await import('@anonklub/halo2-eth-membership')

    const wasmModuleUrl = new URL(
        '@anonklub/halo2-eth-membership/dist/index_bg.wasm',
        import.meta.url,
    )
    const response = await fetch(wasmModuleUrl)
    const bufferSource = await response.arrayBuffer()

    await halo2EthMembershipWasm.initSync(bufferSource)
    await halo2EthMembershipWasm.initPanicHook()

    if (!initialized) {
        const numThreads = navigator.hardwareConcurrency
        await halo2EthMembershipWasm.initThreadPool(numThreads)
        initialized = true
    }
}
```

## Merkle Proof
Generating a Merkle proof to verify the inclusion of an Ethereum address within a Merkle tree is crucial for the circuit's functionality. We utilize a binary Merkle tree structure, and the @anonklub/halo2-binary-merkle-tree library provides a gadget that serves as a constraint for verifying the Merkle proof within the circuit. Follow these steps to generate a Merkle proof:

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

Once you have generated the Merkle proof for an Ethereum address (leaf), you can proceed to create a Halo2 proof for the membership of that address in the Merkle tree. Follow these steps to generate a Halo2 membership proof:

1. Call the `prepare()` function as outlined earlier.
2. Sign a `message`and obtain the `signature` in hexadecimal format.
3. Specify the polynomial degree `K` you wish to use for running the circuit (e.g., default: 15).
4. The generated Halo2 membership proof `membershipProofSerialized` is in a serialized form and it will be ready for immediate use in the `verifyMembership()` function.

```js
export interface ProveInputs {
  sig: Hex
  message: string
  merkleProofBytesSerialized: Uint8Array,
  k: number
}
```

### Example of use
```js
import { useAsync } from 'react-use'
import type { Hex } from 'viem'
import { useHalo2EthMembershipWorker } from '@/hooks/useHalo2EthMembershipWorker'
import { useStore } from '@/hooks/useStore'

export const useProofResult = () => {
  const { proofRequest } = useStore()
  const { isWorkerReady, proveMembership } = useHalo2EthMembershipWorker()

  return useAsync(async () => {
    if (proofRequest === null || !isWorkerReady) return

    return await proveMembership({
      merkleProofBytesSerialized: proofRequest.merkleProof,
      message: proofRequest.message,
      sig: proofRequest.rawSignature as Hex,
      k: 15
    })
  }, [isWorkerReady, proofRequest])
}
```

## Verify of Membership

After successfully generating the Halo2 proof, you can proceed with verifying that proof in Halo2. Follow these steps:
1. Ensure you have the `membershipProofSerialized` output from the proof of membership step.
2. Specify the polynomial degree K for running the circuit (e.g., default: 15). This must be the same degree used in the proof of membership step.
```js
export interface VerifyInputs {
  membershipProofSerialized: Uint8Array,
  k: number
}
```

### Example of use 

```js
import { useAsync } from 'react-use'
import { useStore } from '@/hooks/useStore'
import { useHalo2EthMembershipWorker } from '@/hooks/useHalo2EthMembershipWorker'

export const useVerifyProof = () => {
  const { proof } = useStore()
  const { verifyMembership } = useHalo2EthMembershipWorker()

  return useAsync(async () => {
    if (proof === null) return

    return await verifyMembership({
      membershipProofSerialized: proof,
      k: 15
    })
  }, [proof])
}
```
