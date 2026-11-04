import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PracticeChoices } from "@/components/PracticeChoices";
import { taglineJa } from "@/content/learner-copy";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="page-shell py-10 md:py-16 space-y-10">
        <div className="text-center space-y-3">
          <h1 className="font-sans font-extrabold text-3xl md:text-5xl">The Tiny Japanese Toolkit</h1>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Master kanji readings and verb conjugations. JLPT N5–N1, no signup,
            no fluff. <span lang="ja" className="inline-block">{taglineJa}</span>
          </p>
        </div>

        <PracticeChoices />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Landing;
