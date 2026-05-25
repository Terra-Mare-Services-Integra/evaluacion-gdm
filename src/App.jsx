import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";

const PORTAL_URL = "https://evaluacion-proyectos.vercel.app";
const TABLE_BARCOS = "gdm_barcos";
const TABLE_ESCENARIOS = "gdm_escenarios";

const TABS = [
  { id: "barcos",      label: "Barcos",       icon: "🚢" },
  { id: "puertos",     label: "Puertos",      icon: "🏗️" },
  { id: "servicios",   label: "Servicios",    icon: "⚙️" },
  { id: "pl",          label: "P&L",          icon: "📊" },
  { id: "cashflow",    label: "Cashflow",     icon: "💰" },
  { id: "comparacion", label: "Comparación",  icon: "📐" },
];

const BARCO_DEFAULT = {
  nombre: "Nuevo Barco",
  tipo: "FSV / Crew Boat",
  estado: "propio_amortizado",
  precio_compra: 0,
  arancel_pct: 0,
  capex_refit: 0,
  deuda_pct: 0,
  tasa_deuda: 0,
  velocidad_crucero: 8,
  velocidad_max: 10,
  cap_alije_m2: 0,
  cap_agua_m3: 250,
  cap_slop_m3: 100,
  cap_lubricantes_drums: 250,
  consumo_navegando: 8,
  consumo_operando: 2.67,
  consumo_puerto: 0.89,
  precio_vlsfo: 1000,
  trip_costo_operando: 2768,
  trip_costo_puerto: 1000,
  opex_mantenimiento: 30000,
  opex_drydock: 60000,
  opex_seguros: 60000,
  opex_comunicaciones: 3000,
  opex_prefectura: 4400,
  opex_admin: 60000,
  opex_portuario: 60000,
  opex_retiro_slob: 7000,
  vida_util: 20,
  valor_residual_pct: 0.4,
  anio_salida: 7,
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#213363;--blue:#235C96;--mid:#6381A7;--light:#A5B5CC;
  --bg:#EEF2F7;--surface:#FFFFFF;--border:#D6E0ED;
  --text:#213363;--muted:#6381A7;
  --green:#166534;--green-bg:#F0FDF4;--green-border:#86EFAC;
  --red:#991B1B;--red-bg:#FEF2F2;--red-border:#FECACA;
  --gold:#B07D0A;--gold-bg:#FFFBEB;--gold-border:#D4B84A;
  --sans:'Montserrat',sans-serif;--mono:'DM Mono',monospace;
}
body{font-family:var(--sans);background:var(--bg);color:var(--text);min-height:100vh}

