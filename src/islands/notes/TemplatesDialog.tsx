import { useEffect, useRef, useState } from "react";
import type { NoteTemplate } from "@/lib/apps-logic/notes/model";
import { BUILT_IN_TEMPLATES } from "@/lib/apps-logic/notes/model";
import {
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  labelText,
  textField,
  textareaField,
} from "@/components/react/styles";
import Icon from "@/components/react/Icon";

interface TemplatesDialogProps {
  open: boolean;
  templates: NoteTemplate[];
  onAddTemplate: (name: string, content: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onClose: () => void;
}

export function TemplatesDialog({
  open,
  templates,
  onAddTemplate,
  onDeleteTemplate,
  onClose,
}: TemplatesDialogProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close templates"
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="templates-dialog-title"
        className="border-border bg-bg-elevated relative flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-lg border p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-2">
          <h2
            id="templates-dialog-title"
            className="text-text flex items-center gap-2 text-base font-semibold"
          >
            <Icon name="layout-template" className="h-4 w-4" />
            Templates
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-text"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div>
          <h3 className="text-text-muted text-xs font-semibold tracking-wide uppercase">
            Built in
          </h3>
          <ul className="mt-2 flex flex-col gap-1">
            {BUILT_IN_TEMPLATES.map((t) => (
              <li
                key={t.name}
                className="text-text-muted flex items-center gap-2 text-sm"
              >
                <Icon name="layout-template" className="h-3.5 w-3.5" />
                {t.name}
              </li>
            ))}
          </ul>
        </div>

        {templates.length > 0 && (
          <div>
            <h3 className="text-text-muted text-xs font-semibold tracking-wide uppercase">
              Your templates
            </h3>
            <ul className="mt-2 flex flex-col gap-1">
              {templates.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-text flex items-center gap-2 truncate">
                    <Icon
                      name="layout-template"
                      className="h-3.5 w-3.5 shrink-0"
                    />
                    {t.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteTemplate(t.id)}
                    aria-label={`Delete template ${t.name}`}
                    className={buttonGhost}
                  >
                    <Icon name="trash-2" className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form
          className="border-border flex flex-col gap-2 border-t pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmedName = name.trim();
            if (!trimmedName || !content.trim()) return;
            onAddTemplate(trimmedName, content);
            setName("");
            setContent("");
          }}
        >
          <h3 className="text-text-muted text-xs font-semibold tracking-wide uppercase">
            New template
          </h3>
          <label htmlFor="template-name" className={labelText}>
            Name
          </label>
          <input
            id="template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Client call notes"
            className={textField}
          />
          <label htmlFor="template-content" className={labelText}>
            Content (Markdown)
          </label>
          <textarea
            id="template-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="# Client call&#10;&#10;**Client:** &#10;**Date:** "
            className={`${textareaField} font-mono`}
          />
          <div className="mt-1 flex justify-end gap-2">
            <button type="button" onClick={onClose} className={buttonSecondary}>
              Close
            </button>
            <button type="submit" className={buttonPrimary}>
              <Icon name="plus" className="h-4 w-4" />
              Save template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
