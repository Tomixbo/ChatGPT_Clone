// MarkdownRenderer.tsx
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownRendererProps {
  content: string;
}

interface CodeBlockProps {
  language: string;
  codeText: string;
  className?: string;
  props: any;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  language,
  codeText,
  className,
  props,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="my-4 border border-[#303030] rounded-lg overflow-hidden">
      <div className="bg-[#303030] px-3 py-1 text-sm font-mono border-b border-[#303030] text-gray-200 relative">
        <span>{language}</span>
        <div className="absolute top-1 right-1">
          <button
            className="flex gap-1 items-center select-none px-4 py-1 text-xs cursor-pointer rounded bg-token-sidebar-surface-primary font-sans text-token-text-secondary dark:bg-token-main-surface-secondary"
            aria-label={copied ? "Copié" : "Copier"}
            onClick={!copied ? handleCopy : undefined}
          >
            {copied ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon-xs"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M18.0633 5.67387C18.5196 5.98499 18.6374 6.60712 18.3262 7.06343L10.8262 18.0634C10.6585 18.3095 10.3898 18.4679 10.0934 18.4957C9.79688 18.5235 9.50345 18.4178 9.29289 18.2072L4.79289 13.7072C4.40237 13.3167 4.40237 12.6835 4.79289 12.293C5.18342 11.9025 5.81658 11.9025 6.20711 12.293L9.85368 15.9396L16.6738 5.93676C16.9849 5.48045 17.607 5.36275 18.0633 5.67387Z"
                    fill="currentColor"
                  />
                </svg>
                Copié
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon-xs"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M7 5C7 3.34315 8.34315 2 10 2H19C20.6569 2 22 3.34315 22 5V14C22 15.6569 20.6569 17 19 17H17V19C17 20.6569 15.6569 22 14 22H5C3.34315 22 2 20.6569 2 19V10C2 8.34315 3.34315 7 5 7H7V5ZM9 7H14C15.6569 7 17 8.34315 17 10V15H19C19.5523 15 20 14.5523 20 14V5C20 4.44772 19.5523 4 19 4H10C9.44772 4 9 4.44772 9 5V7ZM5 9C4.44772 9 4 9.44772 4 10V19C4 19.5523 4.44772 20 5 20H14C14.5523 20 15 19.5523 15 19V10C15 9.44772 14.5523 9 14 9H5Z"
                    fill="currentColor"
                  />
                </svg>
                Copier
              </>
            )}
          </button>
        </div>
      </div>
      <div className="bg-[#101010] text-[#e8e8e8] p-4 overflow-x-auto rounded-b">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            backgroundColor: "transparent",
            padding: 0,
            margin: 0,
          }}
          codeTagProps={{ style: { backgroundColor: "transparent" } }}
          {...props}
        >
          {codeText}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const ThinkBlock: React.FC<{ content: string }> = ({ content }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <button
        className="relative inline w-full text-start"
        onClick={() => setOpen(!open)}
      >
        <span
          className="align-middle text-token-text-primary"
          style={{ opacity: 1, willChange: "auto" }}
        >
          Raisonnement
        </span>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`icon-sm inline align-middle text-[#e8e8e8] transition-transform ${
            open ? "rotate-90" : ""
          }`}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.29289 18.7071C8.90237 18.3166 8.90237 17.6834 9.29289 17.2929L14.5858 12L9.29289 6.70711C8.90237 6.31658 8.90237 5.68342 9.29289 5.29289C9.68342 4.90237 10.3166 4.90237 10.7071 5.29289L16.7071 11.2929C16.8946 11.4804 17 11.7348 17 12C17 12.2652 16.8946 12.5196 16.7071 12.7071L10.7071 18.7071C10.3166 19.0976 9.68342 19.0976 9.29289 18.7071Z"
            fill="currentColor"
          />
        </svg>
      </button>
      {open && (
        <div
          className="relative z-0 whitespace-pre-wrap pl-4 md:pl-7"
          style={{
            opacity: 1,
            height: "auto",
            overflowY: "hidden",
            willChange: "auto",
          }}
        >
          <div className="absolute bottom-4 left-0 top-4 w-1 rounded-full bg-[#999999]"></div>
          <div
            className="relative flex h-full flex-col text-[#999999]"
            style={{ gap: "16px", margin: "12px 0" }}
          >
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Extraction du bloc <think> s'il existe
  let thinkContent = "";
  const thinkRegex = /<think>([\s\S]*?)<\/think>/i;
  const match = content.match(thinkRegex);
  if (match) {
    thinkContent = match[1].trim();
    // Supprime le bloc <think> du contenu principal
    content = content.replace(thinkRegex, "");
  }

  return (
    <div>
      {thinkContent && <ThinkBlock content={thinkContent} />}
      <ReactMarkdown
        rehypePlugins={[rehypeRaw] as any}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            if (!inline && match) {
              const language = match[1];
              const codeText = String(children).replace(/\n$/, "");
              return (
                <CodeBlock
                  language={language}
                  codeText={codeText}
                  className={className}
                  props={props}
                />
              );
            }
            return (
              <code
                className={`bg-[#303030] px-1 py-0.5 rounded ${
                  className || ""
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
