import fs from "fs";
const t = fs.readFileSync(process.argv[2], "utf8");
const words = t.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean);
console.log(words.length);
