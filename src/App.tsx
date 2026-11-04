import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { routerBasename } from "@/lib/site-base";
import Index from "./pages/Index";
import Results from "./pages/Results";

import Learn from "./pages/Learn";
import Kanji from "./pages/Kanji";
import KanjiLearn from "./pages/KanjiLearn";
import KanjiWrite from "./pages/KanjiWrite";
import KanjiRemember from "./pages/KanjiRemember";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Progress from "./pages/Progress";
import Diary from "./pages/Diary";
import DiaryEntry from "./pages/DiaryEntry";
import NotFound from "./pages/NotFound";

import { LegacyImport } from "./features/recovery/LegacyImport";
import { SessionProvider } from "./features/study/SessionContext";
import { KanjiProvider } from "./features/kanji/KanjiContext";
import { WriteProvider } from "./features/kanji-write/WriteContext";
import { RememberProvider } from "./features/kanji-remember/RememberContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={routerBasename(import.meta.env.BASE_URL)}>
        <LegacyImport />
        <SessionProvider>
          <KanjiProvider>
            <WriteProvider>
              <RememberProvider>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/conjugations" element={<Index />} />
                  <Route path="/verbs" element={<Index />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/kanji" element={<Kanji />} />
                  <Route path="/kanji/learn" element={<KanjiLearn />} />
                  <Route path="/kanji/write" element={<KanjiWrite />} />
                  <Route path="/kanji/remember" element={<KanjiRemember />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/diary" element={<Diary />} />
                  <Route path="/diary/:id" element={<DiaryEntry />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </RememberProvider>
            </WriteProvider>
          </KanjiProvider>
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
