
import ReactMarkdown from "react-markdown";

type Props = {
  children: string;
};

export function Markdown({ children }: Props) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0">{children}</p>
        ),

        ul: ({ children }) => (
          <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">
            {children}
          </ul>
        ),

        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">
            {children}
          </ol>
        ),

        li: ({ children }) => <li>{children}</li>,

        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),

        em: ({ children }) => <em className="italic">{children}</em>,

        h1: ({ children }) => (
          <h3 className="mb-2 text-lg font-semibold">{children}</h3>
        ),

        h2: ({ children }) => (
          <h3 className="mb-2 text-lg font-semibold">{children}</h3>
        ),

        h3: ({ children }) => (
          <h4 className="mb-1 font-semibold">{children}</h4>
        ),

        blockquote: ({ children }) => (
          <blockquote className="my-3 border-l-2 border-stone-300 pl-3 text-stone-600 dark:border-stone-600 dark:text-stone-400">
            {children}
          </blockquote>
        ),

        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
          >
            {children}
          </a>
        ),

        code: ({ children, className }) => (
          <code
            className={`rounded bg-stone-100 px-1 py-0.5 text-sm dark:bg-stone-700 ${className ?? ""}`}
          >
            {children}
          </code>
        ),

        pre: ({ children }) => (
          <pre className="my-3 overflow-x-auto rounded-lg bg-stone-100 p-3 text-sm dark:bg-stone-800">
            {children}
          </pre>
        ),

        hr: () => (
          <hr className="my-4 border-stone-200 dark:border-stone-700" />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
