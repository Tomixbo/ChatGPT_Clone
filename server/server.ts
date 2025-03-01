// server/server.ts
import express from "express";
import type { Request, Response, NextFunction } from "express";
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
  model?: string;
}

// --- Endpoint : PUT update session chat avec streaming ---
const updateHandler: express.RequestHandler<
  { id: string },      // paramètres de route
  any,                 // type de la réponse
  UpdateMessageRequest // type du body de la requête
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

    // 1. Récupérer la session existante et ajouter le message de l'utilisateur
    const session: SessionChat | null = await getSessionChat(req.params.id);
    if (!session) {
      console.error(`Session introuvable pour l'id ${req.params.id}`);
      res.status(404).json({ error: "Session introuvable" });
      return;
    }
    const userMessage: ChatMessage = { role, content };
    let updatedChatHistory = [...session.chatHistory, userMessage];
    console.log(`Ajout du message utilisateur dans la session ${req.params.id}:`, userMessage);
    await updateSessionChat(req.params.id, { chatHistory: updatedChatHistory });

    // 2. Préparer le contexte pour l'appel LLM : on envoie les 10 derniers messages
    const contextMessages = updatedChatHistory.slice(-10);
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not defined in environment variables");
    }
    const selectedModel = model || "llama-3.3-70b-versatile";

    // 3. Appel à l'API LLM avec streaming activé
    const llmResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: contextMessages,
        model: selectedModel,
        stream: true, // Activation du mode streaming
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error("Erreur lors de l'appel à l'API LLM:", errorText);
      res.status(500).json({ error: "Erreur lors de l'appel à l'API LLM" });
      return;
    }

    if (!llmResponse.body) {
      console.error("Le body de la réponse est nul");
      res.status(500).json({ error: "Réponse invalide de l'API LLM" });
      return;
    }

    // On configure le transfert en chunked (texte brut)
    res.setHeader("Content-Type", "text/plain");

    // 4. Lecture du flux + streaming vers le client
    //    + parsing SSE pour construire assistantContent
    const reader = llmResponse.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    let assistantContent = "";
    let buffer = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        // Chunk reçu, on l'envoie immédiatement au client
        const chunkStr = decoder.decode(value, { stream: true });
        res.write(chunkStr); // Le client recevra la même structure SSE

        // En parallèle, on parse en interne pour construire la réponse finale
        buffer += chunkStr;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) {
            continue;
          }
          const jsonPart = trimmed.slice("data: ".length);
          if (jsonPart === "[DONE]") {
            console.log("Fin du streaming SSE");
            continue;
          }
          try {
            // On parse le JSON SSE style OpenAI
            const parsed = JSON.parse(jsonPart);
            const token = parsed?.choices?.[0]?.delta?.content;
            if (token) {
              assistantContent += token;
            }
          } catch (err) {
            console.error("Erreur de parsing SSE chunk:", jsonPart, err);
          }
        }
      }
    }
    res.end();

    // 5. Mettre à jour la session avec le message final de l'assistant
    const assistantMessage: ChatMessage = { role: "assistant", content: assistantContent };
    updatedChatHistory = [...updatedChatHistory, assistantMessage];
    console.log("Réponse finale de l'assistant:", assistantMessage.content);

    await updateSessionChat(req.params.id, { chatHistory: updatedChatHistory });
  } catch (error: any) {
    console.error("Erreur dans PUT /api/session-chats/:id :", error);
    res.status(500).json({ error: error.message });
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
