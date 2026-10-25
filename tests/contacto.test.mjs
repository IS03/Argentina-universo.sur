import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, mkdir, writeFile, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { projectRoot, validateRepository } from "../scripts/validate-data.mjs";
import { correoValido, extraerContactos, webValida } from "../lib/contacto.ts";
import { whatsappArgentina, enlaceWhatsapp, enlaceTelefono, primerNumero } from "../lib/telefono.ts";
import { exportarOficinas } from "../scripts/santa-fe/exportar-oficinas.mjs";

const json = async path => JSON.parse(await readFile(join(projectRoot, path), "utf8"));

test("correos malformados o de relleno no se aceptan", () => {
  for (const malo of [
    "info@loreipsumcom", "info@loremipsum.com", "contacto@lorem.ipsum.com.ar", "foo@example.com", "turismo@prueba.gob.ar",
    "a@b", "x@y.c", "user@@x.com", "a b@x.com", ".a@x.com", "a.@x.com", "a..b@x.com", "a@-x.com", "a@x-.com", "@x.com", "a@", "a@x..com",
  ]) assert.equal(correoValido(malo), false, malo);
  for (const bueno of ["turismo@santafeciudad.gov.ar", "turismo.coronda@gmail.com", "museo_mv@yahoo.com.ar", "dtestero@aucklandturismo.com"]) {
    assert.equal(correoValido(bueno), true, bueno);
  }
});

test("un texto con @ nunca se devuelve entero como dirección: se separa y se valida cada parte", () => {
  assert.deepEqual(extraerContactos("info@loreipsumcom"), { correos: [], webs: [], invalidos: ["info@loreipsumcom"] });
  assert.deepEqual(extraerContactos("turismo@reconquista.gov.ar / www.turismovillaocampo.gob.ar"), {
    correos: ["turismo@reconquista.gov.ar"], webs: ["https://www.turismovillaocampo.gob.ar/"], invalidos: [],
  });
  assert.deepEqual(extraerContactos("museo_mv@yahoo.com.ar; info@museogoldman.com.ar").correos, ["museo_mv@yahoo.com.ar", "info@museogoldman.com.ar"]);
  assert.deepEqual(extraerContactos("Web: www.esperanza.tur.ar").webs, ["https://www.esperanza.tur.ar/"]);
  assert.deepEqual(extraerContactos("(Sitio web) sauceviejo.gob.ar").webs, ["https://sauceviejo.gob.ar/"]);
  assert.deepEqual(extraerContactos(null), { correos: [], webs: [], invalidos: [] });
  assert.equal(webValida("javascript:alert(1)"), null);
  assert.equal(webValida("https://usuario:clave@sitio.gob.ar"), null);
  assert.equal(webValida("www.example.com"), null);
});

test("los contactos de Santa Fe no tienen correos inválidos y la validación de datos lo exige", async () => {
  const oficinas = await json("public/santa-fe/json/oficinas_informes.json");
  const agencias = await json("public/santa-fe/json/agencias.json");
  for (const valor of [...oficinas.map(o => o["Correo/Web"]), ...agencias.map(a => a["Correo electrónico"])]) {
    assert.deepEqual(extraerContactos(valor).invalidos, [], String(valor));
  }
  assert.deepEqual((await validateRepository()).errors, []);
});

test("Santa Fe capital usa el correo de la Dirección de Turismo municipal y conserva el resto del registro", async () => {
  const oficinas = await json("public/santa-fe/json/oficinas_informes.json");
  const santaFe = oficinas.find(o => o.Localidad === "Santa Fe");
  // Fuente: https://santafeciudad.gov.ar/santafe_capital/informacion-para-turistas (consultada el
  // 2026-10-25, ver docs/pr16/CONTACTO-SANTA-FE.md).
  assert.equal(santaFe["Correo/Web"], "turismo@santafeciudad.gov.ar");
  assert.equal(santaFe["Teléfono/WhatsApp"], "TE: 342 4571831 / WA: +54 3424063525 / +54 342 4574124");
  assert.match(santaFe["Direcciones y horarios"], /^Terminal de ómnibus – lunes a viernes de 7 a 20 hs\.;.*Puerto: Cabecera del Dique\s1$/); // \s: el original usa un espacio no separable
  assert.equal(JSON.stringify(oficinas).includes("loreipsum"), false);
});

test("WhatsApp: formato internacional argentino solo con dígitos (54 + 9 + área sin 0 + número sin 15)", () => {
  for (const [entrada, esperado] of [
    ["+54 341 5795884", "5493415795884"],
    ["+54 3424063525", "5493424063525"],
    ["342-4063525", "5493424063525"],
    ["0342 15 4063525", "5493424063525"],
    ["+54 9 342 406-3525", "5493424063525"],
    ["54 9 11 1234 5678", "5491112345678"],
    ["+54 11 15 1234 5678", "5491112345678"],
  ]) assert.equal(whatsappArgentina(entrada), esperado, entrada);
  // Incompletos o ambiguos: sin enlace antes que un enlace equivocado.
  for (const malo of ["4063525", "+54 341", "", "WA:", "12345678901234"]) assert.equal(whatsappArgentina(malo), null, malo);
  assert.equal(enlaceWhatsapp("+54 341 5795884"), "https://wa.me/5493415795884");
  assert.doesNotMatch(enlaceWhatsapp("+54 3424063525"), /\+|\s|-/);
});

