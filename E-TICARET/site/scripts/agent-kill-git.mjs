import { execSync } from "node:child_process";

try {
  console.log("Terminating git.exe...");
  try { execSync("taskkill /F /IM git.exe", { stdio: "inherit" }); } catch (e) {}
  
  console.log("Terminating git-remote-https.exe...");
  try { execSync("taskkill /F /IM git-remote-https.exe", { stdio: "inherit" }); } catch (e) {}
  
  console.log("Terminating ssh-agent.exe...");
  try { execSync("taskkill /F /IM ssh-agent.exe", { stdio: "inherit" }); } catch (e) {}
  
  console.log("Git processes terminated.");
} catch (err) {
  console.error("Taskkill failed:", err.message);
}
