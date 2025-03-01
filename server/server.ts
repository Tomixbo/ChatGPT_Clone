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
import dotenv from "dotenv";
dotenv.config();

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
  model?: string
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
    const { role, content, model } = req.body;
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

    // 2. Prepare conversation context for the LLM call
    // Choose the last 10 messages as context (you can adjust the number as needed)
    const contextMessages = updatedChatHistory.slice(-10);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not defined in environment variables");
    }

    // Ensure model is always set (default to first model if undefined)
    const selectedModel = model || "llama-3.3-70b-versatile";

    const llmResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: contextMessages, // sending conversation context instead of just the last message
        model: selectedModel,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error("Erreur lors de l'appel à l'API LLM:", errorText);
      throw new Error("Erreur lors de l'appel à l'API LLM");
    }

    const llmData = await llmResponse.json();
    const assistantContent = llmData.choices && llmData.choices.length > 0
      ? llmData.choices[0].message.content
      : "Aucune réponse générée";
    const assistantMessage: ChatMessage = { role: "assistant", content: assistantContent };
    console.log("Génération de la réponse de l'assistant:", assistantMessage);

    // Append the assistant's message
    updatedChatHistory = [...updatedChatHistory, assistantMessage];

    // Final update of the session with the full chat history
    const finalSession = await updateSessionChat(req.params.id, { chatHistory: updatedChatHistory });
    console.log(`Session finale mise à jour pour l'id ${req.params.id}:`, finalSession);

    // Send the final session to the client
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

  // Endpoint PATCH pour mettre à jour le titre d'une session de chat
app.patch("/api/session-chats/:id/title", async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    if (!title) {
      res.status(400).json({ error: "Le titre est requis" });
      return;
    }
    const session: SessionChat | null = await getSessionChat(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Session introuvable" });
      return;
    }
    const updatedSession = await updateSessionChat(req.params.id, { title });
    res.json(updatedSession);
  } catch (error: any) {
    console.error(`Erreur dans PATCH /api/session-chats/${req.params.id}/title:`, error);
    res.status(500).json({ error: error.message });
  }
});
