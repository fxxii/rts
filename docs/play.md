# Play Ironvale

This is the first playable development slice: mirrored settlements, four physically gathered resources, paid construction/training/research, workers, swordsmen, spearmen, archers and mounted scouts. It is not the complete approved game. Source assets are original procedural models and the supplied procedural audio; synthetic voices remain explicitly labeled placeholders.

## Development

Use Node 24 (the repository pins 24.13.0 for npm scripts):

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. The development launcher starts Vite and the authoritative server together. `/health` on port 3001 reports readiness. No AI credentials or runtime model calls are required.

## Two players on one machine

1. Open the URL in two independent browser contexts (for example normal and private windows).
2. Player 1 selects **Create online duel** and shares the six-character room code.
3. Player 2 enters it and selects **Join duel**.
4. Both select **Ready to battle**. Orders and resources are isolated by authenticated seats.
5. After conquest or resignation, both select **Rematch**. Practice rematches need only the human's acceptance.

Closing a tab reserves its seat for 60seconds while the game continues. A network interruption retries automatically; after a reload, **Reconnect to match** restores the session stored in that tab. Reopening the seat replaces its old connection. Clearing session storage loses that tab's token. No accounts or cross-device token-transfer UI exists.

## Production build and LAN setup

```sh
npm run build
npm start
```

Open `http://127.0.0.1:3001`. The build verifies all supplied audio hashes, copies assets, builds the client and emits the server. The start script serves both compiled components; no Vite is needed.

For two physical devices on a trusted local network, replace this example address with the host machine's actual LAN address:

```sh
HOST=0.0.0.0 ALLOWED_ORIGINS=http://192.168.1.20:3001 npm start
```

Both devices open `http://192.168.1.20:3001`, then use the room procedure above. Allow TCP 3001 through the host firewall if necessary. Public hosting needs an HTTPS/WSS reverse proxy and its exact public origin in `ALLOWED_ORIGINS`; no public deployment is configured or claimed. Same-machine browser and transport tests passed; this LAN/two-device procedure still needs a physical-device test.

## Controls and match loop

- Click/drag to select; Shift adds selection. Double-click selects matching visible own units.
- Right-click to move, gather, assist construction, repair or attack. Shift queues orders.
- Arrows pan; mouse wheel zooms; click the minimap to focus. H selects Town Center; period cycles idle workers.
- A arms attack-move; S stops; command buttons offer hold and patrol. Ctrl+1–9 assigns groups; 1–9 recalls them.
- Select a worker, choose a resource, and wait for physical cargo drop-off. Build houses for capacity, then Barracks/Archery Range/Stable and pay to train units.
- Select a producer to train/research or set a rally point. Click queue entries to cancel/refund. Cancel a foundation to recover its unbuilt fraction. Destroyed investments return nothing.
- Scout and attack the opponent's units and completed production buildings. Both players may lose simultaneously. Settings includes controls, six persistent audio buses and resignation.

Every exposed action is backed by authoritative intentions; unmet costs/ages show a reason. In development, the sound preview is under Settings. It is hidden in production.

## Reproducible checks

```sh
npm run typecheck
npm run lint
npm test
npm run validate:assets
npm run headless
npm run stress
npm exec -- playwright install chromium
npm run test:browser
npm run build
```

To test production after `npm start` in another terminal:

```sh
TEST_BASE_URL=http://127.0.0.1:3001 npm run test:browser -- tests/browser/match.spec.ts tests/browser/duel.spec.ts tests/browser/reconnect.spec.ts
```

Audio-module tests use Vite's development imports. The practice/duel tests also exercise the built production UI. Browser screenshots/traces are generated under ignored `test-results`; verified evidence is summarized in `docs/evidence`.

## Open content and playtest gates

Farms/fishing/naval, markets/trade, siege/monks/relics, garrison/transport controls, walls/gates/elevation, full prerequisites/upgrades/faction differences, objectives and the full approved reference inventories remain incomplete. The three age-advance research actions exist, with only a small development technology set. Human strategic balance/rematch interest, real two-device play, long sessions and reference-hardware 60fps remain unverified.
