import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

const MarkdownContent = ({ content }) => {
  if (!content) return null;

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table({ children, ...props }) {
            return (
              <div className="markdown-table-wrap">
                <table {...props}>{children}</table>
              </div>
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const code = String(children).replace(/\n$/, "");
            const isBlock = Boolean(match) || code.includes("\n");

            if (isBlock) {
              return (
                <SyntaxHighlighter
                  style={oneLight}
                  language={match?.[1] || "text"}
                  PreTag="div"
                  className="markdown-code-block"
                  customStyle={{
                    margin: 0,
                    borderRadius: "var(--r-sm)",
                    fontSize: "13px",
                    maxWidth: "100%",
                    width: "100%",
                    boxSizing: "border-box",
                    overflowX: "auto",
                  }}
                >
                  {code}
                </SyntaxHighlighter>
              );
            }

            return (
              <code className={`markdown-inline-code ${className || ""}`} {...props}>
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

export default MarkdownContent;
