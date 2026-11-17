# LUMENFALL — Ten Nights of the Ember Warden

[![best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/c/best-game-01/?utm_source=github&utm_medium=referral&utm_campaign=Mansyur0523)
[![rank](https://make.fun/badge/rank.svg)](https://make.fun/c/best-game-01/?utm_source=github&utm_medium=referral&utm_campaign=Mansyur0523)
[![reward](https://make.fun/badge/reward.svg)](https://make.fun/c/best-game-01/?utm_source=github&utm_medium=referral&utm_campaign=Mansyur0523)

**LUMENFALL** is a light-against-dark arena campaign for the make.fun `best-game-01`
bounty. You are the Ember Warden, keeper of the last lanterns. Your lantern beam —
aimed with the mouse — is the only thing that hurts the shades. Bend it with mirrors,
split it with prisms, relight the braziers, and survive **ten nights**, each its own
arena with its own objective, until the Night Sovereign falls and dawn breaks.

## Play

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: every file the game loads lives under `game/`.

## Controls

| Input | Action |
|---|---|
| WASD / arrows | Move the warden |
| Mouse | Aim the lantern beam |
| Hold left click / Space | Fire the beam (drains ember) |
| Q | Ember Spread — a 5-way burst (relic unlock) |
| E | Sun Lance — a piercing lance (relic unlock) |
| P / Esc | Pause · M mute · R restart · Enter confirm |

## The campaign

1. **First Ember** — survive, kill 18 shades
2. **The Long Dark** — wisps dart through the gloom
3. **Brazier Watch** — light all six braziers with your beam
4. **The Hollow** — defend the Great Lantern from crawlers and spitters
5. **Herald of Gloom** — boss: the Gloom Herald, who summons shades
6. **Hall of Mirrors** — light braziers by bending the beam off mirrors
7. **Prism Garden** — coloured shades fear only their own prism colour
8. **Siege of the Lantern** — elites lead the siege
9. **The Umbral Twins** — two bosses, one night
10. **The Night Sovereign** — the final boss, then victory — and endless night

Clear a night and draft **1 of 3 relics** from a pool of 24: wider and longer beams,
ember wells, shard magnets, crits, knockback, lifesteal, mirror polish, prism mastery,
Second Wind, Boss Bane, and three unlockable tools (Ember Spread, Sun Lance,
Orbiting Blades).

## Systems

- **Beam optics** — reflection off mirrors (ray tracing), prism splitting into
  red / green / blue rays; coloured shades are immune to every colour but their own.
- **10 enemy kinds + elites + 4 bosses** — chasers, weavers, tanks, ranged spitters,
  splitters, teleporting flickers, colour shades, and boss patterns (summon, radial
  bolt bursts, charges).
- **Economy** — shards drop from kills, magnet-pulled to the warden, worth score;
  combo multiplier up to x5; kill feed; radio callouts from the lantern-keeper's
  network; minimap with live dots; boss bars; night banners.
- **Feel** — particles, screen shake, hit flash, floating damage numbers, knockback,
  damage vignette, darkness that closes in as torches go out, procedural WebAudio
  SFX and music (no audio files).
- **Complete loop** — title screen, ten nights, relic drafts, pause, game over,
  victory, endless mode, best score in `localStorage`, restart.

## Screenshots

Deterministic scenes, staged from the real rules with `?shot=…&seed=7`:

- `1-cover.jpg` — live combat on Night 3 (Brazier Watch)
- `2-title.jpg` — title screen
- `3-boss.jpg` — the Gloom Herald, Night 5
- `4-victory.jpg` — dawn breaks after Night 10

## Entry

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to
`/output` and writes `/output/dossier.json` with the kit's vendored
`vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE). SPDX-License-Identifier: MIT.
