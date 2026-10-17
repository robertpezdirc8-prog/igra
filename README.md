# ATHERIA: VOID BREAKER

WebGPU cosmic-horror rogue-lite arena shooter, zgrajen z **Vite + React 18 + TypeScript (strict)**.

## Igralna mehanika

- Premik: **WASD / puščice** (ali virtualna palica na mobilnem)
- Namerjanje in streljanje: **miška** (levi klik za strel)
- Dash: **SPACE** (z i-frames)
- Sekundarno orožje: **desni klik** (Gravity Well / Chain Lightning)
- Temporal Stasis: **Q**
- Pavza: **ESC**

Valovi sovražnikov, boss vsakih 5 valov, XP in level-up z izbiro nadgradenj,
skill tree, dosežki, dnevni izzivi in nagrade, trgovina z kozmetiko,
5 težavnostnih stopenj.

## Renderiranje

- **2D canvas** za igro (ozadje, sovražniki, projektili, HUD po podatkih iz engine)
- **WebGPU overlay canvas** za GPU-pospešene delce: fizika delcev teče v
  compute shaderju, rezultat se vsak frame prenese v instancirani vertex buffer.
  A canvas lahko gosti samo EN tip contexta, zato ima WebGPU svojo platno.
- Samodejni fallback na Canvas2D, če WebGPU ni na voljo.

## Zagnati lokalno

```bash
npm install
npm run dev        # razvojni strežnik
npm run typecheck  # TypeScript strict preverjanje
npm run build      # produkcijski build (izhod v dist/)
npm run preview    # predogled produkcijskega builda
```

## Arhitektura

```
src/
  App.tsx                 # UI sloj; engine je ENOBEN vir resnice za stanje igre
  game/
    engine.ts             # GameEngine: igralna zanka, fizika, valovi, boss, XP
    webgpu-renderer.ts    # WebGPU compute + instancirano renderiranje delcev
    audio.ts              # proceduralni WebAudio zvok (brez datotek)
    enemies / bosses / levels / weapons / difficulty
    skillTree.ts          # skill tree + computeSkillBonuses (čista funkcija)
    saveSystem.ts         # verzionirani shranjevanje (v2.0.0 + migracija)
    achievements / dailyChallenges / cosmetics / statsSystem
  components/             # React UI komponente (samo uporabljene)
```

Ključna načela:

- **Engine je vir resnice** – React UI ga klice prek javnega API-ja
  (`resume/restart/goToMenu/chooseUpgrade/setMobileMove/...`) in bere realne
  podatke prek `getGameStats()/getMinimapData()/getLevelChoices()`.
- **UI sync je omejen na ~10 Hz** s spremembno-detekcijo (brez 60×/s re-renderjev).
- **Persistenca**: save v2.0.0 vsebuje high score, skill tree, skill točke,
  zlato/dragulje/XP, kozmetiko, težavnost, dosežke in nastavitve (z migracijo).
- `preventDefault` na tipkovnici velja izključno za igralne tipke med igranjem.

## Deployment (GitHub Pages)

Workflow `.github/workflows/deploy.yml` zbuilda projekt z Vite in objavi
`dist/` na GitHub Pages (base pot `/igra/` je nastavljena v `vite.config.js`).
