import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";

export function CustomChatInit({ selectedModel }: { selectedModel: string }) {
  const [messageInput, setMessageInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  // Auto-submit is not needed on home by default, but you can add similar logic if needed.

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed) return; // Do not submit empty messages

    setIsSubmitting(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Create a new session with the initial user message.
      const response = await fetch("http://localhost:3000/api/session-chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Nouveau clavardage",
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création de la session");
      }
      const newSession = await response.json();
      // Redirect to the new session page, passing autoPrompt and selectedModel in the URL.
      navigate(
        `/chatSession/${newSession.id}?autoPrompt=${encodeURIComponent(
          trimmed
        )}&selectedModel=${encodeURIComponent(selectedModel)}`
      );
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("La requête a été annulée");
      } else {
        console.error(error);
      }
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="w-full"
      action={`/api/session-chats`}
      method="post"
    >
      <div className="relative flex h-full max-w-full flex-1 flex-col">
        {/* Composer Background */}
        <div
          id="composer-background"
          className="flex w-full cursor-text flex-col rounded-3xl border border-token-border-light px-3 py-1 shadow-[0_9px_9px_0px_rgba(0,0,0,0.01),_0_2px_5px_0px_rgba(0,0,0,0.06)] contain-inline-size dark:border-none dark:shadow-none bg-main-surface-primary dark:bg-[#303030]"
        >
          <div className="flex min-h-[44px] items-start pl-1">
            <textarea
              ref={textareaRef}
              placeholder="Envoyer un message à l'IA"
              name="content"
              className="w-full overflow-y-auto resize-none outline-none bg-transparent text-[#e8e8e8] max-h-52 pt-2"
              onInput={(e) => {
                const ta = e.currentTarget;
                ta.style.height = "auto";
                ta.style.height = `${ta.scrollHeight - 4}px`;
                setMessageInput(ta.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
              disabled={isSubmitting}
              data-virtualkeyboard="true"
            />
          </div>
          {/* Buttons Section */}
          <div className="mb-2 mt-1 flex items-center justify-end sm:mt-5">
            {isSubmitting ? (
              <button
                type="button"
                aria-label="Arrêter la diffusion"
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:text-[#f4f4f4] disabled:hover:opacity-100 dark:focus-visible:outline-white disabled:dark:bg-white dark:disabled:text-[#f4f4f4] bg-blue-1000 text-white dark:bg-white dark:text-black disabled:bg-[#D7D7D7]"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancel();
                }}
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
                  />
                </svg>
              </button>
            ) : messageInput.trim() === "" ? (
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
              <button
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
    </form>
  );
}
