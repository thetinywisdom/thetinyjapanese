import { KanjiProvider } from "@/features/kanji/KanjiContext";
import Kanji from "@/pages/Kanji";

export default function KanjiRoute() {
  return (
    <KanjiProvider>
      <Kanji />
    </KanjiProvider>
  );
}
