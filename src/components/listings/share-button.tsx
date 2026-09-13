import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { shareLink, type ShareResult } from "@/lib/listings/share";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  text: string;
  url: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
};

export function ShareButton({ title, text, url, label = "Del", className, iconOnly }: Props) {
  const [state, setState] = useState<"idle" | ShareResult>("idle");

  async function onShare() {
    const result = await shareLink({ title, text, url });
    setState(result);
    window.setTimeout(() => setState("idle"), 2200);
  }

  const copied = state === "copied";
  const failed = state === "failed";
  const shared = state === "shared";
  const caption = copied ? "Kopieret" : failed ? "Kunne ikke dele" : shared ? "Delt" : label;

  return (
    <Button
      type="button"
      variant="outline"
      size={iconOnly ? "sm" : "md"}
      onClick={() => void onShare()}
      className={cn(iconOnly ? "size-11 shrink-0 overflow-hidden px-0" : "flex-1", className)}
      aria-label={caption}
      title={copied ? "Link kopieret" : `Del ${title}`}
    >
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      {iconOnly ? null : <span>{caption}</span>}
    </Button>
  );
}