test("teléfonos: el primer número de cada campo, con raya interna o entre dos números, en formato nacional", () => {
  assert.equal(primerNumero("TE: 0341 – 4802230 / WA: +54 341 5795884 / +54 341 5820955", "TE"), "0341 – 4802230");
  assert.equal(primerNumero("TE: 0341 – 4802230 / WA: +54 341 5795884 / +54 341 5820955", "WA"), "+54 341 5795884");
  assert.equal(primerNumero("TE: 03405414216 – 3405502920", "TE"), "03405414216");
  assert.equal(primerNumero("TE: 03405 493015 / Cel: 340 5514343", "Cel"), "340 5514343");
  assert.equal(primerNumero("TE: 3482466209", "WA"), null);
  assert.equal(enlaceTelefono("0341 – 4802230"), "tel:03414802230");
  assert.equal(enlaceTelefono("342 4571831"), "tel:03424571831");
  assert.equal(enlaceTelefono("03465 499521"), "tel:03465499521");
  assert.equal(enlaceTelefono("4063525"), null);
});

test("todas las oficinas con WhatsApp generan un wa.me válido y los teléfonos un tel: completo", async () => {
  const oficinas = await json("public/santa-fe/json/oficinas_informes.json");
  let conWhatsapp = 0;
  for (const oficina of oficinas) {
    const texto = oficina["Teléfono/WhatsApp"];
    const wa = primerNumero(texto, "WA");
    if (wa) {
      conWhatsapp++;
      assert.match(enlaceWhatsapp(wa), /^https:\/\/wa\.me\/549\d{10}$/, oficina.Localidad);
    }
    const te = primerNumero(texto, "TE") ?? primerNumero(texto, "Cel");
    if (te) assert.match(enlaceTelefono(te), /^tel:0\d{10}$/, oficina.Localidad);
  }
  assert.equal(conWhatsapp, 2);
  const agencias = await json("public/santa-fe/json/agencias.json");
  for (const agencia of agencias) assert.match(enlaceTelefono(agencia["Teléfono/Celular"].split(/\s*[/;]\s*/)[0]), /^tel:0\d{10}$/, agencia.Agencia);
});

test("Villa Ocampo usa el correo de su sitio oficial de turismo, no el de Reconquista", async () => {
  const oficinas = await json("public/santa-fe/json/oficinas_informes.json");
  const villaOcampo = oficinas.find(o => o.Localidad === "Villa Ocampo");
  assert.deepEqual(extraerContactos(villaOcampo["Correo/Web"]).correos, ["turismovocampo55@gmail.com"]);
  assert.equal(villaOcampo["Teléfono/WhatsApp"], "TE: 3482466209");
  assert.equal(oficinas.find(o => o.Localidad === "Reconquista")["Correo/Web"], "turismo@reconquista.gov.ar");
});

test("el JSON publicado es la exportación de la planilla histórica más las correcciones documentadas", async t => {
  const { contenido, errores } = await exportarOficinas();
  assert.deepEqual(errores, []);
  assert.equal(await readFile(join(projectRoot, "public/santa-fe/json/oficinas_informes.json"), "utf8"), contenido);
  const correcciones = await json("data/correcciones/oficinas_informes.json");
  assert.deepEqual(correcciones.map(c => c.localidad), ["Santa Fe", "Villa Ocampo"]);
  for (const c of correcciones) assert.match(c.fuente.url, /^https:\/\/[^/]+\.gov?\.ar\b|^https:\/\/[^/]+\.gob\.ar\b/);

  // Una planilla editada (o una corrección que ya no coincide) no se exporta en silencio.
  const raiz = await mkdtemp(join(tmpdir(), "aus-oficinas-")); t.after(() => rm(raiz, { recursive: true, force: true }));
  for (const dir of ["public/santa-fe", "docs/supabase", "data/correcciones"]) await mkdir(join(raiz, dir), { recursive: true });
  for (const archivo of ["public/santa-fe/oficinas_informes.xlsx", "docs/supabase/media-inventory.json"]) await copyFile(join(projectRoot, archivo), join(raiz, archivo));
  const desactualizadas = correcciones.map(c => ({ ...c, valorEnPlanilla: c.valorEnPlanilla + " (otro)" }));
  await writeFile(join(raiz, "data/correcciones/oficinas_informes.json"), JSON.stringify(desactualizadas));
  assert.ok((await exportarOficinas(raiz)).errores.some(e => e.includes("La planilla cambió en «Santa Fe»")));
  await writeFile(join(raiz, "public/santa-fe/oficinas_informes.xlsx"), "planilla editada");
  assert.ok((await exportarOficinas(raiz)).errores.some(e => e.includes("no coincide con su hash de inventario")));
});
