#!/usr/bin/env python3
"""Reconcile inventory audit names against pinned reference UI strings.

Run from the repository root after acquiring the hashed JSON sources described in
reference-sources.md. Updates labels/provenance only; never claims implementation.
"""
import hashlib
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT / 'temp/reference-inventory'
LEDGER = ROOT / 'docs/content/coverage.json'


def clean(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', ' ', value))).strip()


def main():
    ledger = json.loads(LEDGER.read_text())
    revision = ledger['sourceRevision']
    base = f'https://github.com/SiegeEngineers/aoe2techtree/blob/{revision}/'
    sources = {item['path']: item for item in ledger['sources']}
    for source in sources.values():
        actual = hashlib.sha256((CACHE / source['path']).read_bytes()).hexdigest()
        if actual != source['sha256']:
            raise ValueError(f"Source hash mismatch: {source['path']}")
    records = {item['id']: item for item in ledger['records']}
    unresolved = []
    for ruleset, prefix in [('standard', ''), ('chronicles', 'chronicles/'), ('return-of-rome', 'ror/')]:
        data_path = prefix + 'data/data.json'
        strings_path = prefix + 'data/locales/en/strings.json'
        data = json.loads((CACHE / data_path).read_text())
        strings = json.loads((CACHE / strings_path).read_text())
        trees = {}
        for path in sorted((CACHE / (prefix + 'data/trees')).glob('*.json')):
            relative = path.relative_to(CACHE).as_posix()
            sources[relative] = {'path': relative, 'url': base + relative, 'revision': revision,
                                 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
            tree = json.loads(path.read_text())
            for category, nodes in tree.items():
                for index, node in enumerate(nodes):
                    key = (node['use_type'], str(node['node_id']))
                    trees.setdefault(key, (node['name_string_id'], relative, f'/{category}/{index}/name_string_id'))
        categories = {'unit': 'units', 'building': 'buildings', 'technology': 'techs'} if ruleset == 'return-of-rome' else {'unit': 'Unit', 'building': 'Building', 'technology': 'Tech'}
        for kind, category in categories.items():
            for key, obj in data['data'][category].items():
                record = records[f'{ruleset}:{kind}:{key}']
                tree_name = trees.get((category, key))
                if tree_name:
                    string_id, file, pointer = tree_name
                    method = 'tree-name-string-id'
                else:
                    string_id = obj['LanguageNameId']
                    file, pointer = data_path, f'/data/{category}/{key}/LanguageNameId'
                    method = 'language-name-id'
                value = strings.get(str(string_id))
                # A shared/mode-change export can lack a tree node. Keep the
                # original ID visible instead of presenting its internal code as a label.
                if not value:
                    record['referenceName'] = f'Unresolved {kind} {key}'
                    record['referenceNameEvidence'] = {'status': 'blocked', 'reason': 'No matching localized UI name found in pinned tree/string sources.', 'internalName': obj.get('internal_name')}
                    unresolved.append(record['id'])
                else:
                    record['referenceName'] = clean(value)
                    record['referenceNameEvidence'] = {'status': 'source-extracted', 'method': method,
                        'mappingUrl': base + file, 'mappingPointer': pointer,
                        'stringsUrl': base + strings_path, 'stringId': str(string_id)}
        for record in ledger['records']:
            if record['ruleset'] == ruleset and record['kind'] == 'upgrade':
                target = records[record['mechanics']['targetReferenceId']]
                record['referenceName'] = 'Upgrade to ' + target['referenceName']
                record['referenceNameEvidence'] = {'status': target['referenceNameEvidence']['status'], 'targetReferenceId': target['id']}
        ages = data['age_names'] if ruleset == 'return-of-rome' else dict(enumerate(data['age_names']['base' if ruleset == 'standard' else 'antiquity'], 1))
        ledger.setdefault('rulesetAgeNames', {})[ruleset] = {
            str(key): {'referenceName': clean(strings[str(value)]), 'stringId': str(value), 'stringsUrl': base + strings_path}
            for key, value in ages.items()
        }
    ledger['sources'] = list(sources.values())
    LEDGER.write_text(json.dumps(ledger, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'unresolvedNames': unresolved, 'sourceFiles': len(sources)}, indent=2))


if __name__ == '__main__':
    main()
