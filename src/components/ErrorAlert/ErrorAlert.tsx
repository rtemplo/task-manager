import styles from "./ErrorAlert.module.css";

export const ErrorAlert: React.FC<{ message: string | null; closeErrorMessage: () => void }> = ({
  message,
  closeErrorMessage,
}) => {
  return (
    <div className={styles.errorBanner}>
      <span>{message}</span>
      <button type="button" onClick={closeErrorMessage}>
        ×
      </button>
    </div>
  );
};
