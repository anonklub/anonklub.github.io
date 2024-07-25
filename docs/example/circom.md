> Refer to the [`archive/circom` branch of the `anonklub/anonklub` repository](https://github.com/anonklub/anonklub/tree/archive/circom)

```js
import { ProofRequest } from '@anonklub/proof'
import { execSync } from 'child_process'

const tokenAddress = '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72'
const min = 3000
const ANON_SET_API = 'https://www.query.anonklub.xyz/'

const params = new URLSearchParams({ min, tokenAddress })
const addresses: string[] = await fetch(
  `${ANON_SET_API}/asset/ERC20?${params.toString()}`,
).then((res) => res.json())

// create proof request
// see https://github.com/anonklub/anonklub/tree/archive/circom/apis/prove
const PROOFS_API = 'http://locahost:3000'

const proofRequest = new ProofRequest({
  addresses,
  message,
  rawSignature,
  url: PROOFS_API,
})

// submit proof request
const jobId: string = await proofRequest.submit()

// wait a few minutes for proof to be generated

// get result (proof and public signals)
const { proof, publicSignals } = await proofRequest.getResult()
// or simply go to
// {PROOFS_API}/${jobId}/proof.json
// {PROOF_API}/proofs/{jobId}/public.json

// verify proof
// verification key is available at https://raw.githubusercontent.com/anonklub/anonklub/archive/circom/apis/prove/generated/verification_key.json
execSync(
  `snarkjs groth16 verify ./verification_key.json ./proof.json ./public.json`,
)
```
