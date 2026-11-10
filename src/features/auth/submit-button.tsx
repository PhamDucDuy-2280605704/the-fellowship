"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel: string;
  className?: string;
};

export function AuthSubmitButton({ children, pendingLabel, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? pendingLabel : children}
      <span aria-hidden="true">→</span>
    </button>
  );
}
