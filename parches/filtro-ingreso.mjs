// Parche que se aplica en el build de Vercel (lo ejecuta build.sh) sobre los archivos de código del sitio.
// Agrega el filtro "Ingresó" (hoy / últimos 7, 15 o 30 días) según la fecha de alta de cada propiedad.
// Si algún reemplazo no encuentra exactamente el texto esperado, el build falla y producción no cambia.
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

function patch(file, reps) {
  let s = readFileSync(file, "utf8");
  if (s.includes("st.ingreso") || s.includes("state.ingreso")) { console.log(file + ": ya tenía el filtro de ingreso"); return; }
  for (const [from, to, n = 1] of reps) {
    const c = s.split(from).length - 1;
    if (c !== n) { console.error(`${file}: se esperaban ${n} apariciones y hay ${c} de:\n${from}`); process.exit(1); }
    s = s.split(from).join(to);
  }
  writeFileSync(file, s);
  const chk = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (chk.status !== 0) { console.error(file + ": error de sintaxis después del parche"); process.exit(1); }
  console.log(file + ": filtro de ingreso agregado");
}

patch("assets/core.mjs", [
  ['export const HASTA = [',
   'export const INGRESOS = [1, 7, 15, 30];\n' +
   'export const INGRESO_TXT = { 1: "Ingresaron hoy", 7: "Ingresaron en los últimos 7 días", 15: "Ingresaron en los últimos 15 días", 30: "Ingresaron en los últimos 30 días" };\n' +
   'export const HASTA = ['],
  ['  if (st.soloAmob) list = list.filter((p) => p.amoblada === true);\n',
   '  if (st.soloAmob) list = list.filter((p) => p.amoblada === true);\n' +
   '  if (st.ingreso) { const hoy = Date.parse((ctx && ctx.hoyISO) || new Date().toISOString().slice(0, 10)); list = list.filter((p) => p.alta && hoy - Date.parse(p.alta) < st.ingreso * 864e5); }\n'],
  ['  if (st.soloAmob) return `Hoy no hay',
   '  if (st.ingreso) return "No entraron oportunidades en ese período con estos filtros. Probá con un período más largo o con menos filtros.";\n  if (st.soloAmob) return `Hoy no hay'],
  ['soloAmob: false, hasta: null', 'soloAmob: false, ingreso: null, hasta: null'],
  ['  st.soloAmob = g("amoblada") === "1";\n',
   '  st.soloAmob = g("amoblada") === "1";\n  const ig = Number(g("ingreso")); if (INGRESOS.includes(ig)) st.ingreso = ig;\n'],
  ['  if (st.soloAmob) o.set("amoblada", "1");\n',
   '  if (st.soloAmob) o.set("amoblada", "1");\n  if (st.ingreso) o.set("ingreso", String(st.ingreso));\n'],
  ['  if (st.soloAmob) f.push(["amoblada", "Amobladas"]);\n',
   '  if (st.soloAmob) f.push(["amoblada", "Amobladas"]);\n  if (st.ingreso) f.push(["ingreso", INGRESO_TXT[st.ingreso]]);\n'],
]);

patch("assets/app.mjs", [
  ['  function syncControls() {\n',
   '  // Selector "Ingresó" (fecha de alta), con el mismo formato que el de dormitorios.\n' +
   '  const fdw = $("field-dorm");\n' +
   '  if (fdw && !$("f-ingreso")) {\n' +
   '    const w = fdw.cloneNode(true);\n' +
   '    w.id = "field-ingreso"; w.hidden = false;\n' +
   '    const sl = w.querySelector("select");\n' +
   '    if (sl) {\n' +
   '      sl.id = "f-ingreso"; sl.removeAttribute("name");\n' +
   '      sl.innerHTML = \'<option value="">Cualquier fecha</option><option value="1">Hoy</option><option value="7">Últimos 7 días</option><option value="15">Últimos 15 días</option><option value="30">Últimos 30 días</option>\';\n' +
   '      const lb = w.querySelector("label");\n' +
   '      if (lb) { lb.htmlFor = "f-ingreso"; lb.textContent = "Ingresó"; }\n' +
   '      fdw.insertAdjacentElement("afterend", w);\n' +
   '    }\n' +
   '  }\n\n' +
   '  function syncControls() {\n'],
  ['    set("f-refac", state.soloRefac, "checked"); set("f-amob", state.soloAmob, "checked");\n',
   '    set("f-refac", state.soloRefac, "checked"); set("f-amob", state.soloAmob, "checked");\n    set("f-ingreso", state.ingreso ? String(state.ingreso) : "");\n'],
  ['  on("f-amob", "change", change((e) => { state.soloAmob = e.target.checked; }));\n',
   '  on("f-amob", "change", change((e) => { state.soloAmob = e.target.checked; }));\n  on("f-ingreso", "change", change((e) => { state.ingreso = Number(e.target.value) || null; }));\n'],
  ['soloAmob: false, hasta: null', 'soloAmob: false, ingreso: null, hasta: null', 2],
  ['amoblada: () => (state.soloAmob = false) })[k]', 'amoblada: () => (state.soloAmob = false), ingreso: () => (state.ingreso = null) })[k]'],
]);
