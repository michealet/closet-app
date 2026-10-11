"use client";

import { XIcon } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TAG_MAX, TAGS_MAX } from "@/lib/constants";
import { normalizeTag } from "./labels";

/**
 * Tags (#36): type one and press Enter, comma or Add. Each tag is a hidden
 * `tags` field; text still in the box is sent as `tagDraft`, so a tag typed
 * right before Save isn't lost.
 */
export function TagInput({
  defaultTags = [],
  suggestions = [],
}: {
  defaultTags?: string[];
  suggestions?: string[];
}) {
  const [tags, setTags] = useState(defaultTags);
  const [draft, setDraft] = useState("");

  function add(text: string) {
    const added = text.split(",").map(normalizeTag).filter(Boolean);
    setTags((current) =>
      [...new Set([...current, ...added])].slice(0, TAGS_MAX),
    );
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Enter would submit the form; on phones it's the keyboard's Done key.
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="tag-draft">Tags (optional)</Label>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Tags">
          {tags.map((tag) => (
            <li key={tag}>
              <input type="hidden" name="tags" value={tag} />
              <button
                type="button"
                onClick={() =>
                  setTags((current) => current.filter((t) => t !== tag))
                }
                aria-label={`Remove tag ${tag}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent px-3 text-sm text-accent-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {tag}
                <XIcon aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          id="tag-draft"
          name="tagDraft"
          list="tag-suggestions"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          maxLength={TAG_MAX}
          enterKeyHint="done"
          placeholder="e.g. linen, thrifted"
          disabled={tags.length >= TAGS_MAX}
        />
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => add(draft)}
        >
          Add
        </Button>
      </div>
      <datalist id="tag-suggestions">
        {suggestions
          .filter((tag) => !tags.includes(tag))
          .map((tag) => (
            <option key={tag} value={tag} />
          ))}
      </datalist>
    </div>
  );
}
