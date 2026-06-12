import { useEffect, useState } from "react";
import styles from "./CollapsibleFeaturesList.module.css";

export const CollapsibleFeaturesList: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Auto-collapse after 10 seconds
    const timer = setTimeout(() => {
      setIsExpanded(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.toggleButton}
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Collapse features" : "Expand features"}
      >
        <span className={styles.toggleIcon}>{isExpanded ? "▼" : "▶"}</span>
        <span className={styles.toggleText}>Features</span>
      </button>
      {isExpanded && (
        <ul className={styles.details}>
          <li>
            Drag and drop tasks across different status columns or drag vertically for a custom sequence.
          </li>
          <li>From the task card context menu: edit, bookmark, or delete tasks</li>
          <li>Set search and filter options + set composite sort options</li>
          <li>Responsive layout + light and dark system scheme compatible</li>
          <li>No 3rd party libraries</li>
          <li>Fully resettable</li>
          <li>Fully componentized demonstrating custom hooks and layered contexts</li>
          <li>State persistence across sessions</li>
          <li>
            <a href="/task-manager-architecture.html" target="_blank" rel="noopener noreferrer">
              Component architecture diagram
            </a>
          </li>
        </ul>
      )}
    </div>
  );
};
