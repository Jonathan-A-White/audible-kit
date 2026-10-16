// The consumer smoke test: installs audible-kit the way an app does, `npm install git+file://<a fresh clone>`,
// into a scratch directory, and checks from there what a git install must deliver: `prepare` builds dist, the
// root `exports` resolve, and audibleLink, chapterStarts and wordOfPromiseStart import and work (no network).
// The "fresh clone" is the working tree as it stands (tracked and untracked files, minus what git ignores),
// committed into a scratch repository, so an edit not yet committed is smoke-tested too.
// Run: npm run smoke   (needs the network or a warm npm cache: the install runs the build with devDependencies)
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scratch = mkdtempSync(join(tmpdir(), 'audible-kit-smoke-'));
const run = (cmd, args, cwd, extra = {}) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'], ...extra });

try {
  // 1. A fresh clone of the tree.
  const clone = join(scratch, 'clone');
  mkdirSync(clone);
  const files = run('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], root).split('\0').filter(Boolean);
  for (const f of files) {
    if (!existsSync(join(root, f))) continue; // deleted in the working tree
    mkdirSync(dirname(join(clone, f)), { recursive: true });
    cpSync(join(root, f), join(clone, f));
  }
  const git = (...args) => run('git', ['-c', 'user.name=smoke', '-c', 'user.email=smoke@example.invalid', ...args], clone);
  git('init', '-q', '-b', 'main');
  git('add', '-A');
  git('commit', '-q', '-m', 'smoke');

  // 2. An app's scratch directory that installs it.
  const app = join(scratch, 'app');
  mkdirSync(app);
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'smoke-app', private: true, type: 'module' }));
  console.log('installing audible-kit from a fresh clone ...');
  run('npm', ['install', '--no-audit', '--no-fund', `git+file://${clone}`], app, { timeout: 480_000 });
  const installed = join(app, 'node_modules', 'audible-kit');
  if (!existsSync(join(installed, 'dist', 'index.js')) || !existsSync(join(installed, 'dist', 'index.d.ts'))) {
    throw new Error('dist was not built by prepare');
  }

  // 3. In node, as the app: the entry point imports; audibleLink, chapterStarts and the Word of Promise data work.
  writeFileSync(
    join(app, 'smoke.mjs'),
    `
import { audibleLink, chapterStarts, fetchChapterStarts, WORD_OF_PROMISE_ASIN, wordOfPromiseStart } from 'audible-kit';

const link = new URL(audibleLink({ asin: 'B003UC45I8', positionMs: 300423039, now: 1700000000000 }));
if (link.searchParams.get('asin') !== 'B003UC45I8') throw new Error('asin: ' + link);
if (link.searchParams.get('position_from_start') !== '300423039') throw new Error('position: ' + link);
if (link.searchParams.get('annotation_time_utc') !== '1700000000000') throw new Error('annotation time: ' + link);
if (link.searchParams.has('narration_speed')) throw new Error('narration_speed must be left out: ' + link);

const metadata = { content_metadata: { chapter_info: { chapters: [{ title: 'One', start_offset_ms: 0 }, { title: 'Two', start_offset_ms: 5 }] } } };
const starts = chapterStarts(metadata);
if (starts.length !== 2 || starts[1].title !== 'Two' || starts[1].startOffsetMs !== 5) throw new Error('chapterStarts: ' + JSON.stringify(starts));
const fetched = await fetchChapterStarts('B003UC45I8', async () => ({ ok: true, status: 200, json: async () => metadata }));
if (fetched.length !== 2) throw new Error('fetchChapterStarts: ' + JSON.stringify(fetched));

if (WORD_OF_PROMISE_ASIN !== 'B003UC45I8' || wordOfPromiseStart('Luke', 15) !== 300423039) throw new Error('word of promise');
console.log('audible-kit imports: audibleLink, chapterStarts, fetchChapterStarts and wordOfPromiseStart work');
`,
  );
  console.log(run('node', ['smoke.mjs'], app).trim());
  console.log('consumer smoke test passed');
} catch (err) {
  console.error(String(err?.stderr ?? '') || err);
  process.exitCode = 1;
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
