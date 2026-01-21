import { useEffect } from "react";
import { appStateApi } from "../api/taskApi";
import type { AppState, Task } from "../common/types";

const USER_ID = "default-user";

export const useBookmarkSanitizer = (
  tasks: Task[],
  appState: AppState | null,
  setAppState: (appState: AppState | null) => void
) => {
  useEffect(() => {
    const sanitizeBookmarks = async () => {
      if (!appState || tasks.length === 0) return;

      const taskIds = new Set(tasks.map((task) => task.id));
      const currentBookmarks = appState.tasks.bookmarks;
      const validBookmarks = currentBookmarks.filter((bookmarkId) => taskIds.has(bookmarkId));

      // Only update if bookmarks have changed
      if (validBookmarks.length !== currentBookmarks.length) {
        try {
          // Update the bookmarks in the backend
          const bookmarksToRemove = currentBookmarks.filter((id) => !taskIds.has(id));

          // Remove invalid bookmarks one by one
          for (const bookmarkId of bookmarksToRemove) {
            await appStateApi.removeBookmark(appState.userId, bookmarkId);
          }

          // Fetch the updated appState
          const updatedAppState = await appStateApi.get(USER_ID);
          setAppState(updatedAppState);
        } catch (err) {
          console.error("Error sanitizing bookmarks:", err);
        }
      }
    };

    sanitizeBookmarks();
  }, [tasks, appState, setAppState]);
};
