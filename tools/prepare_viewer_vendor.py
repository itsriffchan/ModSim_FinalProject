"""Adapt the pinned OrbitControls ES module to the bundled classic runtime.

No package installation or build tools required. Original source and MIT license
are retained. Downloads are deliberately separate from this offline operation.
"""
from pathlib import Path
import hashlib
import json
import re

vendor = Path(__file__).resolve().parents[1] / 'viewer' / 'vendor'
source = (vendor / 'OrbitControls.source.js').read_text(encoding='utf-8')
source, count = re.subn(r"import\s*\{(.*?)\}\s*from 'three';", r'const {\1} = THREE;', source, count=1, flags=re.S)
assert count == 1
source = source.replace('export { OrbitControls };', 'THREE.OrbitControls = OrbitControls;')
source = '/* Derived from Three.js 0.160.1; MIT license in LICENSE.three. */\n(() => {\n' + source + '\n})();\n'
(vendor / 'OrbitControls.js').write_text(source, encoding='utf-8')
manifest = {'version': '0.160.1', 'license': 'MIT', 'source_base': 'https://cdn.jsdelivr.net/npm/three@0.160.1/',
            'adaptation': 'OrbitControls import replaced by THREE destructuring; export assigned to THREE.OrbitControls; wrapped in IIFE',
            'sha256': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(vendor.iterdir()) if p.is_file() and p.name != 'manifest.json'}}
(vendor / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
