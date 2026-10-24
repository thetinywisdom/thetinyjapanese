import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PracticeChoices } from "@/components/PracticeChoices";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-4 py-10 md:py-16 space-y-10">
        <div className="text-center space-y-3">
          <h1 className="font-sans font-extrabold text-3xl">The Tiny Japanese Toolkit</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
            Master kanji readings and verb conjugations. JLPT N5–N1, no signup,
            no fluff. 日本語が上手になりましょう！
          </p>
        </div>

        <PracticeChoices />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Landing;
