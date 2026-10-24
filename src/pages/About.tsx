import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-16">
        <div className="text-center py-6">
          <h1 className="font-serif text-3xl md:text-4xl mb-2">About</h1>
          <p className="text-sm text-muted-foreground">Why this tool exists.</p>
        </div>
        <article className="space-y-4 text-base leading-relaxed text-foreground">
          <p>
            Hey there, thanks for trying out this tool. I've been living in Japan for a while, but my Japanese felt stuck
            because I couldn't find a good way to actually remember vocabulary.
          </p>
          <p>
            The study method that worked best for me was simple: I had to
            answer questions with my tutor, and she would tell me what was
            right and what was wrong.
          </p>
          <p>
            But since lessons only happened once a week, it felt inefficient,
            slow, and not practical for everyday practice, so I decided to
            make this tool for myself.
          </p>
          <p>
            This tool is designed to help you remember kanji and verbs, along
            with the different forms they appear in.
          </p>
          <p>
            I learned the hard way that getting better still takes effort,
            repetition, and time, and there's really no shortcut around that.
          </p>
          <p>
            So, obviously, this tool won't make you magically good at Japanese, but I hope
            it makes the path a little easier.
          </p>
          <p>
            Lets get good at Japanese together.{" "}
            <span lang="ja">日本語が上手になりましょう！</span>
          </p>
          <p>
            Your friend,
            <br />
            Brian.
          </p>
        </article>

        <section className="space-y-4 pt-8 border-t border-border">
          <h2 className="font-serif text-2xl md:text-3xl">Acknowledgements</h2>
          <p className="text-base leading-relaxed text-foreground">
            A heartfelt thanks to the people who helped make this project
            possible:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-base text-foreground">
            <li>Danti Felicita Anjani</li>
            <li>
              Denny Al Farisi from{" "}
              <a
                href="https://instagram.com/shigotojapan_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[hsl(var(--accent))] underline underline-offset-2 hover:opacity-80"
              >
                @shigotojapan_
              </a>
            </li>
            <li>
              Muhammad Raufan Yusup from{" "}
              <a
                href="https://instagram.com/notmegapixels"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[hsl(var(--accent))] underline underline-offset-2 hover:opacity-80"
              >
                @notmegapixels
              </a>
            </li>
          </ul>
          <p className="text-base leading-relaxed text-foreground pt-2">
            This project also stands on the shoulders of these open data
            sources:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-base text-foreground">
            <li>
              <strong>JMdict</strong> — Japanese-Multilingual Dictionary by the
              Electronic Dictionary Research and Development Group (EDRDG),
              used to source verb dictionary forms, readings, and meanings.
            </li>
            <li>
              <strong>KRADFILE / KRADFILE2</strong> (EDRDG) — kanji-to-radical
              decomposition data powering the radical breakdown feature.
            </li>
            <li>
              <strong>jlpt-vocab API</strong> — JLPT N5–N1 vocabulary lists
              used to tag each verb and kanji by level.
            </li>
            <li>
              <strong>KANJIDIC2</strong> (EDRDG) — on'yomi, kun'yomi, and
              English meanings shown in the kanji breakdown.
            </li>
            <li>
              <strong>Tanaka Corpus</strong> (Tatoeba / EDRDG) — example
              sentences shown in the verb and kanji feedback panels.
            </li>
            <li>
              <strong>KanjiVG</strong> — stroke-order SVG data by Ulrich Apel,
              used for the kanji writing practice animations.
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            JMdict, KRADFILE, KANJIDIC2, and the Tanaka Corpus are the property
            of the EDRDG and are used in accordance with their licence. The
            verb, kanji, and example datasets shipped with this app are derived
            from those sources and are made available under the same{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[hsl(var(--accent))]"
            >
              Creative Commons BY-SA 4.0
            </a>{" "}
            licence.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default About;
