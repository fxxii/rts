# Development renderer evidence

Implemented `src/client/renderer.ts` and `src/client/models.ts` on 2026-09-08.

The renderer consumes only `PlayerView`, never simulation state or map seed. Hidden enemy mobile entries are discarded defensively; missing entities are removed immediately. Remembered buildings/resources use muted shared materials and cannot be picked. The 64×64 fog texture consumes permitted visible/explored cell indices. Ground is flat cosmetic geometry with no resource placement encoded in it.

Original procedural models cover the five development units, nine buildings, trees, berries, gold and stone. Units have role silhouettes, team colors and a secondary team shape. Static model geometry is merged by material once per archetype, cached, and shared across instances. Three's mesh frustum culling remains enabled. No downloaded art, image generation, map seed, or external assets are used.

Camera, ray picking, own visible unit rectangle selection, selection rings, selected/damaged health bars, construction scale, cosmetic move/work/attack animation, mill rotor, placement footprint and expiring order marker are implemented. `progress` is expected as a normalized 0–1 construction fraction. Camera coordinates and all API points use integer thousandths of tiles. Pan inputs are tiles; zoom delta uses wheel-style pixel delta.

RAF interpolation never mutates rules. Diagnostics retain up to 1,800 actual frame intervals plus frame count, last-render draw calls and current entity count. Disposal disconnects resizing, cancels RAF and disposes renderer/texture/material/geometry allocations.

Executed successfully:

- `npx tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --skipLibCheck src/client/renderer.ts src/client/models.ts`
- `npx eslint src/client/renderer.ts src/client/models.ts`

Official API references checked: [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html), [DataTexture](https://threejs.org/docs/pages/DataTexture.html). Installed Three.js 0.185.1, @types/three 0.185.4.

Not yet verified: actual application rendering, browser interactions, screenshots, GPU cleanup across rematches, 400-unit stress performance or human visual assessment. No performance target is claimed. Dynamic shadows are not enabled. Unit fall and building collapse animations consume only permitted `combat.unit_death` / `siege.building_collapse` events, deduplicated by event/entity/type identity; they expire after 650 ms and disappear immediately when their cell loses visibility. Fog disappearance is never interpreted as death. This is development-slice presentation, not full approved inventory or release-level art.
