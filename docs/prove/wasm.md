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

TODO: add code snippets about preparing web workers and hooks that are basically the same for spartan and halo2.
