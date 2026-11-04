import { WriteProvider } from "@/features/kanji-write/WriteContext";
import KanjiWrite from "@/pages/KanjiWrite";

export default function WriteRoute() {
  return (
    <WriteProvider>
      <KanjiWrite />
    </WriteProvider>
  );
}