.hdr{background:var(--navy);padding:0 20px;display:flex;align-items:center;justify-content:space-between;height:54px;position:sticky;top:0;z-index:100;box-shadow:0 2px 10px rgba(33,51,99,.3)}
.hdr-brand{display:flex;flex-direction:column}
.hdr-title{font-size:12px;font-weight:800;color:#fff;letter-spacing:.3px}
.hdr-sub{font-size:8px;color:rgba(255,255,255,.4);font-family:var(--mono)}
.back{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.7);font-size:9px;font-weight:600;padding:4px 10px;border-radius:5px;cursor:pointer}
.back:hover{background:rgba(255,255,255,.2);color:#fff}

.tabs{background:#fff;border-bottom:1px solid var(--border);display:flex;padding:0 16px;overflow-x:auto;position:sticky;top:54px;z-index:99}
.tabs::-webkit-scrollbar{height:3px}
.tab{padding:11px 14px;border:none;background:transparent;color:var(--muted);font-size:10px;font-weight:600;border-bottom:2px solid transparent;white-space:nowrap;cursor:pointer;transition:all .15s;font-family:var(--sans)}
.tab.on{color:var(--navy);border-bottom-color:var(--blue)}

.page{max-width:1200px;margin:0 auto;padding:16px 16px 60px}

.card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:12px}
.sec{font-size:8px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px}

.selector{display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap}
.sel-btn{padding:6px 14px;border-radius:20px;border:1.5px solid var(--border);background:#F5F7FA;color:var(--muted);font-size:10px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .15s}
.sel-btn.on{background:var(--navy);border-color:var(--navy);color:#fff}
.sel-btn.add{border-style:dashed;color:var(--light)}
.sel-btn.add:hover{border-color:var(--blue);color:var(--blue)}
.sel-btn:hover:not(.on):not(.add){border-color:var(--blue);color:var(--navy)}

.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
@media(max-width:768px){.g2{grid-template-columns:1fr}.g3{grid-template-columns:1fr 1fr}}
@media(max-width:480px){.g3{grid-template-columns:1fr}}

.campo{margin-bottom:8px}
.campo-label{font-size:8px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
.campo-input{width:100%;border:1px solid var(--gold-border);border-radius:6px;padding:6px 8px;font-size:12px;background:var(--gold-bg);color:#78610E;font-family:var(--sans)}
.campo-input:focus{outline:none;border-color:var(--gold)}
select.campo-input{cursor:pointer}

.costo-pills{display:flex;gap:6px;margin-top:8px}
.costo-pill{flex:1;border-radius:8px;padding:8px;text-align:center;background:var(--green-bg);border:1px solid var(--green-border)}
.costo-pill-v{font-size:13px;font-weight:800;font-family:var(--mono);color:var(--green)}
.costo-pill-l{font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-top:2px}

.opex-total{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)}
.opex-total-label{font-size:9px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.opex-total-val{font-size:18px;font-weight:800;font-family:var(--mono);color:var(--navy)}

.btn{padding:7px 16px;border-radius:7px;border:none;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--sans);transition:all .15s;letter-spacing:.3px}
.btn-primary{background:var(--navy);color:#fff}
.btn-primary:hover:not(:disabled){background:var(--blue)}
.btn-primary:disabled{background:var(--light);cursor:not-allowed}
.btn-danger{background:var(--red-bg);color:var(--red);border:1px solid var(--red-border)}
.btn-danger:hover:not(:disabled){background:#FEE2E2}
.btn-danger:disabled{opacity:.5;cursor:not-allowed}

.msg{padding:10px 14px;border-radius:8px;font-size:12px;margin-bottom:10px}
.msg-err{background:var(--red-bg);color:var(--red);border:1px solid var(--red-border)}
.msg-ok{background:var(--green-bg);color:var(--green);border:1px solid var(--green-border)}

.pronto{display:flex;align-items:center;justify-content:center;height:300px;flex-direction:column;gap:12px;color:var(--muted)}
.pronto-icon{font-size:36px}
.pronto-text{font-size:12px;font-weight:600}
.pronto-sub{font-size:10px;color:var(--light)}

.loading{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--navy)}
.loading-text{font-family:var(--mono);font-size:11px;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase}

.empty-state{text-align:center;padding:40px;color:var(--muted);font-size:12px}
`;

const fmt    = (n) => (n ?? 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtUSD = (n) => `$${fmt(n)}`;
const calcOpexFijo = (b) =>
  (b.opex_mantenimiento || 0) + (b.opex_drydock || 0) + (b.opex_seguros || 0) +
  (b.opex_comunicaciones || 0) + (b.opex_prefectura || 0) + (b.opex_admin || 0) +
  (b.opex_portuario || 0) + (b.opex_retiro_slob || 0);

function TabBarcos() {
  const [barcos, setBarcos]   = useState([]);
  const [selIdx, setSelIdx]   = useState(0);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);
  const [loading, setLoading] = useState(true);

  const showMsg = useCallback((type, text) => {
    setMsg({ type, text });
    if (type === "ok") setTimeout(() => setMsg(null), 3000);
  }, []);

  const loadBarcos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLE_BARCOS).select("*").order("created_at");
      if (error) throw error;
      if (data.length === 0) {
        const { data: nuevo, error: e2 } = await supabase
          .from(TABLE_BARCOS)
          .insert({ ...BARCO_DEFAULT, nombre: "Golondrina de Mar" })
          .select()
          .single();
        if (e2) throw e2;
        setBarcos([nuevo]);
        setSelIdx(0);
      } else {
        setBarcos(data);
        setSelIdx(0);
      }
    } catch (e) {
      showMsg("err", `Error al cargar barcos: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [showMsg]);

  useEffect(() => { loadBarcos(); }, [loadBarcos]);

  const set = useCallback((k, v) => {
    setBarcos(prev => prev.map((b, i) => i === selIdx ? { ...b, [k]: v } : b));
  }, [selIdx]);

  const guardar = async () => {
    const barco = barcos[selIdx];
    if (!barco) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from(TABLE_BARCOS).update(barco).eq("id", barco.id);
      if (error) throw error;
      showMsg("ok", "Cambios guardados correctamente.");
    } catch (e) {
      showMsg("err", `No se pudieron guardar los cambios: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const nuevoBarco = async () => {
    if (barcos.length >= 5) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from(TABLE_BARCOS)
        .insert({ ...BARCO_DEFAULT, nombre: `Barco ${barcos.length + 1}` })
        .select()
        .single();
      if (error) throw error;
      setBarcos(prev => {
        const updated = [...prev, data];
        setSelIdx(updated.length - 1);
        return updated;
      });
    } catch (e) {
      showMsg("err", `No se pudo crear el barco: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    const barco = barcos[selIdx];
    if (!barco) return;
    if (!window.confirm(`¿Eliminar "${barco.nombre}"? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    try {
      const { error: e1 } = await supabase
        .from(TABLE_ESCENARIOS).delete().eq("barco_id", barco.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from(TABLE_BARCOS).delete().eq("id", barco.id);
      if (e2) throw e2;
      setBarcos(prev => {
        const updated = prev.filter((_, i) => i !== selIdx);
        setSelIdx(Math.max(0, selIdx - 1));
        return updated;
      });
      showMsg("ok", "Barco eliminado.");
    } catch (e) {
      showMsg("err", `No se pudo eliminar el barco: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state">Cargando barcos...</div>;

  const barco = barcos[selIdx];
  if (!barco) return <div className="empty-state">No hay barcos cargados.</div>;

  const costoCombNavegando = (barco.consumo_navegando || 0) * (barco.precio_vlsfo || 0);
  const costoCombOperando  = (barco.consumo_operando  || 0) * (barco.precio_vlsfo || 0);
  const costoCombPuerto    = (barco.consumo_puerto    || 0) * (barco.precio_vlsfo || 0);
  const capexTotal = (barco.precio_compra || 0) * (1 + (barco.arancel_pct || 0) / 100) + (barco.capex_refit || 0);
  const opexFijo   = calcOpexFijo(barco);

  return (
    <div>
      {msg && <div className={`msg ${msg.type === "err" ? "msg-err" : "msg-ok"}`}>{msg.text}</div>}

      <div className="selector">
        {barcos.map((b, i) => (
          <button key={b.id} className={`sel-btn ${i === selIdx ? "on" : ""}`} onClick={() => setSelIdx(i)}>
            🚢 {b.nombre}
          </button>
        ))}
        {barcos.length < 5 && (
          <button className="sel-btn add" onClick={nuevoBarco} disabled={saving}>+ Nuevo barco</button>
        )}
      </div>

      <div className="g2">
        <div className="card">
          <div className="sec">① Identidad</div>
          <div className="g2">
            <div className="campo"><div className="campo-label">Nombre</div>
              <input className="campo-input" value={barco.nombre || ""} onChange={e => set("nombre", e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Tipo</div>
              <input className="campo-input" value={barco.tipo || ""} onChange={e => set("tipo", e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Estado</div>
              <select className="campo-input" value={barco.estado || "propio_amortizado"} onChange={e => set("estado", e.target.value)}>
                <option value="propio_amortizado">Propio (amortizado)</option>
                <option value="propio_financiar">Propio (a financiar)</option>
                <option value="tc">Time Charter (TC)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="sec">② Adquisición / Financiamiento</div>
          <div className="g2">
            <div className="campo"><div className="campo-label">Precio de compra (USD)</div>
              <input className="campo-input" type="number" value={barco.precio_compra ?? 0} onChange={e => set("precio_compra", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Aranceles + despacho (%)</div>
              <input className="campo-input" type="number" value={barco.arancel_pct ?? 0} onChange={e => set("arancel_pct", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">CAPEX refit (USD)</div>
              <input className="campo-input" type="number" value={barco.capex_refit ?? 0} onChange={e => set("capex_refit", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">% Deuda</div>
              <input className="campo-input" type="number" value={barco.deuda_pct ?? 0} onChange={e => set("deuda_pct", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Tasa deuda anual (%)</div>
              <input className="campo-input" type="number" value={barco.tasa_deuda ?? 0} onChange={e => set("tasa_deuda", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Año de salida</div>
              <input className="campo-input" type="number" value={barco.anio_salida ?? 7} onChange={e => set("anio_salida", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Valor residual (%)</div>
              <input className="campo-input" type="number" value={barco.valor_residual_pct ?? 0} onChange={e => set("valor_residual_pct", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Vida útil (años)</div>
              <input className="campo-input" type="number" value={barco.vida_util ?? 20} onChange={e => set("vida_util", +e.target.value)} /></div>
          </div>
          <div style={{marginTop:8,padding:"8px 10px",background:"var(--bg)",borderRadius:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:9,color:"var(--muted)",fontWeight:700,textTransform:"uppercase"}}>CAPEX total</span>
            <span style={{fontSize:14,fontWeight:800,fontFamily:"var(--mono)"}}>{fmtUSD(capexTotal)}</span>
          </div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="sec">③ Performance operativa</div>
          <div className="g3">
            <div className="campo"><div className="campo-label">Velocidad crucero (kn)</div>
              <input className="campo-input" type="number" value={barco.velocidad_crucero ?? 0} onChange={e => set("velocidad_crucero", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Velocidad máx (kn)</div>
              <input className="campo-input" type="number" value={barco.velocidad_max ?? 0} onChange={e => set("velocidad_max", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Cap. alije (m²)</div>
              <input className="campo-input" type="number" value={barco.cap_alije_m2 ?? 0} onChange={e => set("cap_alije_m2", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Cap. agua (m³)</div>
              <input className="campo-input" type="number" value={barco.cap_agua_m3 ?? 0} onChange={e => set("cap_agua_m3", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Cap. slop (m³)</div>
              <input className="campo-input" type="number" value={barco.cap_slop_m3 ?? 0} onChange={e => set("cap_slop_m3", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Cap. lubricantes (drums)</div>
              <input className="campo-input" type="number" value={barco.cap_lubricantes_drums ?? 0} onChange={e => set("cap_lubricantes_drums", +e.target.value)} /></div>
          </div>
        </div>

        <div className="card">
          <div className="sec">④ Consumo combustible</div>
          <div className="g2">
            <div className="campo"><div className="campo-label">Navegando (Tn/día)</div>
              <input className="campo-input" type="number" value={barco.consumo_navegando ?? 0} onChange={e => set("consumo_navegando", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Operando (Tn/día)</div>
              <input className="campo-input" type="number" value={barco.consumo_operando ?? 0} onChange={e => set("consumo_operando", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">En puerto (Tn/día)</div>
              <input className="campo-input" type="number" value={barco.consumo_puerto ?? 0} onChange={e => set("consumo_puerto", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Precio VLSFO (USD/Tn)</div>
              <input className="campo-input" type="number" value={barco.precio_vlsfo ?? 0} onChange={e => set("precio_vlsfo", +e.target.value)} /></div>
          </div>
          <div className="costo-pills">
            <div className="costo-pill">
              <div className="costo-pill-v">{fmtUSD(costoCombNavegando)}</div>
              <div className="costo-pill-l">Navegando/día</div>
            </div>
            <div className="costo-pill">
              <div className="costo-pill-v">{fmtUSD(costoCombOperando)}</div>
              <div className="costo-pill-l">Operando/día</div>
            </div>
            <div className="costo-pill">
              <div className="costo-pill-v">{fmtUSD(costoCombPuerto)}</div>
              <div className="costo-pill-l">Puerto/día</div>
            </div>
          </div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="sec">⑤ Tripulación</div>
          <div className="g2">
            <div className="campo"><div className="campo-label">Costo total operando (USD/día)</div>
              <input className="campo-input" type="number" value={barco.trip_costo_operando ?? 0} onChange={e => set("trip_costo_operando", +e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Costo total en puerto (USD/día)</div>
              <input className="campo-input" type="number" value={barco.trip_costo_puerto ?? 0} onChange={e => set("trip_costo_puerto", +e.target.value)} /></div>
          </div>
          <div style={{fontSize:9,color:"var(--muted)",fontStyle:"italic",marginTop:4}}>
            * Desglose por rol disponible próximamente
          </div>
        </div>

        <div className="card">
          <div className="sec">⑥ OPEX fijo anual (USD)</div>
          <div className="g2">
            {[
              ["opex_mantenimiento",  "Mantenimiento"],
              ["opex_drydock",        "Dry dock / dique seco"],
              ["opex_seguros",        "Seguros (H&M + P&I)"],
              ["opex_comunicaciones", "Comunicaciones / satélite"],
              ["opex_prefectura",     "Prefectura / habilitaciones"],
              ["opex_admin",          "Administración"],
              ["opex_portuario",      "Gastos portuarios"],
              ["opex_retiro_slob",    "Retiro SLOB"],
            ].map(([key, label]) => (
              <div className="campo" key={key}>
                <div className="campo-label">{label}</div>
                <input className="campo-input" type="number" value={barco[key] ?? 0} onChange={e => set(key, +e.target.value)} />
              </div>
            ))}
          </div>
          <div className="opex-total">
            <span className="opex-total-label">OPEX fijo total / año</span>
            <span className="opex-total-val">{fmtUSD(opexFijo)}</span>
          </div>
        </div>
      </div>

      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
        {barcos.length > 1 && (
          <button className="btn btn-danger" onClick={eliminar} disabled={saving}>Eliminar barco</button>
        )}
        <button className="btn btn-primary" onClick={guardar} disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

function Pronto({ label }) {
  return (
    <div className="pronto">
      <div className="pronto-icon">🚧</div>
      <div className="pronto-text">{label}</div>
      <div className="pronto-sub">En desarrollo — próxima entrega</div>
    </div>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd]     = useState("");
  const [err, setErr]     = useState("");
  const [busy, setBusy]   = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    if (error) setErr("Email o contraseña incorrectos.");
    setBusy(false);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0f1d4a,#1a2a5e,#213363)",padding:20}}>
      <div style={{background:"#fff",borderRadius:16,padding:40,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
        <div style={{textAlign:"center",fontSize:32,marginBottom:12}}>🚢</div>
        <div style={{textAlign:"center",fontSize:17,fontWeight:700,color:"var(--navy)",marginBottom:4}}>Evaluación GdM</div>
        <div style={{textAlign:"center",fontSize:11,color:"var(--muted)",marginBottom:24,fontFamily:"var(--mono)"}}>Grupo Marítimo · Análisis financiero</div>
        {err && <div className="msg msg-err">{err}</div>}
        <form onSubmit={submit}>
          <div className="campo"><div className="campo-label">Email</div>
            <input className="campo-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus placeholder="tu@email.com" /></div>
          <div className="campo"><div className="campo-label">Contraseña</div>
            <input className="campo-input" type="password" value={pwd} onChange={e => setPwd(e.target.value)} required placeholder="••••••••" /></div>
          <button type="submit" className="btn btn-primary" style={{width:"100%",marginTop:8,padding:11}} disabled={busy}>
            {busy ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("barcos");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <><style>{CSS}</style><div className="loading"><div className="loading-text">Cargando...</div></div></>;
  if (!session) return <><style>{CSS}</style><LoginPage /></>;

  return (
    <>
      <style>{CSS}</style>
      <header className="hdr">
        <div className="hdr-brand">
          <div className="hdr-title">🚢 Evaluación GdM — Modelo Financiero</div>
          <div className="hdr-sub">Grupo Marítimo · Análisis comparativo de activos</div>
        </div>
        <button className="back" onClick={() => window.open(PORTAL_URL, "_self")}>← Portal</button>
      </header>
      <nav className="tabs">
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </nav>
      <div className="page">
        {tab === "barcos"      && <TabBarcos />}
        {tab === "puertos"     && <Pronto label="Puertos — próximamente" />}
        {tab === "servicios"   && <Pronto label="Servicios — próximamente" />}
        {tab === "pl"          && <Pronto label="P&L — próximamente" />}
        {tab === "cashflow"    && <Pronto label="Cashflow — próximamente" />}
        {tab === "comparacion" && <Pronto label="Comparación — próximamente" />}
      </div>
    </>
  );
}
