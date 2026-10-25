// Offline SSR; not a route/server and never a private-data exporter. Used with synthetic fixtures only.
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

export async function renderWorkDestination(destino) {
  const root = new URL('../../', import.meta.url);
  const work = await mkdtemp(join(tmpdir(), 'aus-work-render-'));
  const compiled = new Map();
  async function compile(relative) {
    if (compiled.has(relative)) return compiled.get(relative);
    const out = join(work, relative.replace(/\.tsx$/, '.mjs'));
    compiled.set(relative, out);
    let code = ts.transpileModule(await readFile(new URL(relative, root), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replaceAll('"react/jsx-runtime"', JSON.stringify(import.meta.resolve('react/jsx-runtime')));
    for (const [, specifier] of code.matchAll(/from ["'](@\/[^"']+)["']/g)) {
      const path = specifier.slice(2);
      if (!path.startsWith('components/')) throw Error('UNEXPECTED_RENDER_DEPENDENCY');
      const target = JSON.stringify(pathToFileURL(await compile(path + '.tsx')).href);
      code = code.replaceAll(JSON.stringify(specifier), target).replaceAll("'" + specifier + "'", target);
    }
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, code);
    return out;
  }
  try {
    const { default: DestinoArticle } = await import(pathToFileURL(await compile('components/destinos/DestinoArticle.tsx')).href);
    // Deliberate allowlist: private references and unknown payload fields never become props/JSON.
    const { id, slug, nombre, provinciaSlugs, resumen, localidades, atractivos, practicos, ubicaciones, fotos, fuentes } = destino;
    return renderToStaticMarkup(createElement(DestinoArticle, { destino: { id, slug, nombre, provinciaSlugs, resumen, localidades, atractivos, practicos, ubicaciones, fotos, fuentes } }));
  } finally { await rm(work, { recursive: true, force: true }); }
}
