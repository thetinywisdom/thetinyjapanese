import { Outlet } from "react-router-dom";
import { SessionProvider } from "@/features/study/SessionContext";

/**
 * Shared by /conjugations, /verbs, and /results so a finished session is still
 * in memory on the results page. Loaded only when one of those routes matches,
 * which keeps words.json out of the first download.
 */
export default function StudyLayout() {
  return (
    <SessionProvider>
      <Outlet />
    </SessionProvider>
  );
}
