import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import styles from "./DeleteConfirmPopover.module.css";

interface DeleteConfirmPopoverProps {
  onConfirm: () => void;
  onCancel: () => void;
  anchorEl: HTMLElement | null;
  message?: string;
}

export const DeleteConfirmPopover: React.FC<DeleteConfirmPopoverProps> = ({
  onConfirm,
  onCancel,
  anchorEl,
  message = "Are you sure?",
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Capture position immediately on first render and never change it
  const initialPosition = useRef<{ top: number; left: number } | null>(null);

  if (initialPosition.current === null && anchorEl) {
    const anchorRect = anchorEl.getBoundingClientRect();
    let top = anchorRect.bottom + 8;
    let left = anchorRect.left;

    // Simple adjustment if would go off right edge
    if (left + 160 > window.innerWidth) {
      left = anchorRect.right - 160;
    }

    // Simple adjustment if would go off bottom edge
    if (top + 100 > window.innerHeight) {
      top = anchorRect.top - 100 - 8;
    }

    initialPosition.current = { top, left };
  }

  const position = initialPosition.current || { top: 0, left: 0 };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCancel]);

  useEscapeKey(onCancel);

  return createPortal(
    <div
      ref={popoverRef}
      className={styles.popover}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttons}>
          <button type="button" className={`${styles.button} ${styles.yesButton}`} onClick={onConfirm}>
            Yes
          </button>
          <button type="button" className={`${styles.button} ${styles.noButton}`} onClick={onCancel}>
            No
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
