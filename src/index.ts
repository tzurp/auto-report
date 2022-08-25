import { BL } from "./bl";

(async function main(): Promise<void> {
    console.log("Hello auto-report!");

    await new BL().ProcessTestResults();
    
})();