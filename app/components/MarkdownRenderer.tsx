// MarkdownRenderer.tsx
import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          if (!inline && match) {
            return (
              <div className="my-4 border border-[#303030] rounded-lg overflow-hidden">
                <div className="bg-[#303030] px-3 py-1 text-sm font-mono border-b border-[#303030]">
                  {match[1]}
                </div>
                <div className="bg-[#101010] text-[#e8e8e8] p-4 overflow-x-auto rounded-b">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </div>
              </div>
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
