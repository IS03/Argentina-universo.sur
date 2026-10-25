import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { projectRoot, validateRepository } from "../scripts/validate-data.mjs";
import { correoValido, extraerContactos, webValida } from "../lib/contacto.ts";

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
