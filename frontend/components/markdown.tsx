import ReactMarkdown from "react-markdown";

export function Markdown({children}: { children: string}){
    return(
        <ReactMarkdown
            components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
            ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            h1: ({ children }) => <h3 className="mb-2 text-lg font-semibold">{children}</h3>,
            h2: ({ children }) => <h3 className="mb-2 text-lg font-semibold">{children}</h3>,
            h3: ({ children }) => <h4 className="mb-1 font-semibold">{children}</h4>,
            a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline">{children}</a>
            ),
        }}
        >
        {children}
        </ReactMarkdown>
    )
}