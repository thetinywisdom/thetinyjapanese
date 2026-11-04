import { RememberProvider } from "@/features/kanji-remember/RememberContext";
import KanjiRemember from "@/pages/KanjiRemember";

export default function RememberRoute() {
  return (
    <RememberProvider>
      <KanjiRemember />
    </RememberProvider>
  );
}
