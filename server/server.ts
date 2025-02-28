// server/server.ts
import express from "express";
import type { Request, Response, NextFunction  } from "express";
import cors from "cors";
import {
  initDB,
  getSessionChats,
  getSessionChat,
  createSessionChat,
  updateSessionChat,
  deleteSessionChat,
} from "../scripts/data.js"; // ou "./data.ts" si vous compilez en TS
import type { ChatMessage, SessionChat } from "../scripts/data.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// --- Endpoint : GET all session chats ---
app.get("/api/session-chats", async (req: Request, res: Response) => {
  try {
    const sessions = await getSessionChats();
    res.json(sessions);
  } catch (error: any) {
    console.error("Erreur dans GET /api/session-chats :", error);
    res.status(500).json({ error: error.message });
  }
});

// --- Endpoint : GET session chat by id ---
app.get("/api/session-chats/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const session = await getSessionChat(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Session introuvable" });
      return;
    }
    res.json(session);
  } catch (error: any) {
    console.error(`Erreur dans GET /api/session-chats/${req.params.id} :`, error);
    res.status(500).json({ error: error.message });
  }
});

// --- Endpoint : POST new session chat ---
app.post("/api/session-chats", async (req: Request, res: Response) => {
  try {
    const newSession = await createSessionChat(req.body);
    res.status(201).json(newSession);
  } catch (error: any) {
    console.error("Erreur dans POST /api/session-chats :", error);
    res.status(500).json({ error: error.message });
  }
});

// --- Définition de l'interface du body pour le PUT ---
interface UpdateMessageRequest {
  role: string;
  content: string;
}

// --- Endpoint : PUT update session chat ---
// Handler PUT modifié
const updateHandler: express.RequestHandler<
  { id: string },  // paramètres de route
  any,             // type de la réponse
  UpdateMessageRequest  // type du body de la requête
> = async (req, res, next: NextFunction) => {
  console.log(
    `Requête PUT reçue pour la session ${req.params.id} avec payload:`,
    req.body
  );
  try {
    const { role, content } = req.body;
    if (!role || !content) {
      console.error("Payload invalide, rôle ou contenu manquant.");
      res.status(400).json({ error: "Le message doit contenir un rôle et un contenu" });
      return;
    }

    // Récupérer la session existante
    const session: SessionChat | null = await getSessionChat(req.params.id);
    if (!session) {
      console.error(`Session introuvable pour l'id ${req.params.id}`);
      res.status(404).json({ error: "Session introuvable" });
      return;
    }

    // 1. Ajout du message de l'utilisateur
    const userMessage: ChatMessage = { role, content };
    let updatedChatHistory = [...session.chatHistory, userMessage];
    console.log(`Ajout du message utilisateur dans la session ${req.params.id}:`, userMessage);
    
    // Mise à jour de la session avec le message de l'utilisateur
    await updateSessionChat(req.params.id, { chatHistory: updatedChatHistory });

    // 2. Génération et ajout de la réponse de l'assistant
    // Simuler un délai de 2 secondes
    await new Promise(resolve => setTimeout(resolve, 5000));
    // Pour l'instant, la réponse est simplement le même message en majuscules.
    const assistantMessage: ChatMessage = { role: "assistant", content: content.toUpperCase() };
    console.log(`Génération de la réponse de l'assistant:`, assistantMessage);
    
    updatedChatHistory = [...updatedChatHistory, assistantMessage];

    // Mise à jour finale de la session avec la réponse de l'assistant
    const finalSession = await updateSessionChat(req.params.id, { chatHistory: updatedChatHistory });
    console.log(`Session finale mise à jour pour l'id ${req.params.id}:`, finalSession);

    // Envoi de la session finale au client
    res.json(finalSession);
  } catch (error) {
    console.error("Erreur dans PUT /api/session-chats/:id :", error);
    res.status(500).json({ error: (error as Error).message });
  }
};

app.put("/api/session-chats/:id", updateHandler);

// --- Endpoint : DELETE session chat ---
app.delete("/api/session-chats/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    await deleteSessionChat(req.params.id);
    res.json({ message: "Session supprimée avec succès" });
  } catch (error: any) {
    console.error(`Erreur dans DELETE /api/session-chats/${req.params.id} :`, error);
    res.status(500).json({ error: error.message });
  }
});

// Initialisation de la base de données puis démarrage du serveur
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Serveur backend démarré sur http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Erreur lors de l'initialisation de la DB :", error);
    process.exit(1);
  });
