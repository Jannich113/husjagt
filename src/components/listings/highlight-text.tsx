import { highlightSegments } from "@/lib/listings/keywords";

export function HighlightText({ text, words }: { text: string; words: string[] }) {
  if (!text) return null;
  const parts = highlightSegments(text, words);
  return (
    <>
      {parts.map((part, i) =>
        part.hit ? (
          <mark key={`${part.text}-${i}`} className="rounded-sm bg-warn/40 text-fg">
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${i}`}>{part.text}</span>
        ),
      )}
    </>
  );
}
