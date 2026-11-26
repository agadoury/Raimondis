"use client";

import { useEffect, useRef, useState } from "react";
import { AWARD_MAX, REASON_MAX, type Colleague, type OwnNomination } from "@/lib/shared";
import type { ErrorCode } from "@/lib/i18n";
import { submitNomination } from "./actions";
import { useLang } from "./lang";
import { Avatar, Chevron } from "./ui";

type Props = {
  nominee: Colleague | null; // null = closed
  existing: OwnNomination[]; // this voter's earlier awards for the nominee
  onClose: () => void;
  onSaved: (n: OwnNomination) => void;
};

/** A native <dialog>: focus trap, Esc to close and focus restore come for free. */
export default function NominateDialog({ nominee, existing, onClose, onSaved }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current!;
    if (nominee && !dialog.open) dialog.showModal();
    if (!nominee && dialog.open) dialog.close();
  }, [nominee]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()} // click on the backdrop
      aria-labelledby="nominate-title"
      className="mx-auto mt-4 mb-auto w-[calc(100%-1.5rem)] max-w-lg rounded-2xl border border-line bg-surface p-0 text-white shadow-2xl shadow-purple/20 sm:my-auto"
    >
      {nominee && (
        <Form key={nominee.id} nominee={nominee} existing={existing} onSaved={onSaved} onCancel={() => ref.current?.close()} />
      )}
    </dialog>
  );
}

type FormProps = Pick<Props, "existing" | "onSaved"> & { nominee: Colleague; onCancel: () => void };

function Form({ nominee, existing, onSaved, onCancel }: FormProps) {
  const { t } = useLang();
  const [award, setAward] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<ErrorCode | null>(null);
  const [pending, setPending] = useState(false);
  const awardRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  // A different example each time, stable while the dialog is open.
  const example = t.awardExamples[(nominee.name.length + existing.length) % t.awardExamples.length];

  async function submit() {
    if (pending) return;
    if (!award.trim()) {
      setError("awardRequired");
      awardRef.current?.focus();
      return;
    }
    if (!reason.trim()) {
      setError("reasonRequired");
      reasonRef.current?.focus();
      return;
    }
    setError(null);
    setPending(true);
    try {
      const result = await submitNomination({ nomineeId: nominee.id, awardName: award, reason });
      if (result.ok) return onSaved(result.nomination);
      setError(result.error);
    } catch {
      setError("generic");
    }
    setPending(false);
  }

  return (
    <form
      noValidate
      className="p-5 sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex items-center gap-3">
        <Avatar name={nominee.name} size="lg" />
        <h2 id="nominate-title" className="font-serif text-2xl leading-tight font-semibold">
          {t.dialogTitle(nominee.name)}
        </h2>
      </div>

      {existing.length > 0 && (
        <p className="mt-4 text-sm text-muted">
          <span className="text-gold">{t.alreadyGiven}:</span> {existing.map((n) => n.awardName).join(" · ")}
        </p>
      )}

      <label htmlFor="award" className="mt-5 mb-2 flex justify-between text-sm text-muted">
        {t.awardName}
        <span aria-hidden="true">{award.length}/{AWARD_MAX}</span>
      </label>
      <input
        id="award"
        ref={awardRef}
        autoFocus
        value={award}
        onChange={(e) => setAward(e.target.value)}
        onKeyDown={(e) => {
          // Enter moves on to the reason until there is something to submit.
          if (e.key === "Enter" && !reason.trim()) {
            e.preventDefault();
            reasonRef.current?.focus();
          }
        }}
        maxLength={AWARD_MAX}
        placeholder={example}
        enterKeyHint="next"
        autoComplete="off"
        className="input"
      />

      <label htmlFor="reason" className="mt-4 mb-2 flex justify-between text-sm text-muted">
        {t.reason}
        <span aria-hidden="true">{reason.length}/{REASON_MAX}</span>
      </label>
      <textarea
        id="reason"
        ref={reasonRef}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        onKeyDown={(e) => {
          // Enter submits; Shift+Enter adds a new line.
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        maxLength={REASON_MAX}
        rows={4}
        placeholder={t.reasonPlaceholder}
        enterKeyHint="send"
        className="input resize-none"
      />
      <p className="mt-2 hidden text-xs text-muted sm:block">{t.enterHint}</p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {t.errors[error]}
        </p>
      )}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="btn btn-ghost">
          {t.cancel}
        </button>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? t.submitting : t.submit}
          <Chevron className="size-3" />
        </button>
      </div>
    </form>
  );
}
