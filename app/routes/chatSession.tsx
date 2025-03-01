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
      <div className="flex-1 overflow-hidden @container/thread">
        <div className="h-full">
          <div
            className="h-full overflow-auto"
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
                                <ReactMarkdown>{message.content}</ReactMarkdown>
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
                            <div className="flex h-8 w-8 items-center pb-1 justify-center overflow-hidden rounded-full bg-[#212121] text-white font-bold text-md border border-gray-600 dark:border-[#505050]">
                              IA
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
