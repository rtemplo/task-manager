import type React from "react";
import styles from "./Loader.module.css";

export const Loader: React.FC = () => {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.spinnerContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading...</p>
      </div>
    </div>
  );
};
