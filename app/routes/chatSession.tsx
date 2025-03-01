import { useEffect, useState, useRef } from "react";
import type { Route } from "./+types/chatSession";
import { useFetcher, useSearchParams, useNavigate } from "react-router";
import { CustomChatForm } from "../components/CustomChatForm";
import ReactMarkdown from "react-markdown";
import MarkdownRenderer from "../components/MarkdownRenderer";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface SessionChat {
  id: string;
  title: string;
  createdAt: string;
  chatHistory: ChatMessage[];
}

/**
 * Loader : récupère la session de chat depuis l'API backend
 */
export async function loader({ params }: Route.LoaderArgs) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/session-chats/${params.sessionId}`
    );
    if (!response.ok) {
      throw new Response("Not Found", { status: 404 });
    }
    const sessionChat: SessionChat = await response.json();
    return { sessionChat };
  } catch (error) {
    console.error("Erreur lors du chargement de la session de chat :", error);
    throw new Response("Erreur serveur", { status: 500 });
  }
}

export async function action({ params, request }: Route.ActionArgs) {
  // Récupération du formData depuis la requête
  const formData = await request.formData();
  const content = formData.get("content");

  // Validation : le contenu ne doit pas être vide
  if (!content || typeof content !== "string" || content.trim() === "") {
    throw new Response("Contenu vide", { status: 400 });
  }

  const sessionId = params.sessionId;
  const messagePayload = {
    role: "user",
    content: content.trim(),
  };

  // Envoi de la requête PUT vers le serveur backend
  let response;
  try {
    response = await fetch(
      `http://localhost:3000/api/session-chats/${sessionId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messagePayload),
      }
    );
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("La requête a été annulée");
      // Retourner un objet indiquant que la requête a été annulée
      return { data: null };
    }
    throw error;
  }

  // Vérifie si la requête s'est bien passée
  if (!response.ok) {
    console.error(
      `Erreur lors de l'envoi du message, statut ${response.status}`
    );
    throw new Response("Erreur lors de l'envoi du message", {
      status: response.status,
    });
  }

  // Lecture de la réponse JSON du serveur
  const data = await response.json();
  // console.log("Réponse du serveur :", data);
  console.log("Le serveur a répondu");

  return data;
}

const models = [
  "llama-3.3-70b-versatile",
  "qwen-2.5-coder-32b",
  "deepseek-r1-distill-qwen-32b",
];

/**
 * Composant qui affiche une session de chat
 */
