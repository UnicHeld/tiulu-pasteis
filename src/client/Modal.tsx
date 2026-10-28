import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export function Modal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const element = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.current?.querySelector<HTMLElement>("button")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        element.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]',
        ) || [],
      );
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, []);
  return (
    <div className="overlay" onClick={onClose}>
      <section
        ref={element}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Tiulu"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="close" aria-label="Fechar" onClick={onClose}>
          <X />
        </button>
        {children}
      </section>
    </div>
  );
}
