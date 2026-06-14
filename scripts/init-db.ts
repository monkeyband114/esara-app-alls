import { saveSettings } from "@/lib/repository";
import { settings } from "@/lib/sample-data";

async function main() {
  await saveSettings(settings);
  console.log("ESARA settings initialized.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
