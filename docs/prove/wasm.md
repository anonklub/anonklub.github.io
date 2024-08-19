# Generating ZKP client side with wasm and web workers

In the world of Zero-Knowledge Proofs (ZKPs), client-side generation is crucial for maintaining user privacy. This approach ensures that sensitive data never leaves the user's device, aligning perfectly with the core principle of ZKPs: proving knowledge without revealing the information itself. To achieve this in web applications, we turn to two powerful technologies: [WebAssembly](https://webassembly.org/) (Wasm) and [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).

## WebAssembly: Bringing Rust to the Browser

Many ZKP frameworks are written in Rust, a language known for its performance and safety features. However, browsers can't directly execute Rust code. This is where WebAssembly comes into play. By compiling Rust code to Wasm using tools like [wasm-pack](https://rustwasm.github.io/docs/wasm-pack/), we can run these powerful ZKP libraries directly in the browser.

Wasm offers near-native performance, which is essential for the complex computations involved in ZKP generation. It runs in a sandboxed environment, adding an extra layer of security for cryptographic operations. Moreover, Wasm modules are compatible with all modern browsers, ensuring your application works across different devices and operating systems.

## Web Workers: Keeping the UI Responsive

ZKP generation can be computationally intensive, potentially freezing the user interface if run on the main thread. Web Workers solve this problem by allowing these heavy computations to run in the background. This keeps the main thread free for UI updates and user interactions, ensuring a smooth and responsive experience.

Workers also enable parallel processing, potentially speeding up ZKP generation by utilizing multiple CPU cores. They run in a separate global scope, providing isolation from the main thread – a beneficial feature for security-sensitive cryptographic computations.

## The Power of Combination

By combining Wasm and Web Workers, we create a powerful system for client-side ZKP generation. The Rust-based ZKP logic, compiled to Wasm, runs efficiently within a Web Worker. This setup allows for complex cryptographic operations to be performed entirely on the client side, without blocking the UI or sending sensitive data to a server.

This approach not only enhances privacy but also reduces network latency, as there's no need for round-trips to a server for ZKP generation. The result is a more secure, efficient, and responsive application that fully leverages the power of modern web technologies to deliver robust ZKP functionality.

---

Next, we show an opiniated way (this is what our [UI](https://github.com/anonklub/anonklub/tree/main/ui) does) of wrapping these wasm and web workers features into React hooks for convenient use in a front end application:

# First Step: Preparing the WebAssembly (Wasm) in the Browser

For both the `halo2` and `spartan` proving systems, web workers function similarly at the ABI level. To begin importing and initializing the Wasm code in the browser, you should invoke worker.prepare(). This function handles the necessary steps to load and configure the Wasm module.

## Error Reporting in the Browser

When running Wasm code in the client-side browser, it's crucial to have effective error reporting to assist in debugging. The prepare function includes a call to `init_panic_hook()`, which sets up a panic hook. This hook redirects panic messages from Rust into the browser's console, making it easier to identify and resolve issues directly within the developer tools.

This setup ensures that any runtime errors in the Rust code are clearly reported, with detailed stack traces available in the console, enhancing the debugging process during development.

## Integration with Merkle Tree Packages

The same prepare function is also available in the Merkle tree packages associated with each proving system: `@anonklub/halo2-binary-merkle-tree-worker` for the halo2 circuit and `@anonklub/merkle-tree-worker` for the spartan circuit. This ensures consistent Wasm initialization and error reporting across different components of the proving systems.

## Thread Pool Initialization in Halo2 Packages

The `halo2` packages include an additional step in their `prepare` functions that is not present in the `spartan` packages. Specifically, the `halo2` packages use [wasm-bindgen-rayon](https://github.com/RReverser/wasm-bindgen-rayon) to enable multi-threading within the WebAssembly environment.

As part of this setup, the `prepare` function checks the number of hardware threads available on the user's device via `navigator.hardwareConcurrency`. This information is then used to initialize a thread pool using `initThreadPool(numThreads)`, which allows the WebAssembly code to efficiently utilize multiple threads for parallel processing tasks.

## Implementation Details of the prepare Function

Each package has its own specific implementation of the prepare function, tailored to its particular needs:

1. Merkle Tree Web Worker (@anonklub/merkle-tree-worker):

```ts
async prepare() {
    merkleTreeWasm = await import('@anonklub/merkle-tree-wasm');
}
```

2. Spartan Circuit Web Worker (@anonklub/spartan-ecdsa-worker):

```ts
async prepare() {
    spartanEcdsaWasm = await import('@anonklub/spartan-ecdsa-wasm');
    spartanEcdsaWasm.init_panic_hook();

    if (!initialized) {
        spartanEcdsaWasm.prepare();
        initialized = true;
    }
}
```

3. Halo2 Binary Merkle Tree Web Worker (@anonklub/halo2-binary-merkle-tree-worker):

```ts
async prepare() {
    halo2BinaryMerkleTreeWasm = await import('@anonklub/halo2-binary-merkle-tree/dist/');

    const wasmModuleUrl = new URL('@anonklub/halo2-binary-merkle-tree/dist/index_bg.wasm', import.meta.url);
    const response = await fetch(wasmModuleUrl);
    const bufferSource = await response.arrayBuffer();

    await halo2BinaryMerkleTreeWasm.initSync(bufferSource);
    await halo2BinaryMerkleTreeWasm.initPanicHook();
    const numThreads = navigator.hardwareConcurrency;
    await halo2BinaryMerkleTreeWasm.initThreadPool(numThreads);
}
```

4. Halo2 Circuit Web Worker (@anonklub/halo2-eth-membership):

```ts
async prepare() {
    halo2EthMembershipWasm = await import('@anonklub/halo2-eth-membership');

    const wasmModuleUrl = new URL('@anonklub/halo2-eth-membership/dist/index_bg.wasm', import.meta.url);
    const response = await fetch(wasmModuleUrl);
    const bufferSource = await response.arrayBuffer();

    await halo2EthMembershipWasm.initSync(bufferSource);
    await halo2EthMembershipWasm.initPanicHook();

    if (!initialized) {
        const numThreads = navigator.hardwareConcurrency;
        await halo2EthMembershipWasm.initThreadPool(numThreads);
        initialized = true;
    }
}
```
