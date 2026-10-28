import { describe, it, expect } from "vitest";
import { WORDS } from "@/data/words";
import { buildForms, checkAnswer, type WordLike } from "../conjugation";

const byId = (id: string) => WORDS.find((w) => w.id === id)!;

describe("native recheck: golden forms and skip lists", () => {
  it("drops nonexistent forms of かかる, なる, and 咲く", () => {
    const kakaru = byId("1207590");
    expect(kakaru.dictionary).toBe("かかる");
    const k = buildForms(kakaru).casual;
    for (const q of ["potential", "volitional", "imperative", "passive", "causative", "causative-passive"] as const) {
      expect(k[q], q).toBeUndefined();
    }
    expect(k["te-form"]).toBe("かかって");

    const naru = byId("1375610");
    const n = buildForms(naru).casual;
    expect(n.potential).toBe("なれる");
    expect(n.imperative).toBe("なれ");
    expect(n.volitional).toBe("なろう");
    expect(n.passive).toBeUndefined();
    expect(n.causative).toBeUndefined();
    expect(n["causative-passive"]).toBeUndefined();
    expect(buildForms(byId("1532910")).casual.potential).toBeUndefined();

    const saku = buildForms(byId("1297210")).casual;
    expect(saku.potential).toBeUndefined();
    expect(saku.causative).toBe("さかせる");
    expect(saku.imperative).toBe("さけ");
  });

  it("skips the listed N4 verbs without touching their twins", () => {
    const full = ["1514960", "1209650", "1545710", "1518540", "1529550", "1215810", "1006140"];
    for (const id of full) {
      const verb = byId(id);
      const f = buildForms(verb).casual;
      expect(f.potential, verb.dictionary).toBeUndefined();
      expect(f.imperative, verb.dictionary).toBeUndefined();
      expect(f.causative, verb.dictionary).toBeUndefined();
      expect(f["te-form"], verb.dictionary).toBeTruthy();
    }

    for (const id of ["1405790", "1599400", "2846390"]) {
      const verb = byId(id);
      const f = buildForms(verb).casual;
      expect(f.potential, verb.dictionary).toBeUndefined();
      expect(f.imperative, verb.dictionary).toBeTruthy();
      expect(f.causative, verb.dictionary).toBeUndefined();
    }
    expect(buildForms(byId("1405800")).casual.potential).toBe("つづけられる");
    expect(buildForms(byId("1405800")).casual.imperative).toBe("つづけろ");

    const hikaru = buildForms(byId("1272820")).casual;
    expect(hikaru.potential).toBeUndefined();
    expect(hikaru.passive).toBeUndefined();
    expect(hikaru.causative).toBe("ひからせる");
    expect(hikaru.imperative).toBe("ひかれ");

    for (const id of ["1295070", "1284430"]) {
      const verb = byId(id);
      const f = buildForms(verb).casual;
      expect(f.potential, verb.dictionary).toBeUndefined();
      expect(f.imperative, verb.dictionary).toBeUndefined();
      expect(f.causative, verb.dictionary).toBeTruthy();
    }
    expect(buildForms(byId("1198180")).casual.potential).toBe("あえる");
    expect(buildForms(byId("1198180")).casual.imperative).toBe("あえ");

    const meshi = buildForms(byId("1346370")).casual;
    expect(meshi.imperative).toBe("めしあがれ");
    expect(meshi.potential).toBe("めしあがれる");
    expect(meshi.passive).toBeUndefined();
    expect(meshi.causative).toBeUndefined();

    const ochiru = buildForms(byId("1548550")).casual;
    expect(ochiru.potential).toBeUndefined();
    expect(ochiru.imperative).toBe("おちろ");
    expect(ochiru.causative).toBe("おちさせる");
  });

  it("fully skips the sampled N3 intransitives and leaves the transitive twins", () => {
    const pairs: [string, string, string][] = [
      ["1160540", "1160570", "そだてる"],
      ["1431670", "1431680", "しずめる"],
      ["1251100", "1551530", "たてる"],
      ["1244350", "1244360", "くるしめる"],
    ];
    for (const [src, twin, reading] of pairs) {
      const verb = byId(src);
      expect(buildForms(verb).casual.potential, verb.dictionary).toBeUndefined();
      const other = byId(twin);
      expect(other.reading).toBe(reading);
      expect(buildForms(other).casual.potential ?? buildForms(other).casual.imperative, other.dictionary).toBeTruthy();
    }
    for (const id of ["1473960", "1497800", "1593100", "1469570", "1604540", "1605270", "1539080", "1558400", "1609500", "1253920"]) {
      const verb = byId(id);
      expect(buildForms(verb).casual.potential, verb.dictionary).toBeUndefined();
      expect(buildForms(verb).casual.imperative, verb.dictionary).toBeUndefined();
    }
    const kakaru = WORDS.find((w) => w.dictionary === "かかる")!;
    const riru = WORDS.find((w) => w.dictionary === "罹る")!;
    expect(kakaru.id).not.toBe(riru.id);
    expect(buildForms(riru).casual.potential).toBeUndefined();
  });

  it("restores the over-skipped potentials and the volitional uses of 残る", () => {
    expect(buildForms(byId("1587290")).casual.potential).toBe("いただける");
    expect(buildForms(byId("1305700")).casual.potential).toBe("うかがえる");
    expect(buildForms(byId("1472270")).casual.potential).toBe("はいけんできる");
    expect(buildForms(byId("1291270")).casual.potential).toBe("さしあげられる");
    expect(buildForms(byId("1587290")).casual.imperative).toBeUndefined();

    const nokoru = buildForms(byId("1304510")).casual;
    expect(nokoru.imperative).toBe("のこれ");
    expect(nokoru.volitional).toBe("のころう");
    expect(nokoru.potential).toBe("のこれる");
    expect(nokoru.causative).toBe("のこらせる");

    const nareru = buildForms(byId("1212670")).casual;
    expect(nareru.passive).toBeUndefined();
    expect(nareru.volitional).toBe("なれよう");
    expect(nareru.imperative).toBe("なれろ");
    expect(nareru.potential).toBe("なれられる");
    expect(nareru.causative).toBe("なれさせる");

    const maniau = buildForms(byId("1215260")).casual;
    expect(maniau.potential).toBe("まにあえる");
    expect(maniau.imperative).toBe("まにあえ");
    expect(maniau.causative).toBe("まにあわせる");
    expect(maniau.passive).toBeUndefined();
    expect(maniau["causative-passive"]).toBeUndefined();
  });

  it("accepts せよ as a written imperative of ordinary する", () => {
    const suru: WordLike = { reading: "する", dictionary: "する", verbClass: "irregular-suru", wordType: "verb" };
    const result = checkAnswer("せよ", suru, "imperative");
    expect(result.correct).toBe(true);
    expect(result.note).toBe("formal/written");
    const setsumei: WordLike = {
      reading: "せつめいする", dictionary: "説明する", verbClass: "irregular-suru", wordType: "verb",
    };
    expect(checkAnswer("説明せよ", setsumei, "imperative").note).toBe("formal/written");
  });
});
