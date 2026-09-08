# Reference inventory provenance

The approved freeze remains **2026-09-07**, even when work continues after that date. This is a partial, item-level discovery inventory, not a complete content implementation or a verified game-data dump. `coverage.json` has 1,466 records, all implementation statuses `not-started`; mechanical verification and prerequisite graphs remain blocked. Checkpoint E cannot pass on this inventory.

## Sources and version limits

- [Official Update 177723, published 2 June 2026](https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-177723/) corroborates the numbered reference in [decision 003](../decisions/003-reference-version.md). This announcement does not establish the exact bytes of an installed PC game or exhaustive content.
- [SiegeEngineers/aoe2techtree pinned revision](https://github.com/SiegeEngineers/aoe2techtree/tree/b9d494df6921d4080df69b22f9dbb7a4d1dcd9f0), commit timestamp `2026-06-21T17:15:32Z`, is the latest repository commit returned by the GitHub commits API with `until=2026-09-07T23:59:59Z`. It is a maintained community technology-tree export, not an official publisher dataset or independently verified executable build. The repository is a primary source for its own exported data.
- [The source generator](https://github.com/SiegeEngineers/aoe2techtree/blob/b9d494df6921d4080df69b22f9dbb7a4d1dcd9f0/scripts/generateDataFiles.py) shows separate base/antiquity and Return of Rome extraction paths. Exported tree membership is not a full prerequisite, special-ability or effect graph.

Sixty-five downloaded JSON files (six data/string files and 59 civilization trees) are listed with immutable URLs and SHA-256 hashes in the ledger's `sources`. Only JSON data, the README, generator text and name-rendering JavaScript were fetched into `temp/reference-inventory`; no game artwork, icons, sound, model files or binary were acquired. These temporary files are not runtime dependencies. Reference names are audit labels only. The ledger reserves original Ironvale namespace IDs; those IDs do not resolve to implemented content yet and are not final player-facing names. Reference-media rights do not transfer to original game presentation.

## Enumerated scope

| Ruleset | Units | Buildings | Technologies | Upgrade mappings | Civilizations | Civilization bonuses | Team bonuses |
|---|---:|---:|---:|---:|---:|---:|---:|
| Standard medieval | 245 | 40 | 194 | 115 | 53 | 214 | 53 |
| Chronicles | 85 | 31 | 109 | 39 | 6 | 25 | 6 |
| Return of Rome | 46 | 26 | 56 | 21 | 17 | 68 | 17 |

The standard export includes Romans, Jurchens, Khitans, Shu, Wei, Wu, Mapuche, Muisca and Tupi. The Chronicles export includes Achaemenids, Athenians, Spartans, Macedonians, Puru and Thracians. The Return of Rome export independently includes 17 ancient civilizations; its Romans record is not the standard medieval Romans record. Presence of these names is evidence of roster discovery, not proof that every expansion mechanic matches the freeze.

Unit/building/technology rows preserve numeric reference IDs and localized names. Each exported unit-upgrade entry has a separate row with its destination unit and source record. Availability contains civilization reference IDs found in that source's tree; it does not assert full prerequisites. The data also exports mode-change, shared and legacy entries: 28 rows have no direct tree membership and remain blocked. Examples include dismounted Konnik forms, Ratha melee forms, older passive technologies and entries shared into Chronicles. Do not automatically include them as trainable units or exclude them as campaign-only.

Every civilization help-text bullet before the unique-unit section and every team-bonus entry is separately indexed. Bonus labels are short identifying excerpts, with the complete source text's SHA-256 and its zero-based `<br>`-delimited line position. Unique-unit and unique-technology descriptions are not represented by generic umbrella rows: their individual exported records appear under unit and technology. Splitting a help-text bullet is only an inventory operation; a compound bullet may still require several executable effects. Hidden/non-displayed bonuses, per-civilization replacements and unique effects remain unverified.

## Missing sets and acceptance blockers

The ledger explicitly blocks frozen-build parity, non-tree actors (neutral animals/resources, objectives, campaign/scenario-only actors), unique effect graphs, full prerequisites, the proposal's minimum inventory cross-check and expansion deltas. Campaign-only entries need an individual classification and documented exclusion reason when discovered; this extraction cannot certify their absence. No missing set is represented as a completed generic content row.

Assets/icons/provenance, audio bindings and test evidence are independently `not-started` on every row. The supplied audio pack has not been mapped by this inventory task. Numeric parameters are candidate source values only. No gameplay capability, numerical parity, completeness, asset clearance or successful production-content registry resolution is claimed.

## Reproduction and validation

The acquisition used Python 3 standard-library `urllib.request`, GitHub's commits/tree APIs, and immutable `raw.githubusercontent.com` URLs. No dependency installation or game command was needed. The original disposable discovery script is `temp/reference-inventory/build_inventory.py`; it must not be used alone because its initial name fallback was incorrect. The durable label reconciliation is `python3 tools/build-reference-inventory.py`. It verifies cached source hashes, reads actual UI name mappings, updates names and name-source evidence without changing item identities or mechanics/implementation fields, and records each ruleset’s age labels. Reacquire the immutable URLs in `sources` into matching paths under `temp/reference-inventory` if the cache is deleted. The initial discovery method follows:

1. Select the latest repository commit at/before the freeze; obtain `data/data.json`, `chronicles/data/data.json`, `ror/data/data.json` and each matching `data/locales/en/strings.json`, plus all 59 standard/Chronicles civilization JSON files under `data/trees`; record byte hashes.
2. Enumerate every `Unit`, `Building`, `Tech` entry for standard/Chronicles and every `units`, `buildings`, `techs` entry for Return of Rome. For standard/Chronicles, match each item by tree node `use_type` and `node_id`, then resolve the tree’s `name_string_id` through its ruleset’s English strings. For entries without a matching tree node and Return of Rome, resolve `LanguageNameId` directly. Never silently label a record with an internal engine code; missing localization is explicitly blocked. Preserve all rows, including missing tree membership.
3. Enumerate `unit_upgrades` separately and link each key to its destination unit. Enumerate `civs`, or Return of Rome `techtrees`, separately. Derive membership from each civilization's matching category list.
4. Read each civilization's help string (`help_string_id`, or Return of Rome `civ_helptexts`). Split on `<br>` tags, strip HTML, enumerate individual civilization/team bonus lines, reserve IDs by civilization/section/ordinal and hash their full source text. On later source revisions retain IDs and explicitly review ordering changes; do not silently regenerate ordinal identities against a different snapshot.
5. Assign reserved counterpart IDs, source pointers, unknown prerequisites, blocked mechanics and separate unstarted implementation/media/audio/test statuses. Record global discovery gaps independently of item rows.

Validation command (from repository root):

```sh
python3 - <<'PY'
import json
x = json.load(open('docs/content/coverage.json'))
r = x['records']; ids = {a['id'] for a in r}
assert len(r) == len(ids) == 1466
assert len({a['counterpartId'] for a in r}) == len(r)
for a in r:
    assert a['source']['url'] and a['source']['version'] and a['referenceName']
    assert a['implementationStatus'] == 'not-started'
    assert a['counterpartStatus'] == 'reserved-not-defined'
    assert a['mechanics']['status'] == 'blocked'
    assert all(c in ids for c in a['availability']['civilizationIds'])
    if a['kind'] == 'upgrade':
        assert a['mechanics']['targetReferenceId'] in ids
assert x['completeness'] == 'blocked'
print('PASS: 1466 unique inventory rows; internal references resolve; no implementation claims')
PY
```

This command passed. It is an inventory consistency check, not the production schema gate: counterpart definitions, complete faction availability, prerequisite cycles/effects, asset paths and actual gameplay/audio test wiring remain unresolved.

Next task: obtain or independently corroborate the frozen reference's full prerequisite/effect and non-tree actor data, then reconcile one exact reference item through an implemented counterpart, availability/abilities, original presentation, supplied-audio binding and public-command test. Extend that checked mapping item by item; do not promote imported tree rows to completed coverage in bulk.

## Localized-name correction and regression evidence

The initial extraction incorrectly treated every standard `LanguageNameId` as a UI string key and fell back to internal codes when lookup failed. For example, raw Archer `LanguageNameId=5083` does not exist in this English string export; its tree node has `name_string_id=14083`, which resolves to **Archer**. The corrected lookup follows [the pinned UI renderer](https://github.com/SiegeEngineers/aoe2techtree/blob/b9d494df6921d4080df69b22f9dbb7a4d1dcd9f0/js/main.js#L917). Return of Rome uses [direct LanguageNameId lookup](https://github.com/SiegeEngineers/aoe2techtree/blob/b9d494df6921d4080df69b22f9dbb7a4d1dcd9f0/ror/js/techtree.js#L474). Every unit/building/technology label now has explicit `referenceNameEvidence`; upgrades inherit their exact destination label. No unresolved localized item names remain in the acquired export.

Verified labels: standard units 4 Archer, 5 Hand Cannoneer, 83 Villager, 74 Militia, 93 Spearman and 448 Scout Cavalry; buildings 12 Barracks, 109 Town Center and 70 House. Verified standard age labels are Dark, Feudal, Castle and Imperial Age; Chronicles labels are Archaic, Civic, Classical and Imperial Age; Return of Rome labels are Stone, Tool, Bronze and Iron Age. These are source-label checks, not gameplay implementation evidence. The 1,466 item IDs and reserved counterpart IDs remain unchanged, all mechanics remain blocked, and all implementation statuses remain not-started.
