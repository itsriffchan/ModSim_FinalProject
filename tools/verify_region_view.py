"""Re-export preserved REGION VIEW fixtures and record byte preservation (no science rerun)."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

repo = Path(__file__).resolve().parents[1]
run_id = sys.argv[1]
evidence = repo / 'docs/evidence/view-context/region-view' / run_id
work = repo / 'results/runs' / ('region_view_' + run_id)
source = repo / 'results/runs/viewer_acceptance_20261120'
names = ['batch', 'independent_2_A', 'independent_3_B', 'independent_1_C']
finalize = '--finalize' in sys.argv
if not finalize:
    evidence.mkdir(parents=True, exist_ok=False)
    work.mkdir(parents=True, exist_ok=False)

def hashes(root):
    return {str(p.relative_to(root)).replace('\\','/'): hashlib.sha256(p.read_bytes()).hexdigest()
            for name in names for p in sorted((root/name).rglob('*')) if p.suffix.lower() in ('.mat','.csv')}

if not finalize:
    before = hashes(source)
    for name in names:
        shutil.copytree(source/name, work/name)
    assert hashes(work) == before
    (evidence/'scientific_before.json').write_text(json.dumps(before, indent=2))
    commands = []
    for name in names:
        command = [r'C:\Program Files\MATLAB\R2026b\bin\matlab.exe', '-batch',
                   "addpath('src','tests'); r='" + str(work/name).replace('\\','/') + "'; export_scenario_viewer(r); verify_viewer_payload(r);"]
        commands.append(command)
        with (evidence/(name+'_matlab.log')).open('w') as log:
            result = subprocess.run(command, cwd=repo, stdout=log, stderr=subprocess.STDOUT)
        if result.returncode:
            print((evidence/(name+'_matlab.log')).read_text()); sys.exit(result.returncode)
        print('PASS export and payload', name, flush=True)
else:
    before = json.loads((evidence/'scientific_before.json').read_text())
    commands = ['See matlab_exports.log for the separately executed MATLAB export/verification.']
source_after, work_after = hashes(source), hashes(work)
assert source_after == before == work_after
(evidence/'preservation_checks.json').write_text(json.dumps({'source': str(source), 'work': str(work), 'fileCountPerCopy':len(before), 'sourceUnchanged':source_after==before, 'workUnchanged':work_after==before, 'commands':commands, 'scientific_after':work_after},indent=2))
standalone = work/'standalone'
for label, folder, pattern in [('comparison','batch/comparison','*_viewer.html'), ('A','independent_2_A/A','*_viewer.html'), ('B','independent_3_B/B','*_viewer.html'), ('C','independent_1_C/C','*_viewer.html')]:
    target=standalone/label; target.mkdir(parents=True, exist_ok=True)
    html=next((work/folder).glob(pattern)); shutil.copy2(html,target/html.name)
    assert len(list(target.iterdir()))==1
print('Preserved copies and isolated HTML ready:',work,flush=True)


# Compare existing presentation artifacts too; older independent runs used the
# superseded raised-column encoding, so only that presentation key may differ.
payload_checks = []
for name in names:
    for payload in sorted((work/name).rglob('presentation_payload.json')):
        relative = payload.relative_to(work)
        original = json.loads((source/relative).read_text())
        current = json.loads(payload.read_text())
        assert original.keys() == current.keys()
        changed = [key for key in original if original[key] != current[key]]
        assert all(key == 'encoding' for key in changed), relative
        manifest = json.loads(payload.with_name('presentation_manifest.json').read_text())
        for item in manifest['presentation_fingerprints']:
            assert hashlib.sha256((repo/item['path']).read_bytes()).hexdigest() == item['sha256']
        payload_checks.append({'payload': relative.as_posix(),
            'allScientificAndProvenanceFieldsIdentical': True,
            'changedPresentationKeys': changed, 'originalEncoding': original['encoding'],
            'currentEncoding': current['encoding'],
            'presentation_fingerprints': manifest['presentation_fingerprints']})
(evidence/'payload_preservation.json').write_text(json.dumps(payload_checks, indent=2))
print('PASS scientific payload preservation and current presentation fingerprints:', len(payload_checks))
