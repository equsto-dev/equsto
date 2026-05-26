import { fetchEurTryRate } from "./lib/eur-try-rate.mjs";
const r = await fetchEurTryRate();
console.log(r);
