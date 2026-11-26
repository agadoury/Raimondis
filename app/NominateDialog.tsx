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
      className="mx-auto mt-4 mb-auto w-[calc(100%-1.5rem)] max-w-xl border border-line border-t-purple bg-surface p-0 text-white shadow-[0_0_8rem_rgb(161_0_255/0.28)] [border-top-width:2px] sm:my-auto"
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
      className="p-6 sm:p-9"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex items-center gap-4">
        <Avatar person={nominee} size="lg" />
        <h2 id="nominate-title">
          <span className="eyebrow block text-purple-pale">{t.dialogEyebrow}</span>{" "}
          <span className="mt-1 block font-serif text-3xl leading-[1.05] sm:text-4xl">{nominee.name}</span>
        </h2>
      </div>

      {existing.length > 0 && (
        <p className="mt-5 border-l-2 border-gold pl-3 text-sm text-white/80">
          <span className="eyebrow mr-2 text-gold">{t.alreadyGiven}</span>
          {existing.map((n) => n.awardName).join(" · ")}
        </p>
      )}

      <label htmlFor="award" className="eyebrow mt-7 mb-2 flex justify-between">
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

      <label htmlFor="reason" className="eyebrow mt-5 mb-2 flex justify-between">
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

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="btn btn-ghost">
          {t.cancel}
        </button>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? t.submitting : t.submit}
          <Chevron className="nudge size-3" />
        </button>
      </div>
    </form>
  );
}
