import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DocumentMeta } from "@/components/DocumentMeta";
import { routerBasename } from "@/lib/site-base";
import { LegacyImport } from "./features/recovery/LegacyImport";

const Landing = lazy(() => import("./pages/Landing"));
const Learn = lazy(() => import("./pages/Learn"));
const KanjiLearn = lazy(() => import("./pages/KanjiLearn"));
const About = lazy(() => import("./pages/About"));
const Progress = lazy(() => import("./pages/Progress"));
const Diary = lazy(() => import("./pages/Diary"));
const DiaryEntry = lazy(() => import("./pages/DiaryEntry"));
const NotFound = lazy(() => import("./pages/NotFound"));
const StudyLayout = lazy(() => import("./routes/StudyLayout"));
const ConjugationsPage = lazy(() => import("./pages/Index"));
const ResultsPage = lazy(() => import("./pages/Results"));
const KanjiPage = lazy(() => import("./routes/KanjiRoute"));
const WritePage = lazy(() => import("./routes/WriteRoute"));
const RememberPage = lazy(() => import("./routes/RememberRoute"));

function Pending() {
  return (
    <div className="min-h-screen bg-background grid place-items-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

function Suspended({ page: Page }: { page: LazyExoticComponent<ComponentType> }) {
  return (
    <Suspense fallback={<Pending />}>
      <Page />
    </Suspense>
  );
}

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter basename={routerBasename(import.meta.env.BASE_URL)}>
      <DocumentMeta />
      <LegacyImport />
      <Routes>
        <Route path="/" element={<Suspended page={Landing} />} />
        <Route element={<Suspended page={StudyLayout} />}>
          <Route path="/conjugations" element={<Suspended page={ConjugationsPage} />} />
          <Route path="/verbs" element={<Suspended page={ConjugationsPage} />} />
          <Route path="/results" element={<Suspended page={ResultsPage} />} />
        </Route>
        <Route path="/learn" element={<Suspended page={Learn} />} />
        <Route path="/kanji" element={<Suspended page={KanjiPage} />} />
        <Route path="/kanji/learn" element={<Suspended page={KanjiLearn} />} />
        <Route path="/kanji/write" element={<Suspended page={WritePage} />} />
        <Route path="/kanji/remember" element={<Suspended page={RememberPage} />} />
        <Route path="/about" element={<Suspended page={About} />} />
        <Route path="/progress" element={<Suspended page={Progress} />} />
        <Route path="/diary" element={<Suspended page={Diary} />} />
        <Route path="/diary/:id" element={<Suspended page={DiaryEntry} />} />
        <Route path="*" element={<Suspended page={NotFound} />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
