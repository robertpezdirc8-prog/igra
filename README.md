# 🚀 ATHERIA: VOID BREAKER

> **WebGPU cosmic-horror rogue-lite arena shooter** — preživi valove Voida, izboljšuj svojo ladjo in potopi se v praznino.

[![Deploy](https://github.com/robertpezdirc8-prog/igra/actions/workflows/deploy.yml/badge.svg)](https://github.com/robertpezdirc8-prog/igra/actions/workflows/deploy.yml)
![Igraj zdaj](https://img.shields.io/badge/igraj-robertpezdirc8-prog.github.io%2Figra-00ffff)

**🎮 Igraj v brskalniku:** https://robertpezdirc8-prog.github.io/igra/

---

## 📖 O igri

ATHERIA: VOID BREAKER je twin-stick arena shooter z rogue-lite napredovanjem, ki teče v celoti v brskalniku.
Igralec upravlja vesoljsko ladjo ujeto v praznino (Void), kjer se v valovih prebujajo vesoljske grozote.
Vsak peti val prinese **bossa** (Void Titan), vsak dosežen nivo pa izbiro med tremi naključnimi nadgradnjami.

- **Igralna zanka:** preživi → pobiraj XP → izbiraj nadgradnje → odklepaj veščine → ponovi, le bolje
- **Permadeath s progresijo:** smrt konča tek, ampak zlato, veščine in dosežki ostanejo
- **Proceduralni zvok:** vsa glasba in efekti so sintetizirani v realnem času (WebAudio, brez zvočnih datotek)
- **GPU pospešeno:** delci se rišejo prek WebGPU (do 10 000 instanc), z avtomatskim fallbackom na Canvas2D

---

## 🎮 Kontrole

| Dejanje | Namizje | Mobilno |
|---|---|---|
| Premikanje | `W A S D` / puščice | virtualna palica (levi spodaj) |
| Namerjanje | miška | — |
| Streljanje | levi klik (drži) | rdeči gumb (drži) |
| Dash (i-frames) | `SPACE` | cyan gumb |
| Sekundarno orožje | desni klik | vijolični gumb |
| Temporal Stasis | `Q` | — |
| Pavza | `ESC` | — |

> 💡 `preventDefault` velja izključno za igralne tipke med igranjem — F5, Tab in Ctrl+R delujejo normalno.

---

## ⚔️ Igralni sistemi

### Valovi in sovražniki
- Neprekinjeni valovi s tresočim se številom sovražnikov (`3 + val × 2`)
- **Swarmer** (rdeča) — hitri, mnogi, šibki
- **Sniper** (oranžna) — drži razdaljo,izstreli trojčke
- **Titan** (vijolična) — počasen, oklepljen, krožne salve
- **Void Titan (boss)** vsak 5. val — 4 napadalni vzorci (spiralni, Lissajous, logaritemski spiralni, križni) in **adaptivna AI**, ki analizira tvoje potegom bega in prilagodi merjenje

### XP, nivoji in nadgradnje
- Ubijanje sovražnikov daje XP; nivo sproži izbiro **3 naključnih nadgradenj** iz bazena 10
- Vsak 3. val dodatna nadgradnja (wave milestone)
- Nadgradnje: Plasma Overcharge, Neural Reflexes, Void Shield, Critical Matrix, Split Plasma,
  Gravity Well / Chain Lightning / Temporal Stasis (odklepijo sekundarno orožje) …

### Skill tree (trajna progresija)
- **3 veje × 5 veščin**: Ofenziva ⚡, Defenziva 🛡️, Uporabnost 💨
- Skill točke (~1 na igralčev nivo + dnevne nagrade)
- Vse 15 veščin **dejansko vpliva na igro** prek `computeSkillBonuses()` — primeri:
  - Plasma Mastery → +10 % škode / nivo
  - Chain Reaction → izstrelki se ob zadetku razvejijo na najbližega sovražnika
  - Overcharge → možnost dvojnega salva
  - Reinforced Hull → +20 HP / nivo
  - Energy Shield → do −75 % prejete škode

### Težavnost (5 stopenj)
`Easy → Normal → Hard → Nightmare → Impossible` — množniki za HP/škodo/hitrost sovražnikov
in za škodo/XP/zlato/rezultat igralca. Višje stopnje se odklenejo z doseženim nivojem.
Izbira se trajno shrani.

### Ekonomija in trgovina
- Sovražniki odpuščajo **zlato** (swarmer 10 / titan 25 / boss 250 × množnik težavnosti)
- Trgovina ponuja 18 kozmetičnih predmetov (sledi, avre, okvirji, ladje, efekti) z redkostmi
  in nivojskimi odklepi; predmeti nad tvojim nivojem so vidni, ampak 🔒 zaklenjeni
- Nakup je validiran (stanje + nivo) — negativna stanja niso možna

### Dnevni izzivi in nagrade
- **3 dnevni izzivi** (seed-generirani po datumu, enaki za vse igralce na napravi)
- **7-dnevni cikel nagrad**: zlato, XP za naslednji tek, skill točke, dragulji

### Dosežki
15 dosežkov (nivojski, bojni, preživetveni) s preverjanjem ob koncu teka,
toast obvestili in trajno shranjevanjem.

### Statistika in leaderboard
Vsak konec teka posodobi življenjsko statistiko (čas, ubijenci, škoda, combo …)
in vpiše rezultat na lokalni leaderboard (top 100, z rankom igralca).

---

## 🖥️ Renderiranje

```
┌─────────────────────────────────────────────┐
│  canvas #1 (2D)                             │  ozadje, sovražniki, projektili,
│  → CanvasRenderingContext2D                 │  igralec, lebdeči teksti, meni
├─────────────────────────────────────────────┤
│  canvas #2 (WebGPU overlay, prosojen)       │  delci: instancirani kvadratki,
│  → GPUCanvasContext + render pipeline       │  1 draw call za do 10 000 delcev
├─────────────────────────────────────────────┤
│  React UI (DOM)                             │  HUD, meniji, skill tree, trgovina
└─────────────────────────────────────────────┘
```

**Zakaj dva canvasa?** HTML canvas lahko gosti samo **en** tip contexta. Ko je enkrat
pridobljen `2d` context, `getContext('webgpu')` vrne `null`. Zato WebGPU dobi svojo
prosojno platno (premultiplificirano alfo, blend `one / one-minus-src-alpha`), ki se
samo prekrije nad 2D platnom.

**Cevovod (pipeline):**
- CPU pakuje delce v strukturo 48 B/delec (pozicija, hitrost, življenjska doba, velikost, RGBA)
- Nalaganje prek staging bufferja → `copyBufferToBuffer` → instancirani vertex buffer
- Vertex shader izbere pozicijo/velikost/barvo per instanco (stepMode: `instance`),
  fragment shader upošteva premultiplificirano alfo (fade-out)
- Barve se razčlenijo iz hex/rgb nizov z cache-em (max 512 vnosov)
- Če WebGPU ni na voljo → samodejni fallback na Canvas2D (isti vizualni rezultat)

---

## 🏗️ Arhitektura

### Ključno načelo: **engine je enoten vir resnice**

React UI **ne vodi vzporednega stanja igre**. Vse spremembe stanja gredo skozi javni API
engine-ja, UI pa bere realne podatke prek getterjev. Tako ne more priti do klasičnega
desync-a (npr. zamrznjen zaslon po kliku na »Nadaljuj«).

```
React (App.tsx)                       GameEngine (engine.ts)
─────────────────                     ──────────────────────
onStartGame  ── setSkillBonuses ──▶   startGame()      vir resnice za:
              ── setDifficulty  ──▶                    'menu' | 'playing' | 'paused'
              ── setStartingXp ──▶                     | 'levelup' | 'levelchoice'
              ── restart()      ──▶                    | 'gameover'
onResume     ────── resume()    ──▶
onRestart    ────── restart()   ──▶   onStateChange ──▶ React re-render
onMainMenu   ────── goToMenu()  ──▶
izbira nadgradnje ─ chooseUpgrade(i) ─▶

UI ◀── getGameStats() / getMinimapData() / getLevelChoices() / getPlayer() (branje)
```

### Struktura projekta

```
├── index.html                  # lang=sl, OG meta, SVG favicon
├── vite.config.js              # base "/igra/" za GitHub Pages
├── eslint.config.js            # flat config (js + ts + react-hooks)
├── .github/workflows/
│   └── deploy.yml              # typecheck → build → Pages deploy
└── src/
    ├── main.tsx                # React root
    ├── App.tsx                 # UI orkestracija; sync ~10 Hz s spremembno-detekcijo
    ├── index.css               # Tailwind 4
    ├── game/
    │   ├── engine.ts           # GameEngine: zanka, fizika, valovi, boss, XP, orožje,
    │   │                       #   kolizije, delci, sekundarno orožje, težavnost,
    │   │                       #   skill bonusi, gold, statistika teka
    │   ├── webgpu-renderer.ts  # WebGPU instancirano renderiranje delcev
    │   ├── audio.ts            # proceduralni WebAudio (pad, arpeggio, SFX sinteza)
    │   ├── skillTree.ts        # definicije veščin + computeSkillBonuses (čista fn)
    │   ├── saveSystem.ts       # save v2.0.0 + migracija v1→v2
    │   ├── statsSystem.ts      # življenjska statistika + leaderboard (localStorage)
    │   ├── achievements.ts     # definicije + checkAchievements()
    │   ├── dailyChallenges.ts  # seed-generirani dnevni izzivi
    │   ├── difficulty.ts       # 5 težavnostnih stopenj (množniki)
    │   ├── cosmetics.ts        # 18 kozmetičnih predmetov + helperji
    │   ├── levels.ts           # nivojske stopnje okolja
    │   └── environment.ts      # risanje ozadja po nivoju
    ├── components/             # 34 React komponent (brez mrtev kode)
    │   ├── index.ts            # javni izvoz
    │   ├── MainMenu / PauseMenu / GameOverScreen / LevelUp* / LoadingScreen …
    │   └── HealthBar / ScoreDisplay / MiniMap / WaveInfo / ComboDisplay … (realni podatki)
    └── utils/
        └── pseudoRandom.ts     # determinističen PRNG (čisti render efekti)
```

### Sinhronizacija UI ↔ engine (brez 60×/s re-renderjev)

- `requestAnimationFrame` zanka vzorca engine **~10×/s** (throttle 100 ms)
- Vsak vzorec se serializira v *fingerprint* (stanje + rezultat + HP + pozicija …);
  React se posodobi **samo, če se je kaj spremenilo**
- Kritični vizual (križ, minimapa) teče na 10 Hz — dovolj gladko, brez povoja React drevesa
- Prejšnja implementacija je klicala `setState` 60×/s in re-renderjala celoten HUD

### Type-safe in čisti render

- TypeScript **strict** (`tsc --noEmit` v CI)
- ESLint flat config: `@eslint/js` + `typescript-eslint` + `eslint-plugin-react-hooks`
  (vključno z react-compiler pravili čistosti renderja)
- `Math.random()` / `Date.now()` ne sobivajo v renderju → `pseudoRandom(seed)` in
  lazy `useState` initializerji; `preventDefault` samo za igralne tipke

---

## 💾 Shranjevanje (save v2.0.0)

En JSON v `localStorage` (`atheria_save_data`), verzioniran z **migracijo v1 → v2**:

| Sekcija | Vsebina |
|---|---|
| `player` | high score, skupni čas, odigrane igre, ubijenci, boss kills, najvišji val/nivo, max combo |
| `skillTree` | nivoji vseh 15 veščin po vejah (`offense/defense/utility`) |
| `skillPoints` | neporabljene skill točke |
| `difficulty` | izbrana težavnost (`null` = neizbrana) |
| `achievements` | ID-ji odklenjenih dosežkov |
| `completedChallenges` | `{ [datum]: challengeId[] }` |
| `settings` | glasnost glasbe/SFX, FPS prikaz, kakovost delcev |
| `cosmetics` | lastni predmeti + opremljeni (sled/aura/okvir) |
| `currency` | zlato, dragulji, XP za naslednji tek (dnevna nagrada) |

Ločeno še: `atheria_highscore` (za canvas meni), `atheria_game_stats` (statistika),
`atheria_leaderboard` (top 100), `daily_rewards` (7-dnevni cikel).

---

## 🚀 Zagon

**Zahteve:** Node 18+ (priporočeno 20), npm

```bash
# 1. Kloniraj in namesti
git clone https://github.com/robertpezdirc8-prog/igra.git
cd igra
npm install

# 2. Razvojni strežnik (http://localhost:5173/igra/)
npm run dev

# 3. Kakovost kode
npm run typecheck     # TypeScript strict
npm run lint          # ESLint (js + ts + react-hooks)

# 4. Produkcija
npm run build         # izhod v dist/
npm run preview       # lokalni predogled produkcijskega builda
```

> **WebGPU** zahteva Chrome/Edge 113+, Firefox 141+ ali drug brskalnik z omogočenim WebGPU.
> Brez njega igra samodejno teče v Canvas2D načinu — funkcionalnost je identična.

---

## 🌍 Deployment (GitHub Pages)

Workflow `.github/workflows/deploy.yml` ob vsakem pushu na `main`:

1. `npm ci` → `npm run typecheck` → `npm run build`
2. Objavi `dist/` prek `actions/deploy-pages@v4`

Repo mora imeti **Settings → Pages → Source = GitHub Actions** (nastavljeno).
Stran je dosegljiva na `/igra/` (nastavljeno v `vite.config.js` kot `base`).

---

## 🔧 Tehnične odločitve (zakaj tako?)

| Odločitev | Razlog |
|---|---|
| Engine kot enoten vir resnice | Odpravi desync zamrznitve (pavza/restart/level-up) |
| 2 platna (2D + WebGPU) | Canvas dopušča samo en context type |
| CPU fizika delcev, GPU izris | Readback iz GPU je drag; CPU ostane vir resnice za pozicije |
| UI sync 10 Hz + fingerprint | 60×/s setState je povozil React in jemlje FPS |
| `pseudoRandom()` namesto `Math.random()` v renderju | Stabilni efekti + React čistost pravila |
| Proceduralni WebAudio | 0 zvočnih datotek, instant nalaganje, nič licenc |
| Brez UI knjižnic | react + react-dom edini runtime odvisnosti (~90 KB gzip) |
| Skill bonusi kot čista funkcija | Veščine testabilne, brez mutacij modulov |

---

## 🗺️ Roadmap

- [ ] Weapon evolution (kombiniranje nadgradenj v nove orožje)
- [ ] Elitne različice sovražnikov (afiksi)
- [ ] Dodatni bossi (Void Titan je prvi iz družine)
- [ ] Online leaderboard (Supabase) — localStorage je pripravljen za zamenjavo
- [ ] Glow/bloom post-processing v WebGPU cevovodu
- [ ] Lokalizacija (EN/SI preklopnik (EN/SI))

## 🤝 Sodelovanje

PR-ji so dobrodošli! Pred oddajo poženi:

```bash
npm run typecheck && npm run lint && npm run build
```

## 📄 Licenca

 [MIT](./LICENSE) © robertpezdirc8-prog
