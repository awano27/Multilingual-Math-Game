import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..', '..');
const htmlPath = resolve(projectRoot, 'math-game-complete.html');
const htmlSource = readFileSync(htmlPath, 'utf-8').replace(/\r\n/g, '\n');

function extractSnippet(startMarker, endMarker) {
  const start = htmlSource.indexOf(startMarker);
  if (start === -1) {
    throw new Error(`Marker not found: ${startMarker}`);
  }
  const end = htmlSource.indexOf(endMarker, start);
  if (end === -1) {
    throw new Error(`End marker not found: ${endMarker}`);
  }
  return htmlSource.slice(start, end);
}

export function loadBlueprint() {
  const startMarker = 'const BLUEPRINT =';
  const endMarker = '\nconst {\n    gradeCurriculum';
  const snippet = extractSnippet(startMarker, endMarker);
  const script = `${snippet}\nmodule.exports = BLUEPRINT;`;
  const context = vm.createContext({ window: {}, module: { exports: {} } });
  vm.runInContext(script, context);
  return context.module.exports;
}

export function loadStatFactories() {
  const startMarker = 'const SUPPORTED_LANGUAGES';
  const endMarker = '\nconst MathMazeGame = () => {';
  const snippet = extractSnippet(startMarker, endMarker);
  const script = `${snippet}`;
  const context = vm.createContext({ window: {}, Set, Map });
  vm.runInContext(script, context);
  return {
    createDefaultPlayerStats: () => vm.runInContext('createDefaultPlayerStats()', context),
    normalizePlayerStats: (value) => {
      context.__input = value;
      return vm.runInContext('normalizePlayerStats(__input)', context);
    }
  };
}
