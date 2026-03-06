import ReactMarkdown from "react-markdown"; // Import ReactMarkdown
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"; // Import SyntaxHighlighter
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"; // Tema VS Code Dark

// Komponen Reusable untuk Render Markdown (Agar tidak duplikat)
const MarkdownRenderer = ({ content }) => (
  <div className="markdown-body text-gray-800 text-md leading-relaxed">
    <ReactMarkdown
      components={{
        // Heading: Biru, Tebal, Garis Bawah
        h3: ({ node, ...props }) => (
          <h3
            className="text-lg font-bold text-blue-800 mt-6 mb-3 border-b border-blue-200 pb-1"
            {...props}
          />
        ),
        h4: ({ node, ...props }) => (
          <h4
            className="text-md font-semibold text-gray-900 mt-4 mb-2"
            {...props}
          />
        ),
        // List: Margin-left agar bullet point terlihat
        ul: ({ node, ...props }) => (
          <ul
            className="list-disc list-outside ml-6 space-y-1 my-2"
            {...props}
          />
        ),
        ol: ({ node, ...props }) => (
          <ol
            className="list-decimal list-outside ml-6 space-y-1 my-2"
            {...props}
          />
        ),
        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
        // Teks Biasa
        p: ({ node, ...props }) => <p className="mb-3" {...props} />,
        // Blockquote (Kutipan)
        blockquote: ({ node, ...props }) => (
          <blockquote
            className="border-l-4 border-blue-400 bg-blue-50 pl-4 py-2 my-4 italic text-gray-700 rounded-r"
            {...props}
          />
        ),
        // Kode (Syntax Highlighting)
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <div className="rounded-lg overflow-hidden my-4 shadow-md border border-gray-700 bg-[#1e1e1e]">
              {/* Header Mac-OS Style */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-[#252526]">
                <span className="text-xs text-gray-400 font-mono font-bold uppercase">
                  {match[1]}
                </span>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"></div>
                </div>
              </div>
              {/* Isi Kode */}
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  padding: "1.5rem",
                  fontSize: "0.85rem",
                  lineHeight: "1.5",
                  backgroundColor: "transparent",
                }}
                {...props}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            </div>
          ) : (
            // Inline Code (Background abu-abu, teks merah)
            <code
              className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded border border-gray-200 font-mono text-xs font-semibold"
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

export default MarkdownRenderer;
