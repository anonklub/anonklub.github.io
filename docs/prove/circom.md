> Refer to the [`archive/circom` branch of the `anonklub/anonklub` repository](https://github.com/anonklub/anonklub/tree/archive/circom)

> Requirements
>
> - [ ] node >= 20, pnpm
> - [ ] snarkjs installed globally: `pnpm add -g snarkjs`
> - [ ] [install circom](https://docs.circom.io/getting-started/installation/)
> - [ ] [docker](https://docs.docker.com/get-docker/) installed in case you plan to run the proofs generation server locally

## TLDR

```js
import { ProofRequest } from '@anonklub/proof'
import { execSync } from 'node:child_process'

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

## Interactive Demo

1. Clone the `archive/circom` branch of the repository:

```shell
git clone -b archive/circom https://github.com/anonklub/anonklub
```

2. Install dependencies:

```shell
cd anonklub && pnpm i
```

3. Run the CLI:

```shell
pnpm demo
```

## Step By Step

### Create Proof Request

[`@anonklub/proof`](https://www.npmjs.com/package/@anonklub/proof) provides utilities to create proof request and submit them to a proving server.

To create proofs you'll need to supply the following parameters:

- a list of `addresses` (aka anonymity set): `string[]`
- a `message`: `string`
- the `rawSignature` produced by the address you want to prove is member of the anonymity set: `string`
- the `url` of the proof generation API: `string`
  You can either run it [locally](https://github.com/privacy-scaling-explorations/e2e-zk-ecdsa/tree/main/apis/prove) or use the hosted version at [TODO](#)

```js
import { ProofRequest } from '@anonklub/proof';

const proofRequest = new ProofRequest({
  addresses,
  message,
  rawSignature,
  url,
});
```

### Generate Proof

Once you have a proof request, you can generate a proof either locally or by relying on hosted remote proof server.

| Server | Pros                                         | Cons                                                                                                                                 |
| ------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Remote | No need to install circom or snarkjs. Faster | Users need to trust your server with their privacy                                                                                   |
| Local  | Trustless                                    | You need to install circom and snarkjs. Slower. Need to tweak system partitions to allow for more swap memory on "regular" machines. |

#### Remote

```js
const jobId = await proofRequest.submit();
```

#### Local

You'll need the circom generated files. You can either re-generate them yourself or download them from our [github repo](https://github.com/privacy-scaling-explorations/e2e-zk-ecdsa/tree/main/apis/proving/generated).

```js
import { execSync, readFileSync, writeFileSync } from 'node:fs';

const circuitInput = new CircuitInput(proofRequest);

execSync('node ./generate_witness.js ./main.wasm ./input.json ./witness.wtns');
execSync(
  'snarkjs groth16 prove ./circuit_0001.zkey ./witness.wtns ./proof.json ./public.json',
);

const proof = JSON.parse(fs.readFileSync('./proof.json', 'utf8'));
const publicSignals = JSON.parse(fs.readFileSync('./public.json', 'utf8'));
```

### Verify Proof

The verification process is much faster than the proof generation.
Therefore, you can do it yourself locally.\
You'll need the [verification_key.json](https://raw.githubusercontent.com/anonklub/anonklub/archive/circom/apis/prove/generated/verification_key.json) file available in our repository.

```js
import { execSync } from 'node:fs';

execSync('snarkjs groth16 verify verification_key.json public.json proof.json');
```

See also [`snarkjs` README](https://github.com/iden3/snarkjs?tab=readme-ov-file#using-node).
