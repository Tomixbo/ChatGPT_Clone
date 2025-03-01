// MarkdownRenderer.tsx
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
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
        <button
          className={`absolute top-1 right-1 flex gap-1 items-center select-none px-2 py-1 text-xs ${
            copied
              ? "rounded bg-token-sidebar-surface-primary font-sans text-token-text-secondary dark:bg-token-main-surface-secondary"
              : "cursor-pointer"
          }`}
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

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
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
              className={`bg-[#303030] px-1 py-0.5 rounded ${className || ""}`}
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
  );
};

export default MarkdownRenderer;
