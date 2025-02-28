// scripts/seedDB.ts
import { initDB, createSessionChat } from "./data";  // chemin à adapter

async function main() {
  try {
    // 1. Initialise la DB (crée la table si nécessaire)
    await initDB();

    // 2. Crée une première session
    await createSessionChat({
      id: "test-seed-001",        // vous pouvez laisser vide pour autogénérer
      title: "Session de départ", 
      chatHistory: [
        { role: "user", content: "Bonjour, ceci est un message." },
        { role: "assistant", content: "Bonjour, en quoi puis-je vous aider ?" }
      ]
    });

    console.log("Seed terminé : Une session de chat a été ajoutée !");
    process.exit(0);
  } catch (error) {
    console.error("Erreur lors du seed de la DB :", error);
    process.exit(1);
  }
}

main();
