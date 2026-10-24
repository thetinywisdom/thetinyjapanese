# JLPT kanji lists

One kanji per line, sorted, one file per level (`n5.txt` … `n1.txt`).

Source: per-kanji `jlpt_new` field of
[davidluzgouveia/kanji-data](https://github.com/davidluzgouveia/kanji-data)
(`kanji.json`), which compiles the widely-cited post-2010 community JLPT kanji
classification. Counts match the canonical reference: N5 79, N4 166, N3 367,
N2 367, N1 1232 (2211 total).

Used by `scripts/build-kanji-radicals.ts` to tag each kanji in
`src/data/kanji-radicals.json` with an authoritative JLPT level, replacing the
old "lowest-level vocab containing this kanji" heuristic which over-promoted
hundreds of kanji to easier levels.

To regenerate from upstream:

```bash
curl -sL https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji.json -o /tmp/kanji.json
python3 -c "
import json
d = json.load(open('/tmp/kanji.json'))
buckets = {1:[],2:[],3:[],4:[],5:[]}
for k,v in d.items():
    n = v.get('jlpt_new')
    if n in buckets: buckets[n].append(k)
for n, chars in buckets.items():
    chars.sort()
    open(f'scripts/jlpt-kanji/n{n}.txt','w').write('\n'.join(chars)+'\n')
"
```
