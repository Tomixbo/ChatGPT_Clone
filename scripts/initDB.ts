// scripts/initDB.ts
import { initDB } from "./data";

async function main() {
  try {
    await initDB();
    console.log("Base SQLite initialisée avec succès !");
    process.exit(0);
  } catch (err) {
    console.error("Erreur lors de l'initialisation de la base :", err);
    process.exit(1);
  }
}

main();
