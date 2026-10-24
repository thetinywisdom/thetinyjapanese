import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, NotebookPen } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  createEntry,
  deleteEntry,
  formatJapaneseDate,
  loadEntries,
  saveEntry,
  subscribeDiary,
  type DiaryEntry,
} from "@/features/diary/storage";

const Diary = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    setEntries(loadEntries());
    return subscribeDiary(() => setEntries(loadEntries()));
  }, []);

  const startNew = () => {
    const entry = createEntry();
    saveEntry(entry);
    navigate(`/diary/${entry.id}`);
  };

  const remove = (id: string) => {
    deleteEntry(id);
    setEntries(loadEntries());
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center py-6">
          <h1 className="font-serif text-3xl md:text-4xl mb-2">Diary</h1>
          <p className="text-sm text-muted-foreground">
            Illustrate your day, practice your sentences.<br />
            Traditional Japanese picture diary (絵日記) with Furigana support.
          </p>
        </div>

        <div className="flex justify-center">
          <Button onClick={startNew} className="gap-1">
            <Plus className="h-4 w-4" /> New entry
          </Button>
        </div>

        {entries.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            <NotebookPen className="h-5 w-5 mx-auto mb-2 opacity-60" />
            No entries yet. Your diary is saved on this device only.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {entries.map((e) => (
              <li
                key={e.id}
                className="group relative rounded-xl border bg-card shadow-card overflow-hidden"
              >
                <Link to={`/diary/${e.id}`} className="block">
                  <div className="aspect-[4/3] bg-diary-paper">
                    {e.drawing ? (
                      <img
                        src={e.drawing}
                        alt={`Drawing from ${e.dateISO}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No drawing yet
                      </span>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="font-jp text-sm" lang="ja">
                      {formatJapaneseDate(e.dateISO)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate" lang="ja">
                      {e.text.trim() || "…"}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  aria-label="Delete entry"
                  onClick={() => remove(e.id)}
                  className="absolute top-2 right-2 rounded-md bg-background/80 p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Diary;