export default function ChatSession({ loaderData }: Route.ComponentProps) {
  const { sessionChat } = loaderData;
  // État pour suivre le contenu de la zone éditable
  const [messageInput, setMessageInput] = useState("");
  // État local pour l'historique des messages (optimistic update)
  const [localChatHistory, setLocalChatHistory] = useState<ChatMessage[]>(
    sessionChat.chatHistory
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fetcher = useFetcher();
  const [cancelled, setCancelled] = useState(false);

  const [isDropdownOpen, setDropdownOpen] = useState(false); // Controls dropdown visibility
  const dropdownRef = useRef<HTMLDivElement>(null); // Reference to the dropdown

  const [searchParams] = useSearchParams();
  const autoPrompt = searchParams.get("autoPrompt") || undefined;

  // Initialise selectedModel based on the query parameter or default model
  const initialSelectedModel = searchParams.get("selectedModel") || models[0];
  const [selectedModel, setSelectedModel] = useState(initialSelectedModel);

  const navigate = useNavigate();

  // If autoPrompt exists, clear the query parameters from the URL.
  useEffect(() => {
    if (autoPrompt) {
      // Remove all query parameters from the URL
      navigate(".", { replace: true });
    }
  }, [autoPrompt, navigate]);

  useEffect(() => {
    // Met à jour l’historique lorsque loaderData change (changement de session)
    setLocalChatHistory(sessionChat.chatHistory);
  }, [sessionChat.chatHistory]);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    // Add event listener when dropdown is open
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (fetcher.formData) {
      const formData = fetcher.formData;
      const content = formData.get("content")?.toString().trim();
      if (content) {
        setLocalChatHistory((prev) => [...prev, { role: "user", content }]);
        // On vide aussi le state et le textarea
        setMessageInput("");
        if (textareaRef.current) {
          textareaRef.current.value = "";
          textareaRef.current.style.height = "auto";
        }
      }
    }
  }, [fetcher.formData]);

  // Dès que fetcher.data est disponible (réponse du serveur),
  // on met à jour l'historique avec la session complète (incluant la réponse de l'assistant)
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      // Si l'annulation n'a pas été demandée, on met à jour l'historique avec la réponse du serveur
      if (!cancelled) {
        const updatedSession: SessionChat = fetcher.data;
        setLocalChatHistory(updatedSession.chatHistory);
      }
      // Réinitialisation du flag d'annulation, qu'il ait été ou non activé
      setCancelled(false);
    }
  }, [fetcher.data, fetcher.state, cancelled]);

  // Désactive le textarea et/ou le bouton quand l'action est en cours
  const isSubmitting =
    fetcher.state === "submitting" || fetcher.state === "loading";

  // Effet pour faire défiler le conteneur vers le bas à chaque mise à jour de l'historique
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [localChatHistory]);

  return (
    <div className="h-screen w-full bg-white dark:bg-[#212121] flex flex-col text-dark dark:text-white">
      {/* Header */}
      <div className="sticky top-0 p-3 mb-1.5 flex items-center justify-between z-10 h-14 font-semibold ">
        <div className="flex items-center gap-2" ref={dropdownRef}>
          {/* Dropdown for model selection */}
          <button
            aria-label="Sélecteur de modèle"
            type="button"
            onClick={() => setDropdownOpen(!isDropdownOpen)}
            className={`group flex cursor-pointer items-center gap-1 rounded-lg py-1.5 px-3 text-lg ${
              isDropdownOpen ? "bg-[#303030]" : ""
            } hover:bg-[#303030] dark:hover:bg-[#303030] font-semibold text-[#b4b4b4]`}
          >
            <span>{selectedModel}</span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="icon-md text-token-text-tertiary transition-transform duration-200"
              // style={{
              //   transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              // }}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.29289 9.29289C5.68342 8.90237 6.31658 8.90237 6.70711 9.29289L12 14.5858L17.2929 9.29289C17.6834 8.90237 18.3166 8.90237 18.7071 9.29289C19.0976 9.68342 19.0976 10.3166 18.7071 10.7071L12.7071 16.7071C12.5196 16.8946 12.2652 17 12 17C11.7348 17 11.4804 16.8946 11.2929 16.7071L5.29289 10.7071C4.90237 10.3166 4.90237 9.68342 5.29289 9.29289Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* Dropdown Options */}
          {isDropdownOpen && (
            <div className="absolute p-3 top-12 mt-3 w-72 bg-white dark:bg-[#303030] border border-gray-300 dark:border-[#505050] rounded-lg shadow-md z-50">
              <p className="text-sm text-[#b4b4b4] px-2 py-1">Modèle</p>
              {models.map((model) => (
                <button
                  key={model}
                  className={`w-full text-left px-2 py-2 rounded-lg hover:bg-[#505050] dark:hover:bg-[#505050] text-dark dark:text-white ${
                    model === selectedModel ? "font-bold" : "font-light"
                  }`}
                  onClick={() => {
                    setSelectedModel(model);
                    setDropdownOpen(false);
                  }}
                >
                  {model}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="gap-2 flex items-center pr-1">
          <button
            aria-label="Ouvrir le menu de profil"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus-visible:bg-gray-200 dark:focus-visible:bg-gray-700 focus-visible:outline-0"
          >
            <div className="flex items-center justify-center overflow-hidden rounded-full">
              <img
                alt="User"
                width="32"
                height="32"
                className="rounded-sm"
                referrerPolicy="no-referrer"
                src="https://s.gravatar.com/avatar/d598aeaf6ffb18782975dae32738df3b?s=480&amp;r=pg&amp;d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fwx.png"
              />
            </div>
          </button>
        </div>
      </div>
      {/* Section des messages */}
      <div className="flex-1 overflow-hidden ">
        <div className="h-full">
          <div
            className="h-full overflow-auto messages-container ml-4"
            style={{ scrollBehavior: "smooth" }}
            ref={messagesContainerRef}
          >
            <div className="flex flex-col text-sm md:pb-9">
              {localChatHistory.map((message, index) => {
                if (message.role === "user") {
                  return (
                    <article
                      key={index}
                      className="w-full  focus-visible:outline-2 focus-visible:outline-offset-[-4px]"
                      dir="auto"
                      data-testid={`conversation-turn-${index}`}
                    >
                      <div className="m-auto text-base py-[18px] px-3 w-full md:px-5 lg:px-4 xl:px-5">
                        <div className="mx-auto flex flex-1 gap-4 text-base md:gap-5 lg:gap-6 md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem]">
                          <div className="flex w-full flex-col gap-1 empty:hidden items-end rtl:items-start">
                            <div className="relative max-w-[var(--user-chat-width,70%)] text-[#e8e8e8] rounded-3xl bg-gray-600 dark:bg-[#303030] px-5 py-2.5  shadow-md break-words">
                              <div className="markdown font-normal">
                                {message.content}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                } else {
                  return (
                    <article
                      key={index}
                      className="w-full  focus-visible:outline-2 focus-visible:outline-offset-[-4px]"
                      dir="auto"
                      data-testid={`conversation-turn-${index}`}
                      data-scroll-anchor="false"
                    >
                      <div className="m-auto text-base py-[18px] px-3 w-full md:px-5 lg:px-4 xl:px-5">
                        <div className="mx-auto flex flex-1 gap-4 text-base md:gap-5 lg:gap-6 md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem]">
                          <div className="flex-shrink-0 flex flex-col relative items-start">
                            <div className="flex h-8 w-8  items-center justify-center overflow-hidden rounded-full bg-[#212121] text-white font-bold text-md border border-gray-600 dark:border-[#505050]">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  d="M0,12a4,4,0,0,0,1.22,2.89,4,4,0,0,0,2.84,5h.05a.43.43,0,0,0,0,.05A4,4,0,0,0,6,22.39a4,4,0,0,0,3.11.39,4,4,0,0,0,5.78,0A4,4,0,0,0,18,22.39a4.06,4.06,0,0,0,1.89-2.5A4.06,4.06,0,0,0,22.39,18a4,4,0,0,0,.39-3.11,4,4,0,0,0,0-5.78A4,4,0,0,0,22.39,6a4,4,0,0,0-2.45-1.88h-.05a.43.43,0,0,0,0-.05,4,4,0,0,0-3.89-3,3.66,3.66,0,0,0-1.1.15,4,4,0,0,0-5.78,0A3.66,3.66,0,0,0,8,1.07a4,4,0,0,0-3.89,3,.43.43,0,0,0,0,.05H4.06a4,4,0,0,0-2.84,5A4,4,0,0,0,0,12Zm7.4,2.26a3,3,0,0,1,.19.3,3.13,3.13,0,0,1,.15.32,2.94,2.94,0,0,1,.13,1.84,2.9,2.9,0,0,1-2.71,2.12h0a2.71,2.71,0,0,1-.74-.11L4,18.62v0a2.78,2.78,0,0,1-1.37-1.19A2.82,2.82,0,0,1,2.25,16c0-.13,0-.26,0-.38A3.92,3.92,0,0,0,4.05,16a4.21,4.21,0,0,0,1.42-.26v0a3.62,3.62,0,0,0,1.14-.65l.28-.28ZM8.34,12,9.41,9.41,12,8.34l2.59,1.07L15.66,12l-1.07,2.59L12,15.66,9.41,14.59Zm1.15,9.33h0a2.79,2.79,0,0,1-1.11.39l-.37,0a2.84,2.84,0,0,1-1.42-.39A2.72,2.72,0,0,1,5.4,20a3.56,3.56,0,0,0,1.72-.52,3.86,3.86,0,0,0,1.1-.94h0a3.25,3.25,0,0,0,.67-1.15h0L9,17a3.41,3.41,0,0,0,.11-.77,3.13,3.13,0,0,1,.32.15l.3.19h0a3.17,3.17,0,0,1,.77.91,2.9,2.9,0,0,1,0,2.81A2.72,2.72,0,0,1,9.49,21.33Zm5,0h0a3.19,3.19,0,0,1-.78.9,2.87,2.87,0,0,1-3.46,0,3.87,3.87,0,0,0,1.24-1.33A4,4,0,0,0,12,19.54a3.55,3.55,0,0,0,0-1.3,3.85,3.85,0,0,0-.36-1.12l.36,0,.36,0A2.85,2.85,0,0,1,14.85,20,3.06,3.06,0,0,1,14.51,21.33ZM18.6,20a2.75,2.75,0,0,1-1.19,1.36,2.84,2.84,0,0,1-1.42.39l-.37,0A3.92,3.92,0,0,0,16,20a4.15,4.15,0,0,0-.26-1.41h0a4.17,4.17,0,0,0-.67-1.15h0a4.78,4.78,0,0,0-.84-.77l.3-.19a3.13,3.13,0,0,1,.32-.15A2.45,2.45,0,0,1,16,16a2.88,2.88,0,0,1,2.8,2.8A2.74,2.74,0,0,1,18.6,20Zm2.76-2.59A2.75,2.75,0,0,1,20,18.6a3.91,3.91,0,0,0-1.47-2.82v0a3.59,3.59,0,0,0-1.14-.65h0a3.48,3.48,0,0,0-1.11-.22,3.13,3.13,0,0,1,.15-.32,3,3,0,0,1,.19-.3h0a3.17,3.17,0,0,1,.91-.77,2.84,2.84,0,0,1,2.81,0,2.72,2.72,0,0,1,1,1h0a2.79,2.79,0,0,1,.39,1.11A2.89,2.89,0,0,1,21.36,17.41Zm.88-7.14a2.87,2.87,0,0,1,0,3.46,3.87,3.87,0,0,0-1.33-1.24A4,4,0,0,0,19.54,12a2.78,2.78,0,0,0-.64-.06,3.42,3.42,0,0,0-.65.06,3.82,3.82,0,0,0-1.13.36c0-.12,0-.24,0-.36s0-.24,0-.36l0-.21c0-.08,0-.16.06-.25a2.37,2.37,0,0,1,.13-.34c0-.12.11-.21.16-.32A2.86,2.86,0,0,1,20,9.15a3.06,3.06,0,0,1,1.38.34h0A3.19,3.19,0,0,1,22.24,10.27Zm-3.4-5.11a3.07,3.07,0,0,1,.79.11l.37.11v0a2.72,2.72,0,0,1,1.36,1.19,2.89,2.89,0,0,1,.37,1.79A3.92,3.92,0,0,0,20,8a4.21,4.21,0,0,0-1.42.26v0a3.62,3.62,0,0,0-1.14.65h0a4.78,4.78,0,0,0-.77.84,3,3,0,0,1-.19-.3,3.13,3.13,0,0,1-.15-.32A2.41,2.41,0,0,1,16,8a2.27,2.27,0,0,1,.09-.68,2.9,2.9,0,0,1,2.71-2.12ZM14.51,2.67a2.8,2.8,0,0,1,2.9,0A2.78,2.78,0,0,1,18.6,4a3.91,3.91,0,0,0-1.72.52,3.86,3.86,0,0,0-1.1.94h0a3.25,3.25,0,0,0-.67,1.15h0L15,7a3.41,3.41,0,0,0-.11.77,3.13,3.13,0,0,1-.32-.15l-.3-.19h0a3,3,0,0,1-.47-.48l-.15-.19c-.06-.08-.1-.16-.15-.24a2.82,2.82,0,0,1,1-3.82Zm-5,0a3,3,0,0,1,.78-.91,2.87,2.87,0,0,1,3.46,0,3.87,3.87,0,0,0-1.24,1.33A4,4,0,0,0,12,4.46a3.55,3.55,0,0,0,0,1.3,3.85,3.85,0,0,0,.36,1.12L12,6.9l-.36,0A2.85,2.85,0,0,1,9.15,4.05,3.06,3.06,0,0,1,9.49,2.67ZM9.74,7.4l-.3.19a3.13,3.13,0,0,1-.32.15A2.41,2.41,0,0,1,8,8a2.27,2.27,0,0,1-.68-.09A2.81,2.81,0,0,1,5.55,6.53a2.77,2.77,0,0,1-.39-1.36,3.09,3.09,0,0,1,.11-.8c0-.13.07-.25.11-.37h0A2.78,2.78,0,0,1,6.59,2.63a3,3,0,0,1,1.79-.36A3.92,3.92,0,0,0,8,4.05a4.21,4.21,0,0,0,.26,1.42h0a3.62,3.62,0,0,0,.65,1.14s.34.35.34.36ZM7.4,9.74a2.54,2.54,0,0,0-.2.24,1.87,1.87,0,0,1-.71.54,2.85,2.85,0,0,1-2.81,0,2.87,2.87,0,0,1-1-1,3,3,0,0,1-.4-1.11,3,3,0,0,1,.36-1.79A2.78,2.78,0,0,1,4,5.4a3.59,3.59,0,0,0,.52,1.72,3.86,3.86,0,0,0,.94,1.1h0a3.25,3.25,0,0,0,1.15.67h0L7,9a3.41,3.41,0,0,0,.77.11,3.13,3.13,0,0,1-.15.32Zm-5.64.53a3.87,3.87,0,0,0,1.33,1.24A4,4,0,0,0,4.46,12a3.73,3.73,0,0,0,1.29,0,3.82,3.82,0,0,0,1.13-.36c0,.12,0,.24,0,.36s0,.24,0,.36a2.85,2.85,0,0,1-2.83,2.49,3.06,3.06,0,0,1-1.38-.34,3,3,0,0,1-.91-.78,2.87,2.87,0,0,1,0-3.46Z"
                                  fill="currentColor"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="group/conversation-turn relative flex w-full min-w-0 flex-col">
                            <div className="flex flex-col gap-1">
                              <div className="flex max-w-full flex-col flex-grow">
                                <div
                                  data-message-author-role="assistant"
                                  dir="auto"
                                  className="min-h-8 text-base text-[#e8e8e8] flex w-full flex-col items-start gap-2 whitespace-normal break-words text-start"
                                >
                                  <div className="relative max-w-[var(--assistant-chat-width,100%)] rounded-none px-0 py-0 ">
                                    <div className="markdown font-normal ">
                                      <MarkdownRenderer
                                        content={message.content}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Section d'envoi du message */}
      <div className="md:pt-0 dark:border-white/20 md:border-transparent md:dark:border-transparent w-full">
        <div>
          <div className="m-auto text-base px-3 md:px-5 w-full lg:px-4 xl:px-5">
            <div className="mx-auto flex flex-1 gap-4 text-base md:gap-5 lg:gap-6 md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem]">
              {/* CustomChatForm for message submission */}
              <CustomChatForm
                sessionId={sessionChat.id}
                selectedModel={selectedModel}
                onOptimisticUpdate={(message) =>
                  setLocalChatHistory((prev) => [...prev, message])
                }
                onSuccess={(updatedSession: SessionChat) =>
                  setLocalChatHistory(updatedSession.chatHistory)
                }
                autoPrompt={autoPrompt}
              />
            </div>
          </div>
          <div className="relative w-full px-2 py-2 text-center text-xs text-[#e8e8e8] empty:hidden md:px-[60px]">
            <div className="min-h-4">
              <div>
                L'IA peut faire des erreurs. Pensez à vérifier les informations
                importantes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
