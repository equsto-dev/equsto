/** TLS zincir sorunu olan ortamlarda: npm run deploy:verify:live:insecure */
process.env.EQUSTO_VERIFY_INSECURE = "1";
await import("./verify-live-images.mjs");
