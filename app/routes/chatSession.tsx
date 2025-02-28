import { useEffect, useState, useRef } from "react";
import type { Route } from "./+types/chatSession";
import { useFetcher } from "react-router";

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
  const controller = new AbortController();

  // Envoi de la requête PUT vers le serveur backend
  let response;
  try {
    response = await fetch(
      `http://localhost:3000/api/session-chats/${sessionId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messagePayload),
        signal: controller.signal,
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

  // function handleCancel() {
  //   // Arrête la soumission en cours si elle existe
  //   controller.abort();
  //   console.log("fetch aborted");
  //   // // Réinitialiser le controller pour les prochaines requêtes
  //   // controller = new AbortController();
  //   // // Vous pouvez également mettre à jour un flag local (cancelled) si nécessaire
  //   setCancelled(true);
  // }

  // Pendant la soumission, fetcher.submission est non null.
  // Dès que fetcher.formData existe, on effectue la mise à jour optimiste
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
      <div className="sticky top-0 p-3 mb-1.5 flex items-center justify-between z-10 h-14 font-semibold">
        <div className="flex items-center gap-2">
          <button
            aria-label="Sélecteur de modèle (le modèle actuel est 4o)"
            type="button"
            className="group flex cursor-pointer items-center gap-1 rounded-lg py-1.5 px-3 text-lg hover:[#303030] dark:hover:bg-[#303030] font-semibold text-[#b4b4b4]"
          >
            <span className="">
              ChatGPT <span className="text-token-text-secondary">4o</span>
            </span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="icon-md text-token-text-tertiary"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.29289 9.29289C5.68342 8.90237 6.31658 8.90237 6.70711 9.29289L12 14.5858L17.2929 9.29289C17.6834 8.90237 18.3166 8.90237 18.7071 9.29289C19.0976 9.68342 19.0976 10.3166 18.7071 10.7071L12.7071 16.7071C12.5196 16.8946 12.2652 17 12 17C11.7348 17 11.4804 16.8946 11.2929 16.7071L5.29289 10.7071C4.90237 10.3166 4.90237 9.68342 5.29289 9.29289Z"
                fill="currentColor"
              />
            </svg>
          </button>
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
                            <div className="relative max-w-[var(--user-chat-width,70%)] rounded-3xl bg-gray-600 dark:bg-[#303030] px-5 py-2.5  shadow-md">
                              <div className="whitespace-pre-wrap break-words">
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
                                  className="min-h-8 text-message flex w-full flex-col items-start gap-2 whitespace-normal break-words text-start"
                                >
                                  <div className="relative max-w-[var(--assistant-chat-width,100%)] rounded-none px-0 py-0 ">
                                    <div className="whitespace-pre-wrap">
                                      {message.content}
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
              <fetcher.Form
                method="post"
                key={sessionChat.id}
                id="message-form"
                className="w-full"
              >
                <div className="relative flex h-full max-w-full flex-1 flex-col">
                  {/* Container principal avec séparation de la zone text area et boutons */}
                  <div
                    id="composer-background"
                    className="flex w-full cursor-text flex-col rounded-3xl border border-token-border-light px-3 py-1 shadow-[0_9px_9px_0px_rgba(0,0,0,0.01),_0_2px_5px_0px_rgba(0,0,0,0.06)] contain-inline-size dark:border-none dark:shadow-none bg-main-surface-primary dark:bg-[#303030]"
                  >
                    {/* Zone de la text area */}
                    <div className="flex min-h-[44px] items-start pl-1 ">
                      <textarea
                        ref={textareaRef}
                        onInput={(e) => {
                          const ta = e.currentTarget;
                          // Réinitialise la hauteur pour recalculer le scrollHeight
                          ta.style.height = "auto";
                          // Définit la hauteur en fonction du scrollHeight (auto-resize)
                          ta.style.height = `${ta.scrollHeight - 4}px`;
                          // Met à jour l'état si nécessaire (par exemple pour changer le bouton)
                          setMessageInput(ta.value);
                        }}
                        disabled={isSubmitting}
                        placeholder="Envoyer un message à l'IA"
                        name="content"
                        className="w-full overflow-y-auto resize-none outline-none bg-transparent text-white max-h-52 pt-2"
                        id="prompt-textarea"
                        data-virtualkeyboard="true"
                      />
                    </div>

                    {/* Zone des boutons */}
                    <div className="mb-2 mt-1 flex items-center justify-end sm:mt-5">
                      {isSubmitting ? ( // Bouton en mode stop
                        <button
                          aria-label="Arrêter la diffusion"
                          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:text-[#f4f4f4] disabled:hover:opacity-100 dark:focus-visible:outline-white disabled:dark:bg-white dark:disabled:text-[#f4f4f4] bg-blue-1000 text-white dark:bg-white dark:text-black disabled:bg-[#D7D7D7]"
                          type="button"
                          onClick={() => handleCancel()}
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="icon-lg"
                          >
                            <rect
                              x="7"
                              y="7"
                              width="10"
                              height="10"
                              rx="1.25"
                              fill="currentColor"
                            ></rect>
                          </svg>
                        </button>
                      ) : messageInput.trim() === "" ? (
                        // Bouton en mode vocal
                        <button
                          type="button"
                          aria-label="Commencer le mode vocal"
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:text-[#f4f4f4] disabled:opacity-30 dark:bg-white dark:text-black dark:focus-visible:outline-white"
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M9.5 4C8.67157 4 8 4.67157 8 5.5V18.5C8 19.3284 8.67157 20 9.5 20C10.3284 20 11 19.3284 11 18.5V5.5C11 4.67157 10.3284 4 9.5 4Z"
                              fill="currentColor"
                            />
                            <path
                              d="M13 8.5C13 7.67157 13.6716 7 14.5 7C15.3284 7 16 7.67157 16 8.5V15.5C16 16.3284 15.3284 17 14.5 17C13.6716 17 13 16.3284 13 15.5V8.5Z"
                              fill="currentColor"
                            />
                            <path
                              d="M4.5 9C3.67157 9 3 9.67157 3 10.5V13.5C3 14.3284 3.67157 15 4.5 15C5.32843 15 6 14.3284 6 13.5V10.5C6 9.67157 5.32843 9 4.5 9Z"
                              fill="currentColor"
                            />
                            <path
                              d="M19.5 9C18.6716 9 18 9.67157 18 10.5V13.5C18 14.3284 18.6716 15 19.5 15C20.3284 15 21 14.3284 21 13.5V10.5C21 9.67157 20.3284 9 19.5 9Z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                      ) : (
                        // Bouton en mode envoi
                        <button
                          data-testid="send-button"
                          type="submit"
                          aria-label="Envoyer la requête"
                          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:text-[#f4f4f4] dark:focus-visible:outline-white bg-black text-white dark:bg-white dark:text-black disabled:bg-[#D7D7D7]"
                        >
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 32 32"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="icon-2xl"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M15.1918 8.90615C15.6381 8.45983 16.3618 8.45983 16.8081 8.90615L21.9509 14.049C22.3972 14.4953 22.3972 15.2189 21.9509 15.6652C21.5046 16.1116 20.781 16.1116 20.3347 15.6652L17.1428 12.4734V22.2857C17.1428 22.9169 16.6311 23.4286 15.9999 23.4286C15.3688 23.4286 14.8571 22.9169 14.8571 22.2857V12.4734L11.6652 15.6652C11.2189 16.1116 10.4953 16.1116 10.049 15.6652C9.60265 15.2189 9.60265 14.4953 10.049 14.049L15.1918 8.90615Z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </fetcher.Form>
            </div>
          </div>
          <div className="relative w-full px-2 py-2 text-center text-xs text-token-text-secondary empty:hidden md:px-[60px]">
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
