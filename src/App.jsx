import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";

const PORTAL_URL = "https://evaluacion-proyectos.vercel.app";
const TABLE_BARCOS               = "gdm_barcos";
const TABLE_ESCENARIOS           = "gdm_escenarios";
const TABLE_CONSUMOS             = "gdm_consumos";
const TABLE_TRIPULACION          = "gdm_tripulacion";
const TABLE_PUERTOS              = "gdm_puertos";
const TABLE_SERVICIOS            = "gdm_servicios";
const TABLE_ESCENARIOS_SERVICIO  = "gdm_escenarios_servicio";

const TABS = [
  { id: "barcos",      label: "Barcos",           icon: "🚢" },
  { id: "puertos",     label: "Puerto & Costos",  icon: "🏗️" },
  { id: "alije",       label: "Alije",            icon: "⚓" },
  { id: "agua",        label: "Entrega de Agua",  icon: "💧" },
  { id: "slop",        label: "Transporte Slop",  icon: "🛢️" },
  { id: "lubricantes", label: "Lubricantes",      icon: "🔧" },
  { id: "pl",          label: "P&L",              icon: "📊" },
  { id: "cashflow",    label: "Cashflow",         icon: "💰" },
  { id: "comparacion", label: "Comparación",      icon: "📐" },
];

const POSICIONES = [
  "Capitán", "1er Oficial", "2do Oficial",
  "Jefe de Máquina", "1ero de Máquina", "2do de Máquina",
  "Cabo", "Contramaestre", "Cocinero", "Marinero",
];

const VELOCIDADES_DEFAULT = [6, 7, 8, 9, 10, 11, 12, 13];

const BARCO_DEFAULT = {
  nombre: "Nuevo Barco",
  tipo: "FSV / Crew Boat",
  estado: "propio_amortizado",
  precio_compra: 0,
  velocidad_crucero: 8,
  arancel_pct: 0,
  capex_refit: 0,
  deuda_pct: 0,
  tasa_deuda: 0,
  cap_agua_m3: 0,
  cap_slop_m3: 0,
  cap_lubricantes_drums: 0,
  cap_carga_general_tn: 0,
  consumo_puerto: 0.89,
  lubricante_pct_puerto: 3,
  vida_util: 20,
  valor_residual_pct: 0.4,
  anio_salida: 7,
  opex_mantenimiento: 30000,
  opex_seguros: 60000,
  opex_comunicaciones: 3000,
  opex_prefectura: 4400,
  opex_admin: 60000,
  opex_retiro_slob: 7000,
  drydock_full_costo: 500000,
  drydock_full_cada_anios: 4,
  drydock_full_meses: 2,
  drydock_intermedio_costo: 250000,
  drydock_intermedio_cada_anios: 2,
  drydock_intermedio_meses: 2,
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
.g4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px}
@media(max-width:900px){.g4{grid-template-columns:1fr 1fr}}
@media(max-width:768px){.g2{grid-template-columns:1fr}.g3{grid-template-columns:1fr 1fr}}
@media(max-width:480px){.g3{grid-template-columns:1fr}.g4{grid-template-columns:1fr 1fr}}

.campo{margin-bottom:8px}
.campo-label{font-size:8px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
.campo-input{width:100%;border:1px solid var(--gold-border);border-radius:6px;padding:6px 8px;font-size:12px;background:var(--gold-bg);color:#78610E;font-family:var(--sans)}
.campo-input:focus{outline:none;border-color:var(--gold)}
select.campo-input{cursor:pointer}
.campo-formula{width:100%;border:1px solid var(--border);border-radius:6px;padding:6px 8px;font-size:11px;background:#F9FAFB;color:#374151;font-family:var(--mono)}

/* TABLAS */
.data-table{width:100%;border-collapse:collapse;font-size:11px}
.data-table th{background:var(--navy);color:rgba(255,255,255,.75);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:7px 10px;text-align:center}
.data-table th:first-child{text-align:left}
.data-table td{padding:4px 6px;border-bottom:1px solid #EEF2F7;text-align:center}
.data-table td:first-child{text-align:left;font-weight:600;color:var(--navy)}
.data-table tr:nth-child(even) td{background:#F9FAFB}
.data-table tr.puerto-row td{background:var(--gold-bg);font-style:italic}
.data-table .tbl-input{width:100%;border:1px solid var(--gold-border);border-radius:4px;padding:4px 6px;font-size:11px;background:var(--gold-bg);color:#78610E;font-family:var(--sans);text-align:center}
.data-table .tbl-input:focus{outline:none;border-color:var(--gold)}
.field-input{width:100%;border:1px solid var(--gold-border);border-radius:4px;padding:4px 6px;font-size:11px;background:var(--gold-bg);color:#78610E;font-family:var(--sans)}
.field-input:focus{outline:none;border-color:var(--gold)}
select.field-input{cursor:pointer}
.field-formula{width:100%;border:1px solid var(--border);border-radius:4px;padding:4px 6px;font-size:11px;background:#F0F4F8;color:var(--navy);font-family:var(--mono);font-weight:700;cursor:default}
.data-table .tbl-formula{width:100%;border:1px solid var(--border);border-radius:4px;padding:4px 6px;font-size:10px;background:#F9FAFB;color:#374151;font-family:var(--mono);text-align:center}
.data-table .tbl-stat{width:100%;border:1px solid var(--green-border);border-radius:4px;padding:4px 6px;font-size:10px;background:var(--green-bg);color:var(--green);font-family:var(--mono);text-align:center;font-weight:700}
.tbl-pct-wrap{display:flex;align-items:center;gap:3px}
.tbl-pct-wrap .tbl-input{flex:1}
.tbl-pct-label{font-size:10px;color:var(--muted);flex-shrink:0;font-family:var(--mono)}

.costo-pills{display:flex;gap:6px;margin-top:10px}
.costo-pill{flex:1;border-radius:8px;padding:8px;text-align:center;background:var(--green-bg);border:1px solid var(--green-border)}
.costo-pill-v{font-size:13px;font-weight:800;font-family:var(--mono);color:var(--green)}
.costo-pill-l{font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-top:2px}

.opex-total{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)}
.opex-total-label{font-size:9px;color:var(--muted);font-weight:700;text-transform:uppercase}
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

.nota{font-size:9px;color:var(--muted);font-style:italic;margin-top:6px}
.totales-row{display:flex;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)}
.total-box{flex:1;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px 10px;text-align:center}
.total-box-v{font-size:14px;font-weight:800;font-family:var(--mono);color:var(--navy)}
.total-box-l{font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.total-box.green{background:var(--green-bg);border-color:var(--green-border)}
.total-box.green .total-box-v{color:var(--green)}
`;

const parseNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const fmt    = (n) => (n ?? 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtUSD = (n) => `$${fmt(n)}`;
const fmtDec = (n, d = 2) => (n ?? 0).toFixed(d);
const fmtCompact = (n) => {
  if (n === null || n === undefined) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
};
const calcOpexFijo = (b) =>
  (b.opex_mantenimiento || 0) + (b.opex_seguros || 0) +
  (b.opex_comunicaciones || 0) + (b.opex_prefectura || 0) + (b.opex_admin || 0) +
  (b.opex_retiro_slob || 0);

// ─── BLOQUE CONSUMOS ───────────────────────────────────────────────────────
function BloqueConsumos({ barcoId }) {
  const [consumos, setConsumos] = useState([]);
  const [consumoPuerto, setConsumoPuerto] = useState(0.89);
  const [lubPuertoPct, setLubPuertoPct]   = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  const showMsg = useCallback((type, text) => {
    setMsg({ type, text });
    if (type === "ok") setTimeout(() => setMsg(null), 3000);
  }, []);

  const loadConsumos = useCallback(async () => {
    if (!barcoId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLE_CONSUMOS).select("*").eq("barco_id", barcoId).order("orden");
      if (error) throw error;

      if (data.length === 0) {
        const rows = VELOCIDADES_DEFAULT.map((v, i) => ({
          barco_id: barcoId, velocidad: v,
          consumo_lastre: v * 0.8, consumo_carga: v * 1.1,
          lubricante_pct: 3, orden: i,
        }));
        const { data: nuevos, error: e2 } = await supabase
          .from(TABLE_CONSUMOS).insert(rows).select();
        if (e2) throw e2;
        setConsumos(nuevos.sort((a, b) => a.orden - b.orden));
      } else {
        setConsumos(data);
      }

      // Cargar consumo puerto del barco
      const { data: barco, error: e3 } = await supabase
        .from(TABLE_BARCOS).select("consumo_puerto, lubricante_pct_puerto").eq("id", barcoId).maybeSingle();
      if (e3) throw e3;
      if (barco) {
        setConsumoPuerto(barco.consumo_puerto ?? 0.89);
        setLubPuertoPct(barco.lubricante_pct_puerto ?? 3);
      }
    } catch (e) {
      showMsg("err", `Error al cargar consumos: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [barcoId, showMsg]);

  useEffect(() => { loadConsumos(); }, [loadConsumos]);

  const setConsumo = (idx, key, val) => {
    setConsumos(prev => prev.map((c, i) => i === idx ? { ...c, [key]: parseNum(val) } : c));
  };

  const guardar = async () => {
    setSaving(true);
    try {
      const updates = consumos.map(c => ({
        id: c.id,
        barco_id: c.barco_id,
        velocidad: c.velocidad,
        consumo_lastre: c.consumo_lastre,
        consumo_carga: c.consumo_carga,
        lubricante_pct: c.lubricante_pct,
        orden: c.orden,
      }));
      const { error } = await supabase.from(TABLE_CONSUMOS).upsert(updates);
      if (error) throw error;
      const { error: e2 } = await supabase.from(TABLE_BARCOS)
        .update({ consumo_puerto: consumoPuerto, lubricante_pct_puerto: lubPuertoPct })
        .eq("id", barcoId);
      if (e2) throw e2;
      showMsg("ok", "Consumos guardados.");
    } catch (e) {
      showMsg("err", `Error al guardar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state">Cargando consumos...</div>;

  const pvlsfo = null; // precio por puerto — ver tab Puerto & Costos

  return (
    <div className="card">
      <div className="sec">③ Performance y Combustible</div>
      {msg && <div className={`msg ${msg.type === "err" ? "msg-err" : "msg-ok"}`}>{msg.text}</div>}

      <div style={{ overflowX: "auto" }}>
        <table className="data-table" style={{tableLayout:"fixed"}}>
          <colgroup>
            <col style={{width:70}} /><col style={{width:130}} /><col style={{width:130}} />
            <col style={{width:110}} /><col style={{width:110}} /><col style={{width:110}} />
          </colgroup>
          <thead>
            <tr>
              <th>Vel. (kn)</th>
              <th>Lastre (Tn/día)</th>
              <th>En carga (Tn/día)</th>
              <th>Lub. %</th>
              <th>Lub. Lastre</th>
              <th>Lub. En carga</th>
            </tr>
          </thead>
          <tbody>
            {consumos.map((c, i) => (
              <tr key={c.id}>
                <td>
                  <input className="tbl-input" type="number" step="1" value={c.velocidad}
                    onChange={e => setConsumo(i, "velocidad", e.target.value)} />
                </td>
                <td>
                  <input className="tbl-input" type="number" step="0.1" value={parseFloat(c.consumo_lastre).toFixed(1)}
                    onChange={e => setConsumo(i, "consumo_lastre", e.target.value)} />
                </td>
                <td>
                  <input className="tbl-input" type="number" step="0.1" value={parseFloat(c.consumo_carga).toFixed(1)}
                    onChange={e => setConsumo(i, "consumo_carga", e.target.value)} />
                </td>
                <td>
                  <div style={{display:"flex",alignItems:"center",gap:3}}>
                    <input className="tbl-input" type="number" step="0.1" value={parseFloat(c.lubricante_pct).toFixed(1)}
                      onChange={e => setConsumo(i, "lubricante_pct", e.target.value)} style={{flex:1}} />
                    <span style={{fontSize:9,color:"var(--muted)",flexShrink:0}}>%</span>
                  </div>
                </td>
                <td>
                  <input className="tbl-formula" readOnly
                    value={(Math.ceil(c.consumo_lastre * (c.lubricante_pct / 100) * 10) / 10).toFixed(1)} />
                </td>
                <td>
                  <input className="tbl-formula" readOnly
                    value={(Math.ceil(c.consumo_carga * (c.lubricante_pct / 100) * 10) / 10).toFixed(1)} />
                </td>
              </tr>
            ))}
            <tr className="puerto-row">
              <td style={{fontWeight:600,fontSize:10}}>En puerto</td>
              <td colSpan={2}>
                <input className="tbl-input" type="number" step="0.1" value={parseFloat(consumoPuerto).toFixed(1)}
                  onChange={e => setConsumoPuerto(parseNum(e.target.value))} />
              </td>
              <td>
                <div style={{display:"flex",alignItems:"center",gap:3}}>
                  <input className="tbl-input" type="number" step="0.1" value={parseFloat(lubPuertoPct).toFixed(1)}
                    onChange={e => setLubPuertoPct(parseNum(e.target.value))} style={{flex:1}} />
                  <span style={{fontSize:9,color:"var(--muted)",flexShrink:0}}>%</span>
                </div>
              </td>
              <td colSpan={2}>
                <input className="tbl-formula" readOnly
                  value={(Math.ceil(consumoPuerto * (lubPuertoPct / 100) * 10) / 10).toFixed(1)} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="nota">* El precio VLSFO se configura por puerto en la tab Puerto & Costos</p>

      <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
        <button className="btn btn-primary" onClick={guardar} disabled={saving}>
          {saving ? "Guardando..." : "Guardar consumos"}
        </button>
      </div>
    </div>
  );
}

// ─── BLOQUE CAPACIDADES ────────────────────────────────────────────────────
function BloqueCapacidades({ barco, set }) {
  return (
    <div className="card">
      <div className="sec">④ Capacidades de carga</div>
      <div className="g4">
        <div className="campo">
          <div className="campo-label">Agua (m³)</div>
          <input className="campo-input" type="number" value={barco.cap_agua_m3 ?? 0}
            onChange={e => set("cap_agua_m3", parseNum(e.target.value))} />
        </div>
        <div className="campo">
          <div className="campo-label">Slop (m³)</div>
          <input className="campo-input" type="number" value={barco.cap_slop_m3 ?? 0}
            onChange={e => set("cap_slop_m3", parseNum(e.target.value))} />
        </div>
        <div className="campo">
          <div className="campo-label">Lubricantes (drums)</div>
          <input className="campo-input" type="number" value={barco.cap_lubricantes_drums ?? 0}
            onChange={e => set("cap_lubricantes_drums", parseNum(e.target.value))} />
        </div>
        <div className="campo">
          <div className="campo-label">Carga general (Tn)</div>
          <input className="campo-input" type="number" value={barco.cap_carga_general_tn ?? 0}
            onChange={e => set("cap_carga_general_tn", parseNum(e.target.value))} />
        </div>
      </div>
      <p className="nota">* Dejá en 0 las capacidades que el barco no tiene.</p>
    </div>
  );
}

// ─── BLOQUE TRIPULACION ────────────────────────────────────────────────────
function BloqueTripulacion({ barcoId }) {
  const [trip, setTrip]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  const showMsg = useCallback((type, text) => {
    setMsg({ type, text });
    if (type === "ok") setTimeout(() => setMsg(null), 3000);
  }, []);

  const loadTrip = useCallback(async () => {
    if (!barcoId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLE_TRIPULACION).select("*").eq("barco_id", barcoId).order("orden");
      if (error) throw error;

      if (data.length === 0) {
        const rows = POSICIONES.map((p, i) => ({
          barco_id: barcoId, posicion: p, orden: i,
          cantidad_puerto: 0, costo_dia_puerto: 0,
          cantidad_navegando: 0, costo_dia_navegando: 0,
        }));
        const { data: nuevos, error: e2 } = await supabase
          .from(TABLE_TRIPULACION).insert(rows).select();
        if (e2) throw e2;
        setTrip(nuevos.sort((a, b) => a.orden - b.orden));
      } else {
        setTrip(data);
      }
    } catch (e) {
      showMsg("err", `Error al cargar tripulación: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [barcoId, showMsg]);

  useEffect(() => { loadTrip(); }, [loadTrip]);

  const setRow = (idx, key, val) => {
    setTrip(prev => prev.map((r, i) => i === idx ? { ...r, [key]: parseNum(val) } : r));
  };

  const guardar = async () => {
    setSaving(true);
    try {
      const updates = trip.map(r => ({
        id: r.id,
        barco_id: r.barco_id,
        posicion: r.posicion,
        orden: r.orden,
        cantidad_puerto: r.cantidad_puerto,
        costo_dia_puerto: r.costo_dia_puerto,
        cantidad_navegando: r.cantidad_navegando,
        costo_dia_navegando: r.costo_dia_navegando,
      }));
      const { error } = await supabase.from(TABLE_TRIPULACION).upsert(updates);
      if (error) throw error;
      showMsg("ok", "Tripulación guardada.");
    } catch (e) {
      showMsg("err", `Error al guardar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state">Cargando tripulación...</div>;

  const totalPuerto    = trip.reduce((s, r) => s + (r.cantidad_puerto    || 0) * (r.costo_dia_puerto    || 0), 0);
  const totalNavegando = trip.reduce((s, r) => s + (r.cantidad_navegando || 0) * (r.costo_dia_navegando || 0), 0);

  return (
    <div className="card">
      <div className="sec">⑤ Tripulación</div>
      {msg && <div className={`msg ${msg.type === "err" ? "msg-err" : "msg-ok"}`}>{msg.text}</div>}

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{width:160}}>Posición</th>
              <th>Cant. Puerto</th>
              <th>Costo/día Puerto (USD)</th>
              <th>Subtotal Puerto</th>
              <th>Cant. Navegando</th>
              <th>Costo/día Navegando (USD)</th>
              <th>Subtotal Navegando</th>
            </tr>
          </thead>
          <tbody>
            {trip.map((r, i) => {
              const subtotalPuerto    = (r.cantidad_puerto    || 0) * (r.costo_dia_puerto    || 0);
              const subtotalNavegando = (r.cantidad_navegando || 0) * (r.costo_dia_navegando || 0);
              return (
                <tr key={r.id}>
                  <td>{r.posicion}</td>
                  <td>
                    <input className="tbl-input" type="number" min="0" value={r.cantidad_puerto}
                      onChange={e => setRow(i, "cantidad_puerto", e.target.value)} style={{width:50}} />
                  </td>
                  <td>
                    <input className="tbl-input" type="number" min="0" value={r.costo_dia_puerto}
                      onChange={e => setRow(i, "costo_dia_puerto", e.target.value)} />
                  </td>
                  <td>
                    <input className="tbl-formula" readOnly value={subtotalPuerto > 0 ? fmtUSD(subtotalPuerto) : "—"} />
                  </td>
                  <td>
                    <input className="tbl-input" type="number" min="0" value={r.cantidad_navegando}
                      onChange={e => setRow(i, "cantidad_navegando", e.target.value)} style={{width:50}} />
                  </td>
                  <td>
                    <input className="tbl-input" type="number" min="0" value={r.costo_dia_navegando}
                      onChange={e => setRow(i, "costo_dia_navegando", e.target.value)} />
                  </td>
                  <td>
                    <input className="tbl-formula" readOnly value={subtotalNavegando > 0 ? fmtUSD(subtotalNavegando) : "—"} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="totales-row">
        <div className="total-box green">
          <div className="total-box-v">{fmtUSD(totalPuerto)}</div>
          <div className="total-box-l">Total tripulación en puerto / día</div>
        </div>
        <div className="total-box green">
          <div className="total-box-v">{fmtUSD(totalNavegando)}</div>
          <div className="total-box-l">Total tripulación navegando / día</div>
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
        <button className="btn btn-primary" onClick={guardar} disabled={saving}>
          {saving ? "Guardando..." : "Guardar tripulación"}
        </button>
      </div>
    </div>
  );
}

// ─── TAB BARCOS ────────────────────────────────────────────────────────────
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
          .select().single();
        if (e2) throw e2;
        setBarcos([nuevo]); setSelIdx(0);
      } else {
        setBarcos(data); setSelIdx(0);
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
      const { error } = await supabase.from(TABLE_BARCOS).update({
        nombre:                        barco.nombre,
        tipo:                          barco.tipo,
        estado:                        barco.estado,
        precio_compra:                 barco.precio_compra,
        velocidad_crucero:             barco.velocidad_crucero,
        arancel_pct:                   barco.arancel_pct,
        capex_refit:                   barco.capex_refit,
        deuda_pct:                     barco.deuda_pct,
        tasa_deuda:                    barco.tasa_deuda,
        anio_salida:                   barco.anio_salida,
        valor_residual_pct:            barco.valor_residual_pct,
        vida_util:                     barco.vida_util,
        cap_agua_m3:                   barco.cap_agua_m3,
        cap_slop_m3:                   barco.cap_slop_m3,
        cap_lubricantes_drums:         barco.cap_lubricantes_drums,
        cap_carga_general_tn:          barco.cap_carga_general_tn,
        consumo_puerto:                barco.consumo_puerto,
        lubricante_pct_puerto:         barco.lubricante_pct_puerto,
        opex_mantenimiento:            barco.opex_mantenimiento,
        opex_seguros:                  barco.opex_seguros,
        opex_comunicaciones:           barco.opex_comunicaciones,
        opex_prefectura:               barco.opex_prefectura,
        opex_admin:                    barco.opex_admin,
        opex_retiro_slob:              barco.opex_retiro_slob,
        drydock_full_costo:            barco.drydock_full_costo,
        drydock_full_cada_anios:       barco.drydock_full_cada_anios,
        drydock_full_meses:            barco.drydock_full_meses,
        drydock_intermedio_costo:      barco.drydock_intermedio_costo,
        drydock_intermedio_cada_anios: barco.drydock_intermedio_cada_anios,
        drydock_intermedio_meses:      barco.drydock_intermedio_meses,
      }).eq("id", barco.id);
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
        .select().single();
      if (error) throw error;
      setBarcos(prev => { const u = [...prev, data]; setSelIdx(u.length - 1); return u; });
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
      const { error: e1 } = await supabase.from(TABLE_ESCENARIOS).delete().eq("barco_id", barco.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from(TABLE_CONSUMOS).delete().eq("barco_id", barco.id);
      if (e2) throw e2;
      const { error: e3 } = await supabase.from(TABLE_TRIPULACION).delete().eq("barco_id", barco.id);
      if (e3) throw e3;
      const { error: e4 } = await supabase.from(TABLE_BARCOS).delete().eq("id", barco.id);
      if (e4) throw e4;
      setBarcos(prev => { const u = prev.filter((_, i) => i !== selIdx); setSelIdx(Math.max(0, selIdx - 1)); return u; });
      showMsg("ok", "Barco eliminado.");
    } catch (e) {
      showMsg("err", `No se pudo eliminar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state">Cargando barcos...</div>;

  const barco = barcos[selIdx];
  if (!barco) return <div className="empty-state">No hay barcos cargados.</div>;

  const opexFijo   = calcOpexFijo(barco);
  const capexTotal = (barco.precio_compra || 0) * (1 + (barco.arancel_pct || 0) / 100) + (barco.capex_refit || 0);

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

      {/* BLOQUE 1 — IDENTIDAD */}
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
            <div className="campo"><div className="campo-label">Velocidad crucero P&L (kn)</div>
              <input className="campo-input" type="number" step="0.5" min="1" max="25"
                value={barco.velocidad_crucero ?? 8}
                onChange={e => set("velocidad_crucero", parseNum(e.target.value))} />
            </div>
          </div>
          <p className="nota">* La velocidad de crucero se usa en P&L, Cashflow y Comparación para estimar días de navegación por operación.</p>
        </div>

        {/* BLOQUE 2 — ADQUISICION */}
        <div className="card">
          <div className="sec">② Adquisición / Financiamiento</div>
          <div className="g2">
            <div className="campo"><div className="campo-label">Precio de compra (USD)</div>
              <input className="campo-input" type="number" value={barco.precio_compra ?? 0} onChange={e => set("precio_compra", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">Aranceles + despacho (%)</div>
              <input className="campo-input" type="number" value={barco.arancel_pct ?? 0} onChange={e => set("arancel_pct", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">CAPEX refit (USD)</div>
              <input className="campo-input" type="number" value={barco.capex_refit ?? 0} onChange={e => set("capex_refit", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">% Deuda</div>
              <input className="campo-input" type="number" value={barco.deuda_pct ?? 0} onChange={e => set("deuda_pct", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">Tasa deuda anual (%)</div>
              <input className="campo-input" type="number" value={barco.tasa_deuda ?? 0} onChange={e => set("tasa_deuda", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">Año de salida</div>
              <input className="campo-input" type="number" value={barco.anio_salida ?? 7} onChange={e => set("anio_salida", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">Valor residual (%)</div>
              <input className="campo-input" type="number" value={barco.valor_residual_pct ?? 0} onChange={e => set("valor_residual_pct", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">Vida útil (años)</div>
              <input className="campo-input" type="number" value={barco.vida_util ?? 20} onChange={e => set("vida_util", parseNum(e.target.value))} /></div>
          </div>
          <div style={{marginTop:8,padding:"8px 10px",background:"var(--bg)",borderRadius:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:9,color:"var(--muted)",fontWeight:700,textTransform:"uppercase"}}>CAPEX total</span>
            <span style={{fontSize:14,fontWeight:800,fontFamily:"var(--mono)"}}>{fmtUSD(capexTotal)}</span>
          </div>
        </div>
      </div>

      {/* BLOQUE 3 — CONSUMOS */}
      <BloqueConsumos barcoId={barco.id} />

      {/* BLOQUE 4 — CAPACIDADES */}
      <BloqueCapacidades barco={barco} set={set} />

      {/* BLOQUE 5 — TRIPULACION */}
      <BloqueTripulacion barcoId={barco.id} />

      {/* BLOQUE 6 — OPEX FIJO */}
      <div className="card">
        <div className="sec">⑥ OPEX fijo anual (USD)</div>
        <div className="g4">
          {[
            ["opex_mantenimiento",  "Mantenimiento"],
            ["opex_seguros",        "Seguros (H&M + P&I)"],
            ["opex_comunicaciones", "Comunicaciones / satélite"],
            ["opex_prefectura",     "Prefectura / habilitaciones"],
            ["opex_admin",          "Administración"],
            ["opex_retiro_slob",    "Retiro SLOB"],
          ].map(([key, label]) => (
            <div className="campo" key={key}>
              <div className="campo-label">{label}</div>
              <input className="campo-input" type="number" value={barco[key] ?? 0}
                onChange={e => set(key, parseNum(e.target.value))} />
            </div>
          ))}
        </div>
        <div className="opex-total">
          <span className="opex-total-label">OPEX fijo total / año</span>
          <span className="opex-total-val">{fmtUSD(opexFijo)}</span>
        </div>
      </div>

      {/* BLOQUE 7 — DRY DOCK */}
      <div className="g2">
        <div className="card">
          <div className="sec">⑦ Dry dock completo</div>
          <div className="g3">
            <div className="campo"><div className="campo-label">Costo (USD)</div>
              <input className="campo-input" type="number" value={barco.drydock_full_costo ?? 500000}
                onChange={e => set("drydock_full_costo", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">Cada (años)</div>
              <input className="campo-input" type="number" value={barco.drydock_full_cada_anios ?? 4}
                onChange={e => set("drydock_full_cada_anios", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">Duración (meses)</div>
              <input className="campo-input" type="number" value={barco.drydock_full_meses ?? 2}
                onChange={e => set("drydock_full_meses", parseNum(e.target.value))} /></div>
          </div>
        </div>
        <div className="card">
          <div className="sec">⑦ Dry dock intermedio</div>
          <div className="g3">
            <div className="campo"><div className="campo-label">Costo (USD)</div>
              <input className="campo-input" type="number" value={barco.drydock_intermedio_costo ?? 250000}
                onChange={e => set("drydock_intermedio_costo", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">Cada (años)</div>
              <input className="campo-input" type="number" value={barco.drydock_intermedio_cada_anios ?? 2}
                onChange={e => set("drydock_intermedio_cada_anios", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">Duración (meses)</div>
              <input className="campo-input" type="number" value={barco.drydock_intermedio_meses ?? 2}
                onChange={e => set("drydock_intermedio_meses", parseNum(e.target.value))} /></div>
          </div>
        </div>
      </div>

      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
        {barcos.length > 1 && (
          <button className="btn btn-danger" onClick={eliminar} disabled={saving}>Eliminar barco</button>
        )}
        <button className="btn btn-primary" onClick={guardar} disabled={saving}>
          {saving ? "Guardando..." : "Guardar barco"}
        </button>
      </div>
    </div>
  );
}



const PUERTO_DEFAULT = {
  nombre: "Nuevo Puerto",
  activo: true,
  orden: 0,
  costo_portuario_dia: 0,
  costo_estiba: 0,
  costo_estiba_hora: 0,
  costo_estiba_dia: 0,
  costo_estiba_tn: 0,
  costo_agua_m3: 0,
  costo_slop_m3: 0,
  costo_bunker_operacion: 0,
  costo_despacho_operacion: 0,
  precio_vlsfo: 1000,
  precio_lubricante: 2200,
  dist_zona_comun: 0,
  dist_zona_alfa: 0,
  dist_zona_delta: 0,
  costo_indirecto_lumpsum: 0,
  nota_indirectos: "",
  calado_max_m: 0,
  tiene_grua: false,
  horas_operativas: 24,
  espera_promedio_hs: 0,
  restriccion_viento: "",
};

function TabPuertos() {
  const [puertos, setPuertos]   = useState([]);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState(null);
  const [loading, setLoading]   = useState(true);

  const showMsg = useCallback((type, text) => {
    setMsg({ type, text });
    if (type === "ok") setTimeout(() => setMsg(null), 3000);
  }, []);

  const loadPuertos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLE_PUERTOS).select("*").order("orden");
      if (error) throw error;
      if (data.length === 0) {
        const seeds = [
          { ...PUERTO_DEFAULT, nombre: "La Plata",     orden: 0, dist_zona_comun: 6,  dist_zona_alfa: 115, dist_zona_delta: 138 },
          { ...PUERTO_DEFAULT, nombre: "Dock Sud",     orden: 1, dist_zona_comun: 26, dist_zona_alfa: 140, dist_zona_delta: 163 },
          { ...PUERTO_DEFAULT, nombre: "Buenos Aires", orden: 2, dist_zona_comun: 29, dist_zona_alfa: 143, dist_zona_delta: 165 },
          { ...PUERTO_DEFAULT, nombre: "Paraná Ports", orden: 3, dist_zona_comun: 51, dist_zona_alfa: 186, dist_zona_delta: 213 },
        ];
        const { data: nuevos, error: e2 } = await supabase
          .from(TABLE_PUERTOS).insert(seeds).select();
        if (e2) throw e2;
        setPuertos(nuevos.sort((a, b) => a.orden - b.orden));
      } else {
        setPuertos(data);
      }
    } catch (e) {
      showMsg("err", `Error al cargar puertos: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [showMsg]);

  useEffect(() => { loadPuertos(); }, [loadPuertos]);

  const guardar = async (idx) => {
    const puerto = puertos[idx];
    if (!puerto) return;
    setSaving(true);
    try {
      const { error } = await supabase.from(TABLE_PUERTOS).update({
        nombre: puerto.nombre,
        activo: puerto.activo,
        costo_portuario_dia: puerto.costo_portuario_dia,
        costo_estiba: puerto.costo_estiba,
        costo_estiba_hora: puerto.costo_estiba_hora,
        costo_estiba_dia: puerto.costo_estiba_dia,
        costo_estiba_tn: puerto.costo_estiba_tn,
        costo_agua_m3: puerto.costo_agua_m3,
        costo_slop_m3: puerto.costo_slop_m3,
        costo_bunker_operacion: puerto.costo_bunker_operacion,
        costo_despacho_operacion: puerto.costo_despacho_operacion,
        precio_vlsfo: puerto.precio_vlsfo,
        precio_lubricante: puerto.precio_lubricante,
        dist_zona_comun: puerto.dist_zona_comun,
        dist_zona_alfa: puerto.dist_zona_alfa,
        dist_zona_delta: puerto.dist_zona_delta,
        costo_indirecto_lumpsum: puerto.costo_indirecto_lumpsum,
        nota_indirectos: puerto.nota_indirectos,
        calado_max_m: puerto.calado_max_m,
        tiene_grua: puerto.tiene_grua,
        horas_operativas: puerto.horas_operativas,
        espera_promedio_hs: puerto.espera_promedio_hs,
        restriccion_viento: puerto.restriccion_viento,
      }).eq("id", puerto.id);
      if (error) throw error;
      showMsg("ok", `"${puerto.nombre}" guardado.`);
    } catch (e) {
      showMsg("err", `No se pudo guardar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (idx) => {
    const puerto = puertos[idx];
    if (!puerto) return;
    setSaving(true);
    try {
      const { error } = await supabase.from(TABLE_PUERTOS).delete().eq("id", puerto.id);
      if (error) throw error;
      setPuertos(prev => prev.filter((_, i) => i !== idx));
      showMsg("ok", "Puerto eliminado.");
    } catch (e) {
      showMsg("err", `No se pudo eliminar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const nuevoPuerto = async () => {
    if (puertos.length >= 5) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from(TABLE_PUERTOS)
        .insert({ ...PUERTO_DEFAULT, nombre: `Puerto ${puertos.length + 1}`, orden: puertos.length })
        .select().single();
      if (error) throw error;
      setPuertos(prev => [...prev, data]);
    } catch (e) {
      showMsg("err", `No se pudo crear el puerto: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state">Cargando puertos...</div>;
  if (puertos.length === 0) return <div className="empty-state">No hay puertos cargados.</div>;

  // Ancho fijo por columna — 4 caben en ~1200px (laptop 14")
  const COL_W = 232;

  const FILAS = [
    { sec: "① Identidad",                   items: null }, // header de sección
    { label: "Nombre",                       render: (p, i) => (
        <input className="field-input" value={p.nombre || ""} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,nombre:e.target.value}:x)); }} />
    )},
    { label: "Estado",                       render: (p, i) => (
        <select className="field-input" value={p.activo?"true":"false"} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,activo:e.target.value==="true"}:x)); }}>
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
    )},
    { sec: "② Distancias (nm)",              items: null },
    { label: "Zona Común",                   render: (p, i) => (
        <input className="field-input" type="number" value={p.dist_zona_comun??0} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,dist_zona_comun:parseNum(e.target.value)}:x)); }} />
    )},
    { label: "Zona Alfa",                    render: (p, i) => (
        <input className="field-input" type="number" value={p.dist_zona_alfa??0} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,dist_zona_alfa:parseNum(e.target.value)}:x)); }} />
    )},
    { label: "Zona Delta",                   render: (p, i) => (
        <input className="field-input" type="number" value={p.dist_zona_delta??0} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,dist_zona_delta:parseNum(e.target.value)}:x)); }} />
    )},
    { sec: "③ Costos fijos (USD/mes)",        items: null },
    { label: "Amarre / mes",                  render: (p, i) => (
        <input className="field-input" type="number" value={p.costo_portuario_dia??0} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,costo_portuario_dia:parseNum(e.target.value)}:x)); }} />
    )},
    { label: "Amarre anual (× 12)",           render: (p) => (
        <input className="field-formula" readOnly value={fmtUSD((p.costo_portuario_dia||0)*12)} />
    )},
    { sec: "④ Costos variables por operación", items: null },
    { label: "Estiba / operación (USD)",      render: (p, i) => (
        <input className="field-input" type="number" value={p.costo_estiba??0} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,costo_estiba:parseNum(e.target.value)}:x)); }} />
    )},
    { label: "Estiba / hora (USD/hs)",        render: (p, i) => (
        <input className="field-input" type="number" value={p.costo_estiba_hora??0} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,costo_estiba_hora:parseNum(e.target.value)}:x)); }} />
    )},
    { label: "Estiba / día (USD/día)",        render: (p, i) => (
        <input className="field-input" type="number" value={p.costo_estiba_dia??0} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,costo_estiba_dia:parseNum(e.target.value)}:x)); }} />
    )},
    { label: "Estiba / tonelada (USD/Tn)",    render: (p, i) => (
        <input className="field-input" type="number" value={p.costo_estiba_tn??0} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,costo_estiba_tn:parseNum(e.target.value)}:x)); }} />
    )},
    { label: "Compra agua (USD/m³)",          render: (p, i) => (
        <input className="field-input" type="number" value={p.costo_agua_m3??0} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,costo_agua_m3:parseNum(e.target.value)}:x)); }} />
    )},
    { label: "Descarga slop (USD/m³)",        render: (p, i) => (
        <input className="field-input" type="number" value={p.costo_slop_m3??0} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,costo_slop_m3:parseNum(e.target.value)}:x)); }} />
    )},
    { label: "Bunker / operación",            render: (p, i) => (
        <input className="field-input" type="number" value={p.costo_bunker_operacion??0} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,costo_bunker_operacion:parseNum(e.target.value)}:x)); }} />
    )},
    { label: "Despacho / operación (USD)",    render: (p, i) => (
        <input className="field-input" type="number" value={p.costo_despacho_operacion??0} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,costo_despacho_operacion:parseNum(e.target.value)}:x)); }} />
    )},
    { sec: "⑤ Costos indirectos",            items: null },
    { label: "Lump sum mensual (USD)",       render: (p, i) => (
        <input className="field-input" type="number" value={p.costo_indirecto_lumpsum??0} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,costo_indirecto_lumpsum:parseNum(e.target.value)}:x)); }} />
    )},
    { label: "Anual (× 12)",                render: (p) => (
        <input className="field-formula" readOnly value={fmtUSD((p.costo_indirecto_lumpsum||0)*12)} />
    )},
    { label: "Nota / descripción",           render: (p, i) => (
        <input className="field-input" value={p.nota_indirectos||""} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,nota_indirectos:e.target.value}:x)); }} placeholder="—" />
    )},
    { sec: "⑥ Precios de referencia",        items: null },
    { label: "VLSFO (USD/Tn)",               render: (p, i) => (
        <input className="field-input" type="number" value={p.precio_vlsfo??1000} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,precio_vlsfo:parseNum(e.target.value)}:x)); }} />
    )},
    { label: "Lubricante (USD/drum)",        render: (p, i) => (
        <input className="field-input" type="number" value={p.precio_lubricante??2200} onChange={e => { setPuertos(prev => prev.map((x,j)=>j===i?{...x,precio_lubricante:parseNum(e.target.value)}:x)); }} />
    )},
  ];

  return (
    <div>
      {msg && <div className={`msg ${msg.type === "err" ? "msg-err" : "msg-ok"}`}>{msg.text}</div>}

      {/* Scroll container */}
      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{display:"flex",width:"max-content"}}>

          {/* Columna de etiquetas — fija a la izquierda */}
          <div style={{width:200,minWidth:200,flexShrink:0,paddingTop:48}}>
            {FILAS.map((fila, fi) => (
              fila.sec
                ? <div key={fi} style={{
                    height:34,display:"flex",alignItems:"center",
                    padding:"0 10px",marginTop: fi===0?0:8,
                    fontSize:8,fontWeight:700,color:"var(--blue)",
                    textTransform:"uppercase",letterSpacing:1.5,
                    borderBottom:"1px solid var(--border)",
                    background:"var(--bg)",
                  }}>{fila.sec}</div>
                : <div key={fi} style={{
                    height:38,display:"flex",alignItems:"center",
                    padding:"0 10px",
                    fontSize:10,fontWeight:600,color:"var(--muted)",
                    borderBottom:"1px solid #F3F6FA",
                  }}>{fila.label}</div>
            ))}
          </div>

          {/* Columnas de puertos */}
          {puertos.map((p, pi) => (
            <div key={p.id} style={{width:COL_W,minWidth:COL_W,maxWidth:COL_W,flexShrink:0,borderLeft:"1px solid var(--border)",overflow:"hidden"}}>
              {/* Header columna */}
              <div style={{
                height:48,display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"0 10px",
                background: p.activo ? "var(--navy)" : "var(--muted)",
                borderRadius:"8px 8px 0 0",
                width:COL_W,boxSizing:"border-box",
              }}>
                <span style={{fontSize:11,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>
                  🏗️ {p.nombre}
                </span>
                {puertos.length > 1 && (
                  <button
                    onClick={() => { if (window.confirm(`¿Eliminar "${p.nombre}"?`)) eliminar(pi); }}
                    disabled={saving}
                    style={{background:"rgba(255,255,255,.15)",border:"none",color:"rgba(255,255,255,.7)",
                      fontSize:10,borderRadius:4,padding:"2px 6px",cursor:"pointer",flexShrink:0,marginLeft:4}}
                  >✕</button>
                )}
              </div>

              {/* Filas de datos */}
              {FILAS.map((fila, fi) => (
                fila.sec
                  ? <div key={fi} style={{height:34,marginTop:fi===0?0:8,background:"var(--bg)",borderBottom:"1px solid var(--border)"}} />
                  : <div key={fi} style={{
                      height:38,display:"flex",alignItems:"center",
                      padding:"0 6px",borderBottom:"1px solid #F3F6FA",
                      width:COL_W,boxSizing:"border-box",overflow:"hidden",
                    }}>
                      {fila.render(p, pi)}
                    </div>
              ))}

              {/* Footer con botón guardar */}
              <div style={{padding:"10px 6px 6px",borderTop:"1px solid var(--border)",marginTop:4}}>
                <button className="btn btn-primary" style={{width:"100%",fontSize:10,padding:"6px 0"}}
                  onClick={() => guardar(pi)} disabled={saving}>
                  {saving ? "..." : "Guardar"}
                </button>
              </div>
            </div>
          ))}

          {/* Columna "Agregar" */}
          {puertos.length < 5 && (
            <div style={{width:COL_W,minWidth:COL_W,flexShrink:0,borderLeft:"1px solid var(--border)"}}>
              <div style={{height:48,display:"flex",alignItems:"center",justifyContent:"center",
                background:"var(--bg)",borderRadius:"8px 8px 0 0"}}>
                <button className="sel-btn add" onClick={nuevoPuerto} disabled={saving}
                  style={{margin:0}}>+ Nuevo puerto</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


const SERVICIO_LABELS = {
  alije:       { label: "Alije",                icon: "⚓", color: "#213363" },
  agua:        { label: "Transporte de Agua",   icon: "💧", color: "#0D7AA8" },
  slop:        { label: "Transporte de Slop",   icon: "🛢️", color: "#B07D0A" },
  lubricantes: { label: "Lubricantes",          icon: "🔧", color: "#166534" },
};

const ZONAS = [
  { value: "zona_comun", label: "Zona Común" },
  { value: "zona_alfa",  label: "Zona Alfa"  },
  { value: "zona_delta", label: "Zona Delta" },
];

// ─── MOTOR DE CÁLCULO ─────────────────────────────────────────────────────
function calcularPL(barco, puerto, servicios, consumos, tripulacion, anios = 7, crecimientoPct = 0) {
  if (!barco || !puerto) return null;

  const DIAS_ANIO = 365;
  const resultado = [];
  const tasaCrecimiento = crecimientoPct / 100;

  const velCrucero = barco.velocidad_crucero || 8;

  const filaVel = consumos.length > 0
    ? consumos.reduce((prev, curr) =>
        Math.abs(curr.velocidad - velCrucero) < Math.abs(prev.velocidad - velCrucero) ? curr : prev)
    : null;

  const consLastre = filaVel?.consumo_lastre || 0;
  const consCarga  = filaVel?.consumo_carga  || 0;
  const consPuerto = barco.consumo_puerto || 0;
  const lubPct     = (filaVel?.lubricante_pct || 3) / 100;
  const lubPuertoPct = (barco.lubricante_pct_puerto || 3) / 100;
  const pvlsfo     = puerto.precio_vlsfo || 1000;
  const plub       = puerto.precio_lubricante || 2200;

  // Costo diario combustible (VLSFO)
  const costoCombNavLastre = consLastre * pvlsfo;
  const costoCombNavCarga  = consCarga  * pvlsfo;
  const costoCombPuerto    = consPuerto * pvlsfo;

  // Costo diario lubricante (precio lubricante, no VLSFO)
  const costoLubNavLastre = consLastre * lubPct * plub;
  const costoLubNavCarga  = consCarga  * lubPct * plub;
  const costoLubPuerto    = consPuerto * lubPuertoPct * plub;

  // Tripulación diaria
  const tripNavegando = tripulacion.reduce((s, r) => s + (r.cantidad_navegando || 0) * (r.costo_dia_navegando || 0), 0);
  const tripPuerto    = tripulacion.reduce((s, r) => s + (r.cantidad_puerto    || 0) * (r.costo_dia_puerto    || 0), 0);

  // OPEX fijo base anual
  const opexFijoBase = calcOpexFijo(barco) + (puerto.costo_indirecto_lumpsum || 0) * 12;

  for (let anio = 1; anio <= anios; anio++) {
    // Días fuera por dry dock este año
    let diasDrydock = 0;
    let costoDrydock = 0;
    const esFull = barco.drydock_full_cada_anios > 0 && anio % barco.drydock_full_cada_anios === 0;
    const esIntermedio = !esFull && barco.drydock_intermedio_cada_anios > 0 && anio % barco.drydock_intermedio_cada_anios === 0;

    if (esFull) {
      diasDrydock = (barco.drydock_full_meses || 2) * 30;
      costoDrydock = barco.drydock_full_costo || 0;
    } else if (esIntermedio) {
      diasDrydock = (barco.drydock_intermedio_meses || 2) * 30;
      costoDrydock = barco.drydock_intermedio_costo || 0;
    }

    const diasDisponibles = DIAS_ANIO - diasDrydock;

    // Calcular días operativos por servicio
    let ingresos = 0;
    let opexVariable = 0;
    let diasOperativos = 0;

    for (const srv of servicios.filter(s => s.activo)) {
      const opsBase = srv.operaciones_anio || 0;
      const ops = opsBase * Math.pow(1 + tasaCrecimiento, anio - 1);
      if (ops === 0) continue;

      // Distancia al sitio (ida)
      const distZona = srv.zona === "zona_comun" ? (puerto.dist_zona_comun || 0)
                     : srv.zona === "zona_alfa"  ? (puerto.dist_zona_alfa  || 0)
                     : (puerto.dist_zona_delta   || 0);

      const hsNavIda  = velCrucero > 0 ? distZona / velCrucero : 0;
      const diasNavIda = hsNavIda / 24;
      const diasNavTotal = diasNavIda * 2; // ida + vuelta
      const diasSitio = (srv.dias_promedio_sitio || srv.dias_operacion || 0);
      const diasPorOp = diasNavTotal + diasSitio;

      diasOperativos += ops * diasPorOp;

      // Ingresos
      if (srv.tipo === "alije") {
        if (srv.modalidad_pago === "mob_dia_operado") {
          ingresos += ops * ((srv.mob_demob_usd || 0) + diasSitio * (srv.tarifa_dia_operando || 0));
        } else {
          ingresos += ops * diasPorOp * (srv.tarifa_dia_navegando || 0);
        }
      } else if (srv.tipo === "agua" || srv.tipo === "slop") {
        ingresos += ops * (srv.precio_unitario || 0) * (srv.m3_promedio_viaje || 0) * (srv.entregas_por_viaje || 1);
      } else if (srv.tipo === "lubricantes") {
        ingresos += ops * (srv.precio_unitario || 0) * (srv.drums_promedio_viaje || 0);
      }

      // OPEX variable por operación
      // Combustible navegando (lastre ida, carga vuelta para agua/slop — simplificamos con promedio)
      const costoCombNav = ops * diasNavTotal * ((costoCombNavLastre + costoCombNavCarga) / 2 + (costoLubNavLastre + costoLubNavCarga) / 2);
      const costoCombSitio = ops * diasSitio * (costoCombPuerto + costoLubPuerto);
      const costoTrip = ops * (diasNavTotal * tripNavegando + diasSitio * tripPuerto);
      const costoPuertoOp = ops * ((puerto.costo_estiba || 0) + (puerto.costo_bunker_operacion || 0) + (puerto.costo_despacho_operacion || 0));

      // Costos específicos agua/slop
      let costoServicio = 0;
      if (srv.tipo === "agua") costoServicio = ops * (puerto.costo_agua_m3 || 0) * (srv.m3_promedio_viaje || 0) * (srv.entregas_por_viaje || 1);
      if (srv.tipo === "slop") costoServicio = ops * (puerto.costo_slop_m3 || 0) * (srv.m3_promedio_viaje || 0) * (srv.entregas_por_viaje || 1);

      opexVariable += costoCombNav + costoCombSitio + costoTrip + costoPuertoOp + costoServicio;
    }

    // Días en puerto (no operativos, no drydock)
    const diasEnPuerto = Math.max(0, diasDisponibles - diasOperativos);
    const costoCombPuertoAnual = diasEnPuerto * (costoCombPuerto + costoLubPuerto);
    const costoTripPuertoAnual = diasEnPuerto * tripPuerto;
    // costo_portuario_dia es amarre mensual — se suma al OPEX fijo anual (× 12)
    const costoAmarreMensual = (puerto.costo_portuario_dia || 0) * 12;

    opexVariable += costoCombPuertoAnual + costoTripPuertoAnual;

    const opexTotal = opexFijoBase + opexVariable + costoDrydock + costoAmarreMensual;

    // D&A
    const capexTotal = (barco.precio_compra || 0) * (1 + (barco.arancel_pct || 0) / 100) + (barco.capex_refit || 0);
    const vidaUtil = barco.vida_util || 20;
    const da = vidaUtil > 0 ? capexTotal / vidaUtil : 0;

    const ebitda = ingresos - opexTotal;
    const ebit   = ebitda - da;
    const impuesto = ebit > 0 ? ebit * 0.35 : 0;
    const resultadoNeto = ebit - impuesto;

    // FCO = resultado neto + D&A (la depreciación no es salida de caja)
    const fco = resultadoNeto + da;
    // Valor residual: se realiza en el año de salida configurado (no siempre el último año del modelo)
    const anioSalida = barco.anio_salida || anios;
    const valorResidual = anio === anioSalida ? (barco.precio_compra || 0) * (barco.valor_residual_pct || 0) : 0;

    resultado.push({
      anio: 2025 + anio - 1,
      diasDisponibles,
      diasOperativos: Math.min(diasOperativos, diasDisponibles),
      diasDrydock,
      ingresos,
      opexVariable,
      opexFijo: opexFijoBase,
      costoDrydock,
      opexTotal,
      ebitda,
      margenEbitda: ingresos > 0 ? ebitda / ingresos : 0,
      da,
      ebit,
      impuesto,
      resultadoNeto,
      fco,
      valorResidual,
    });
  }

  // TIR / VAN / MOIC
  const capexInicial = (barco.precio_compra || 0) * (1 + (barco.arancel_pct || 0) / 100) + (barco.capex_refit || 0);
  const flujos = resultado.map((r, i) => r.fco + (i === resultado.length - 1 ? r.valorResidual : 0));
  const tir = calcTIR([-capexInicial, ...flujos]);
  const van = calcVAN([-capexInicial, ...flujos], 0.12);
  const totalRetornado = flujos.reduce((s, f) => s + f, 0);
  const moic = capexInicial > 0 ? (totalRetornado + capexInicial) / capexInicial : 0;

  return { anios: resultado, tir, van, moic, capexInicial };
}

function calcTIR(flujos, guess = 0.1) {
  // Newton-Raphson
  let r = guess;
  for (let i = 0; i < 1000; i++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < flujos.length; t++) {
      npv  += flujos[t] / Math.pow(1 + r, t);
      dnpv -= t * flujos[t] / Math.pow(1 + r, t + 1);
    }
    if (Math.abs(dnpv) < 1e-10) break;
    const r2 = r - npv / dnpv;
    if (Math.abs(r2 - r) < 1e-8) { r = r2; break; }
    r = r2;
  }
  return isFinite(r) && r > -1 ? r : null;
}

function calcVAN(flujos, tasa) {
  return flujos.reduce((sum, f, t) => sum + f / Math.pow(1 + tasa, t), 0);
}

// ─── TAB P&L ───────────────────────────────────────────────────────────────
function TabPL({ crecimientoPct = 0 }) {
  const [barcos, setBarcos]       = useState([]);
  const [puertos, setPuertos]     = useState([]);
  const [consumos, setConsumos]   = useState([]);
  const [tripulacion, setTripulacion] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [barcoId, setBarcoId]     = useState("");
  const [puertoId, setPuertoId]   = useState("");
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rb, rp, rs] = await Promise.all([
          supabase.from(TABLE_BARCOS).select("*").order("created_at"),
          supabase.from(TABLE_PUERTOS).select("*").order("orden"),
          supabase.from(TABLE_SERVICIOS).select("*").order("orden"),
        ]);
        if (rb.error) throw rb.error;
        if (rp.error) throw rp.error;
        if (rs.error) throw rs.error;
        setBarcos(rb.data || []);
        setPuertos(rp.data || []);
        setServicios(rs.data || []);
        if (rb.data?.length > 0) setBarcoId(rb.data[0].id);
        if (rp.data?.length > 0) setPuertoId(rp.data[0].id);
      } catch (e) {
        setMsg({ type: "err", text: `Error al cargar datos: ${e.message}` });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!barcoId) return;
    (async () => {
      try {
        const [rc, rt] = await Promise.all([
          supabase.from(TABLE_CONSUMOS).select("*").eq("barco_id", barcoId).order("orden"),
          supabase.from(TABLE_TRIPULACION).select("*").eq("barco_id", barcoId).order("orden"),
        ]);
        if (rc.error) throw rc.error;
        if (rt.error) throw rt.error;
        setConsumos(rc.data || []);
        setTripulacion(rt.data || []);
      } catch (e) {
        setMsg({ type: "err", text: `Error al cargar datos del barco: ${e.message}` });
      }
    })();
  }, [barcoId]);

  if (loading) return <div className="empty-state">Cargando datos...</div>;

  const barco  = barcos.find(b => b.id === barcoId);
  const puerto = puertos.find(p => p.id === puertoId);
  const pl = barco && puerto ? calcularPL(barco, puerto, servicios, consumos, tripulacion, 7, crecimientoPct) : null;

  return (
    <div>
      {msg && <div className={`msg ${msg.type === "err" ? "msg-err" : "msg-ok"}`}>{msg.text}</div>}

      {/* Selectores */}
      <div className="card" style={{marginBottom:12}}>
        <div className="g2">
          <div className="campo">
            <div className="campo-label">Barco</div>
            <select className="campo-input" value={barcoId} onChange={e => setBarcoId(e.target.value)}>
              {barcos.map(b => <option key={b.id} value={b.id}>🚢 {b.nombre}</option>)}
            </select>
          </div>
          <div className="campo">
            <div className="campo-label">Puerto base</div>
            <select className="campo-input" value={puertoId} onChange={e => setPuertoId(e.target.value)}>
              {puertos.map(p => <option key={p.id} value={p.id}>🏗️ {p.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!pl && (
        <div className="empty-state">Seleccioná un barco y un puerto para ver el P&L.</div>
      )}

      {pl && (
        <>
          {/* KPIs */}
          <div className="kpis" style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
            {[
              { label: "TIR", val: pl.tir !== null ? `${(pl.tir * 100).toFixed(1)}%` : "N/A", cls: pl.tir !== null && pl.tir > 0.12 ? "green" : pl.tir !== null ? "red" : "" },
              { label: "VAN (12%)", val: fmtCompact(pl.van), cls: pl.van > 0 ? "green" : "red" },
              { label: "MOIC", val: `${pl.moic.toFixed(2)}x`, cls: pl.moic > 1.5 ? "green" : "" },
              { label: "CAPEX inicial", val: fmtCompact(pl.capexInicial), cls: "" },
              { label: "EBITDA año 1", val: fmtCompact(pl.anios[0]?.ebitda), cls: pl.anios[0]?.ebitda > 0 ? "green" : "red" },
              { label: "Margen EBITDA", val: `${((pl.anios[0]?.margenEbitda || 0) * 100).toFixed(1)}%`, cls: "" },
            ].map(k => (
              <div key={k.label} style={{flex:1,minWidth:90,background: k.cls === "green" ? "var(--green-bg)" : k.cls === "red" ? "var(--red-bg)" : "var(--bg)",border:`1px solid ${k.cls === "green" ? "var(--green-border)" : k.cls === "red" ? "var(--red-border)" : "var(--border)"}`,borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:18,fontWeight:800,fontFamily:"var(--mono)",color: k.cls === "green" ? "var(--green)" : k.cls === "red" ? "var(--red)" : "var(--navy)"}}>{k.val}</div>
                <div style={{fontSize:8,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5,marginTop:2}}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Tabla P&L */}
          <div className="card">
            <div className="sec">Estado de Resultados — {barco.nombre} · {puerto.nombre}</div>
            <div style={{overflowX:"auto"}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{textAlign:"left",width:200}}>Concepto</th>
                    {pl.anios.map(a => <th key={a.anio}>{a.anio}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Días disponibles",   key: "diasDisponibles",   fmt: n => `${Math.round(n)}d`, bold: false, muted: true },
                    { label: "Días operativos",     key: "diasOperativos",    fmt: n => `${Math.round(n)}d`, bold: false, muted: true },
                    { label: "Días dry dock",       key: "diasDrydock",       fmt: n => n > 0 ? `${Math.round(n)}d` : "—", bold: false, muted: true },
                    { label: "INGRESOS",            key: "ingresos",          fmt: fmtUSD, bold: true,  muted: false },
                    { label: "OPEX Variable",       key: "opexVariable",      fmt: n => fmtUSD(-n), bold: false, muted: false, red: true },
                    { label: "OPEX Fijo",           key: "opexFijo",          fmt: n => fmtUSD(-n), bold: false, muted: false, red: true },
                    { label: "Dry dock",            key: "costoDrydock",      fmt: n => n > 0 ? fmtUSD(-n) : "—", bold: false, muted: false, red: true },
                    { label: "EBITDA",              key: "ebitda",            fmt: fmtUSD, bold: true,  muted: false, green: true },
                    { label: "Margen EBITDA",       key: "margenEbitda",      fmt: n => `${(n*100).toFixed(1)}%`, bold: false, muted: true },
                    { label: "D&A",                 key: "da",                fmt: n => fmtUSD(-n), bold: false, muted: true },
                    { label: "EBIT",                key: "ebit",              fmt: fmtUSD, bold: true,  muted: false },
                    { label: "Impuesto (35%)",      key: "impuesto",          fmt: n => fmtUSD(-n), bold: false, muted: false, red: true },
                    { label: "RESULTADO NETO",      key: "resultadoNeto",     fmt: fmtUSD, bold: true,  muted: false, green: true },
                  ].map(row => (
                    <tr key={row.label} style={{background: row.bold ? "var(--bg)" : "transparent"}}>
                      <td style={{fontWeight: row.bold ? 800 : 500, color: row.muted ? "var(--muted)" : "var(--navy)", fontSize: row.bold ? 12 : 11}}>
                        {row.label}
                      </td>
                      {pl.anios.map(a => (
                        <td key={a.anio} style={{
                          textAlign:"right", fontFamily:"var(--mono)", fontWeight: row.bold ? 800 : 400,
                          color: row.green ? "var(--green)" : row.red ? "var(--red)" : row.muted ? "var(--muted)" : "var(--navy)",
                          fontSize: row.bold ? 12 : 11,
                        }}>
                          {row.fmt(a[row.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── TAB CASHFLOW ──────────────────────────────────────────────────────────
function TabCashflow({ crecimientoPct = 0 }) {
  const [barcos, setBarcos]       = useState([]);
  const [puertos, setPuertos]     = useState([]);
  const [consumos, setConsumos]   = useState([]);
  const [tripulacion, setTripulacion] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [barcoId, setBarcoId]     = useState("");
  const [puertoId, setPuertoId]   = useState("");
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rb, rp, rs] = await Promise.all([
          supabase.from(TABLE_BARCOS).select("*").order("created_at"),
          supabase.from(TABLE_PUERTOS).select("*").order("orden"),
          supabase.from(TABLE_SERVICIOS).select("*").order("orden"),
        ]);
        if (rb.error) throw rb.error;
        if (rp.error) throw rp.error;
        if (rs.error) throw rs.error;
        setBarcos(rb.data || []);
        setPuertos(rp.data || []);
        setServicios(rs.data || []);
        if (rb.data?.length > 0) setBarcoId(rb.data[0].id);
        if (rp.data?.length > 0) setPuertoId(rp.data[0].id);
      } catch (e) {
        setMsg({ type: "err", text: `Error al cargar datos: ${e.message}` });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!barcoId) return;
    (async () => {
      try {
        const [rc, rt] = await Promise.all([
          supabase.from(TABLE_CONSUMOS).select("*").eq("barco_id", barcoId).order("orden"),
          supabase.from(TABLE_TRIPULACION).select("*").eq("barco_id", barcoId).order("orden"),
        ]);
        if (rc.error) throw rc.error;
        if (rt.error) throw rt.error;
        setConsumos(rc.data || []);
        setTripulacion(rt.data || []);
      } catch (e) {
        setMsg({ type: "err", text: `Error al cargar datos del barco: ${e.message}` });
      }
    })();
  }, [barcoId]);

  if (loading) return <div className="empty-state">Cargando datos...</div>;

  const barco  = barcos.find(b => b.id === barcoId);
  const puerto = puertos.find(p => p.id === puertoId);
  const pl = barco && puerto ? calcularPL(barco, puerto, servicios, consumos, tripulacion, 7, crecimientoPct) : null;

  // Saldo acumulado calculado fuera del render para evitar mutación en JSX
  const saldosAcum = pl ? pl.anios.reduce((acc, a) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : -pl.capexInicial;
    acc.push(prev + a.fco + a.valorResidual);
    return acc;
  }, []) : [];

  return (
    <div>
      {msg && <div className={`msg ${msg.type === "err" ? "msg-err" : "msg-ok"}`}>{msg.text}</div>}

      <div className="card" style={{marginBottom:12}}>
        <div className="g2">
          <div className="campo">
            <div className="campo-label">Barco</div>
            <select className="campo-input" value={barcoId} onChange={e => setBarcoId(e.target.value)}>
              {barcos.map(b => <option key={b.id} value={b.id}>🚢 {b.nombre}</option>)}
            </select>
          </div>
          <div className="campo">
            <div className="campo-label">Puerto base</div>
            <select className="campo-input" value={puertoId} onChange={e => setPuertoId(e.target.value)}>
              {puertos.map(p => <option key={p.id} value={p.id}>🏗️ {p.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!pl && <div className="empty-state">Seleccioná un barco y un puerto para ver el Cashflow.</div>}

      {pl && (
        <>
          <div className="kpis" style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
            {[
              { label: "TIR", val: pl.tir !== null ? `${(pl.tir * 100).toFixed(1)}%` : "N/A", cls: pl.tir !== null && pl.tir > 0.12 ? "green" : pl.tir !== null ? "red" : "" },
              { label: "VAN (12%)", val: fmtCompact(pl.van), cls: pl.van > 0 ? "green" : "red" },
              { label: "MOIC", val: `${pl.moic.toFixed(2)}x`, cls: pl.moic > 1.5 ? "green" : "" },
              { label: "CAPEX inicial", val: fmtCompact(pl.capexInicial), cls: "" },
            ].map(k => (
              <div key={k.label} style={{flex:1,minWidth:90,background: k.cls === "green" ? "var(--green-bg)" : k.cls === "red" ? "var(--red-bg)" : "var(--bg)",border:`1px solid ${k.cls === "green" ? "var(--green-border)" : k.cls === "red" ? "var(--red-border)" : "var(--border)"}`,borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:18,fontWeight:800,fontFamily:"var(--mono)",color: k.cls === "green" ? "var(--green)" : k.cls === "red" ? "var(--red)" : "var(--navy)"}}>{k.val}</div>
                <div style={{fontSize:8,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5,marginTop:2}}>{k.label}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="sec">Flujo de Caja — {barco.nombre} · {puerto.nombre}</div>
            <div style={{overflowX:"auto"}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{textAlign:"left",width:200}}>Concepto</th>
                    <th style={{textAlign:"right",width:120}}>Año 0</th>
                    {pl.anios.map(a => <th key={a.anio} style={{textAlign:"right"}}>{a.anio}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{fontWeight:700,fontSize:12}}>FCO — Flujo Operativo</td>
                    <td style={{textAlign:"right",fontFamily:"var(--mono)",color:"var(--muted)"}}>—</td>
                    {pl.anios.map(a => (
                      <td key={a.anio} style={{textAlign:"right",fontFamily:"var(--mono)",fontWeight:700,color: a.fco >= 0 ? "var(--green)" : "var(--red)"}}>
                        {fmtUSD(a.fco)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{fontWeight:500,fontSize:11,color:"var(--muted)"}}>Valor residual</td>
                    <td style={{textAlign:"right",fontFamily:"var(--mono)",color:"var(--muted)"}}>—</td>
                    {pl.anios.map(a => (
                      <td key={a.anio} style={{textAlign:"right",fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>
                        {a.valorResidual > 0 ? fmtUSD(a.valorResidual) : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr style={{background:"var(--red-bg)"}}>
                    <td style={{fontWeight:700,fontSize:12}}>FCI — Inversión</td>
                    <td style={{textAlign:"right",fontFamily:"var(--mono)",fontWeight:800,color:"var(--red)"}}>
                      {fmtUSD(-pl.capexInicial)}
                    </td>
                    {pl.anios.map(a => (
                      <td key={a.anio} style={{textAlign:"right",fontFamily:"var(--mono)",color:"var(--muted)"}}>—</td>
                    ))}
                  </tr>
                  <tr style={{background:"var(--bg)"}}>
                    <td style={{fontWeight:800,fontSize:12}}>FLUJO NETO</td>
                    <td style={{textAlign:"right",fontFamily:"var(--mono)",fontWeight:800,color:"var(--red)"}}>
                      {fmtUSD(-pl.capexInicial)}
                    </td>
                    {pl.anios.map(a => {
                      const neto = a.fco + a.valorResidual;
                      return (
                        <td key={a.anio} style={{textAlign:"right",fontFamily:"var(--mono)",fontWeight:800,color: neto >= 0 ? "var(--green)" : "var(--red)"}}>
                          {fmtUSD(neto)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td style={{fontWeight:500,fontSize:11,color:"var(--muted)"}}>Saldo acumulado</td>
                    <td style={{textAlign:"right",fontFamily:"var(--mono)",fontSize:11,color:"var(--red)"}}>
                      {fmtUSD(-pl.capexInicial)}
                    </td>
                    {pl.anios.map((a, i) => (
                      <td key={a.anio} style={{textAlign:"right",fontFamily:"var(--mono)",fontSize:11,color: saldosAcum[i] >= 0 ? "var(--green)" : "var(--red)"}}>
                        {fmtUSD(saldosAcum[i])}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{fontWeight:500,fontSize:11,color:"var(--muted)"}}>FCFE (para TIR/VAN)</td>
                    <td style={{textAlign:"right",fontFamily:"var(--mono)",fontSize:11,fontWeight:700,color:"var(--red)"}}>
                      {fmtUSD(-pl.capexInicial)}
                    </td>
                    {pl.anios.map(a => (
                      <td key={a.anio} style={{textAlign:"right",fontFamily:"var(--mono)",fontSize:11,fontWeight:700,color:"var(--navy)"}}>
                        {fmtUSD(a.fco + a.valorResidual)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


const METRICAS = [
  { id: "tir",          label: "TIR",            fmt: v => v !== null ? `${(v * 100).toFixed(1)}%` : "N/A" },
  { id: "van",          label: "VAN (12%)",       fmt: v => fmtCompact(v) },
  { id: "moic",         label: "MOIC",            fmt: v => `${v.toFixed(2)}x` },
  { id: "ebitda1",      label: "EBITDA año 1",    fmt: v => fmtCompact(v) },
  { id: "resultadoNeto1", label: "Resultado neto año 1", fmt: v => fmtCompact(v) },
  { id: "margenEbitda1",  label: "Margen EBITDA",  fmt: v => `${(v * 100).toFixed(1)}%` },
];

function TabComparacion({ crecimientoPct = 0 }) {
  const [barcos, setBarcos]       = useState([]);
  const [puertos, setPuertos]     = useState([]);
  const [servicios, setServicios] = useState([]);
  const [consumosPorBarco, setConsumosPorBarco]     = useState({});
  const [tripulacionPorBarco, setTripulacionPorBarco] = useState({});
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState(null);
  const [metrica, setMetrica]     = useState("tir");
  const [maxAnios, setMaxAnios]   = useState(7);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rb, rp, rs] = await Promise.all([
          supabase.from(TABLE_BARCOS).select("*").order("created_at"),
          supabase.from(TABLE_PUERTOS).select("*").order("orden"),
          supabase.from(TABLE_SERVICIOS).select("*").order("orden"),
        ]);
        if (rb.error) throw rb.error;
        if (rp.error) throw rp.error;
        if (rs.error) throw rs.error;

        const barcosData = rb.data || [];
        setBarcos(barcosData);
        setPuertos(rp.data || []);
        setServicios(rs.data || []);

        // Cargar consumos y tripulación de todos los barcos
        const consumosMap = {};
        const tripMap = {};
        await Promise.all(barcosData.map(async (b) => {
          const [rc, rt] = await Promise.all([
            supabase.from(TABLE_CONSUMOS).select("*").eq("barco_id", b.id).order("orden"),
            supabase.from(TABLE_TRIPULACION).select("*").eq("barco_id", b.id).order("orden"),
          ]);
          consumosMap[b.id] = rc.data || [];
          tripMap[b.id]     = rt.data || [];
        }));
        setConsumosPorBarco(consumosMap);
        setTripulacionPorBarco(tripMap);
      } catch (e) {
        setMsg({ type: "err", text: `Error al cargar datos: ${e.message}` });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="empty-state">Calculando combinaciones...</div>;

  // Calcular todas las combinaciones barco × puerto
  const combinaciones = [];
  for (const barco of barcos) {
    for (const puerto of puertos) {
      const consumos   = consumosPorBarco[barco.id] || [];
      const tripulacion = tripulacionPorBarco[barco.id] || [];
      const pl = calcularPL(barco, puerto, servicios, consumos, tripulacion, maxAnios, crecimientoPct);
      if (!pl) continue;
      combinaciones.push({
        barco,
        puerto,
        tir:            pl.tir,
        van:            pl.van,
        moic:           pl.moic,
        ebitda1:        pl.anios[0]?.ebitda || 0,
        resultadoNeto1: pl.anios[0]?.resultadoNeto || 0,
        margenEbitda1:  pl.anios[0]?.margenEbitda || 0,
        capexInicial:   pl.capexInicial,
      });
    }
  }

  // Ordenar por métrica seleccionada
  const sorted = [...combinaciones].sort((a, b) => {
    const va = a[metrica] ?? -Infinity;
    const vb = b[metrica] ?? -Infinity;
    return vb - va;
  });

  const metricaMeta = METRICAS.find(m => m.id === metrica);
  const mejorVal = sorted.length > 0 ? sorted[0][metrica] : null;
  const peorVal  = sorted.length > 0 ? sorted[sorted.length - 1][metrica] : null;

  const getColor = (val) => {
    if (val === null || mejorVal === null || peorVal === null || mejorVal === peorVal) return "var(--navy)";
    const pct = (val - peorVal) / (mejorVal - peorVal);
    if (pct > 0.66) return "var(--green)";
    if (pct > 0.33) return "var(--gold)";
    return "var(--red)";
  };

  return (
    <div>
      {msg && <div className={`msg ${msg.type === "err" ? "msg-err" : "msg-ok"}`}>{msg.text}</div>}

      {/* Controles */}
      <div className="card" style={{marginBottom:12}}>
        <div className="g2">
          <div className="campo">
            <div className="campo-label">Métrica de ranking</div>
            <select className="campo-input" value={metrica} onChange={e => setMetrica(e.target.value)}>
              {METRICAS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div className="campo">
            <div className="campo-label">Evaluar hasta año</div>
            <select className="campo-input" value={maxAnios} onChange={e => setMaxAnios(+e.target.value)}>
              {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>Año {n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {combinaciones.length === 0 && (
        <div className="empty-state">No hay combinaciones disponibles. Cargá al menos un barco y un puerto.</div>
      )}

      {combinaciones.length > 0 && (
        <>
          {/* Podio top 3 */}
          {sorted.length >= 1 && (
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {sorted.slice(0, Math.min(3, sorted.length)).map((c, i) => (
                <div key={`${c.barco.id}-${c.puerto.id}`} style={{
                  flex:1,background: i === 0 ? "var(--navy)" : "var(--surface)",
                  border:`1px solid ${i === 0 ? "var(--navy)" : "var(--border)"}`,
                  borderRadius:10,padding:"14px 16px",
                }}>
                  <div style={{fontSize:9,color: i === 0 ? "rgba(255,255,255,.5)" : "var(--muted)",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>
                    {i === 0 ? "🥇 Mejor" : i === 1 ? "🥈 2do" : "🥉 3ro"} · {metricaMeta?.label}
                  </div>
                  <div style={{fontSize:20,fontWeight:800,fontFamily:"var(--mono)",color: i === 0 ? "#fff" : "var(--green)",marginBottom:4}}>
                    {metricaMeta?.fmt(c[metrica])}
                  </div>
                  <div style={{fontSize:11,fontWeight:700,color: i === 0 ? "rgba(255,255,255,.8)" : "var(--navy)"}}>
                    🚢 {c.barco.nombre}
                  </div>
                  <div style={{fontSize:10,color: i === 0 ? "rgba(255,255,255,.5)" : "var(--muted)"}}>
                    🏗️ {c.puerto.nombre}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tabla completa */}
          <div className="card">
            <div className="sec">Todas las combinaciones — ordenadas por {metricaMeta?.label}</div>
            <div style={{overflowX:"auto"}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{textAlign:"center",width:40}}>#</th>
                    <th style={{textAlign:"left"}}>Barco</th>
                    <th style={{textAlign:"left"}}>Puerto</th>
                    <th style={{textAlign:"right"}}>TIR</th>
                    <th style={{textAlign:"right"}}>VAN</th>
                    <th style={{textAlign:"right"}}>MOIC</th>
                    <th style={{textAlign:"right"}}>EBITDA año 1</th>
                    <th style={{textAlign:"right"}}>Res. Neto año 1</th>
                    <th style={{textAlign:"right"}}>Margen</th>
                    <th style={{textAlign:"right"}}>CAPEX</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c, i) => (
                    <tr key={`${c.barco.id}-${c.puerto.id}`}
                      style={{background: i === 0 ? "#EEF2F7" : "transparent"}}
                    >
                      <td style={{textAlign:"center",fontWeight:700,color:"var(--muted)",fontSize:10}}>
                        {i + 1}
                      </td>
                      <td style={{fontWeight:600}}>🚢 {c.barco.nombre}</td>
                      <td style={{color:"var(--muted)"}}>🏗️ {c.puerto.nombre}</td>
                      <td style={{textAlign:"right",fontFamily:"var(--mono)",fontWeight: metrica === "tir" ? 800 : 400,
                        color: metrica === "tir" ? getColor(c.tir) : c.tir !== null && c.tir > 0.12 ? "var(--green)" : "var(--red)"}}>
                        {c.tir !== null ? `${(c.tir * 100).toFixed(1)}%` : "N/A"}
                      </td>
                      <td style={{textAlign:"right",fontFamily:"var(--mono)",fontWeight: metrica === "van" ? 800 : 400,
                        color: metrica === "van" ? getColor(c.van) : c.van > 0 ? "var(--green)" : "var(--red)"}}>
                        {fmtCompact(c.van)}
                      </td>
                      <td style={{textAlign:"right",fontFamily:"var(--mono)",fontWeight: metrica === "moic" ? 800 : 400,
                        color: metrica === "moic" ? getColor(c.moic) : "var(--navy)"}}>
                        {c.moic.toFixed(2)}x
                      </td>
                      <td style={{textAlign:"right",fontFamily:"var(--mono)",fontWeight: metrica === "ebitda1" ? 800 : 400,
                        color: metrica === "ebitda1" ? getColor(c.ebitda1) : c.ebitda1 > 0 ? "var(--green)" : "var(--red)"}}>
                        {fmtCompact(c.ebitda1)}
                      </td>
                      <td style={{textAlign:"right",fontFamily:"var(--mono)",fontWeight: metrica === "resultadoNeto1" ? 800 : 400,
                        color: metrica === "resultadoNeto1" ? getColor(c.resultadoNeto1) : c.resultadoNeto1 > 0 ? "var(--green)" : "var(--red)"}}>
                        {fmtCompact(c.resultadoNeto1)}
                      </td>
                      <td style={{textAlign:"right",fontFamily:"var(--mono)",fontWeight: metrica === "margenEbitda1" ? 800 : 400,
                        color: metrica === "margenEbitda1" ? getColor(c.margenEbitda1) : "var(--navy)"}}>
                        {(c.margenEbitda1 * 100).toFixed(1)}%
                      </td>
                      <td style={{textAlign:"right",fontFamily:"var(--mono)",color:"var(--muted)"}}>
                        {fmtCompact(c.capexInicial)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{fontSize:9,color:"var(--muted)",marginTop:8,fontStyle:"italic"}}>
              * Crecimiento operaciones: {crecimientoPct}% anual · Evaluado a {maxAnios} {maxAnios === 1 ? "año" : "años"} · VLSFO y lubricante según cada puerto
            </p>
          </div>
        </>
      )}
    </div>
  );
}


// ─── MOTOR DE VIAJE ────────────────────────────────────────────────────────
function calcularViaje(escenario, barco, puerto, consumos, tripulacion, velocidad) {
  if (!escenario || !barco || !puerto || !velocidad) return null;

  const pvlsfo = puerto.precio_vlsfo || 1000;
  const plub   = puerto.precio_lubricante || 2200;

  // Fila de consumo para esta velocidad
  const fila = consumos.length > 0
    ? consumos.reduce((prev, curr) =>
        Math.abs(curr.velocidad - velocidad) < Math.abs(prev.velocidad - velocidad) ? curr : prev)
    : null;

  const consLastre  = fila?.consumo_lastre || 0;
  const consCarga   = fila?.consumo_carga  || 0;
  const consPuerto  = barco.consumo_puerto || 0;
  const lubPct      = (fila?.lubricante_pct || 3) / 100;
  const lubPuertoPct = (barco.lubricante_pct_puerto || 3) / 100;

  // Distancia según zona
  const dist = escenario.zona === "zona_comun" ? (puerto.dist_zona_comun || 0)
             : escenario.zona === "zona_alfa"  ? (puerto.dist_zona_alfa  || 0)
             : (puerto.dist_zona_delta || 0);

  // Tramo 0 — Alistamiento (horas → días fracción)
  const hsAlist     = escenario.hs_alistamiento || 0;
  const diasAlist   = hsAlist / 24;

  // Tramo 1 — Navegación ida (lastre para alije/lubricantes, cargado para slop, lastre para agua)
  const tipoServicio = escenario.tipo_servicio;
  const idaEsCarga   = tipoServicio === "slop"; // slop sale cargado (recoge slop del barco)
  const vueltaEsCarga = tipoServicio === "agua" || tipoServicio === "lubricantes"; // agua/lub vuelve vacío
  const consIda      = idaEsCarga ? consCarga : consLastre;
  const consVuelta   = vueltaEsCarga ? consLastre : consCarga;

  const hsNavIda     = velocidad > 0 ? (dist / velocidad) : 0;
  const diasNavIda   = hsNavIda / 24;

  // Tramo 2 — Operación
  const diasOp       = escenario.dias_operacion || 0;

  // Tramo 3 — Navegación vuelta
  const diasNavVuelta = diasNavIda; // misma distancia

  // Total días embarcados (redondeado arriba sobre el total)
  const totalDiasFraccion = diasAlist + diasNavIda + diasOp + diasNavVuelta;
  const totalDiasEmbarcados = Math.ceil(totalDiasFraccion);

  // Costos combustible por tramo
  const costoCombAlist   = diasAlist   * consPuerto  * pvlsfo;
  const costoLubAlist    = diasAlist   * consPuerto  * lubPuertoPct * plub;
  const costoCombIda     = diasNavIda  * consIda     * pvlsfo;
  const costoLubIda      = diasNavIda  * consIda     * lubPct * plub;
  const costoCombOp      = diasOp      * consPuerto  * pvlsfo;
  const costoLubOp       = diasOp      * consPuerto  * lubPuertoPct * plub;
  const costoCombVuelta  = diasNavVuelta * consVuelta * pvlsfo;
  const costoLubVuelta   = diasNavVuelta * consVuelta * lubPct * plub;

  const totalCombustible = costoCombAlist + costoCombIda + costoCombOp + costoCombVuelta;
  const totalLubricante  = costoLubAlist  + costoLubIda  + costoLubOp  + costoLubVuelta;

  // Costos tripulación (sobre días embarcados totales redondeados)
  const tripDia = tripulacion.reduce((s, r) => s + (r.cantidad_navegando || 0) * (r.costo_dia_navegando || 0), 0);
  const costoTrip = totalDiasEmbarcados * tripDia;

  // Costos puerto por operación (amarre es fijo mensual, no se carga por viaje)
  const costoPuerto = (puerto.costo_estiba || 0)
                    + (puerto.costo_bunker_operacion || 0)
                    + (puerto.costo_despacho_operacion || 0);

  // Costos específicos servicio
  let costoServicio = 0;
  if (tipoServicio === "agua")        costoServicio = (escenario.m3_agua || 0) * (puerto.costo_agua_m3 || 0);
  if (tipoServicio === "slop")        costoServicio = (escenario.m3_slop || 0) * (puerto.costo_slop_m3 || 0);

  const totalCostos = totalCombustible + totalLubricante + costoTrip + costoPuerto + costoServicio;

  // Ingresos
  let ingreso = 0;
  if (tipoServicio === "alije") {
    if (escenario.modalidad_pago === "mob_dia_operado") {
      ingreso = (escenario.mob_demob_usd || 0) + diasOp * (escenario.tarifa_dia_operando || 0);
    } else {
      ingreso = totalDiasFraccion * (escenario.tarifa_dia_navegando || 0);
    }
  } else if (tipoServicio === "agua") {
    ingreso = (escenario.m3_agua || 0) * (escenario.precio_unitario || 0);
  } else if (tipoServicio === "slop") {
    ingreso = (escenario.m3_slop || 0) * (escenario.precio_unitario || 0);
  } else if (tipoServicio === "lubricantes") {
    ingreso = (escenario.drums_lubricante || 0) * (escenario.precio_unitario || 0);
  }

  const resultado = ingreso - totalCostos;

  return {
    velocidad,
    dist,
    hsAlist, diasAlist,
    hsNavIda, diasNavIda, diasNavVuelta,
    diasOp,
    totalDiasFraccion,
    totalDiasEmbarcados,
    costoCombAlist, costoLubAlist,
    costoCombIda, costoLubIda,
    costoCombOp, costoLubOp,
    costoCombVuelta, costoLubVuelta,
    totalCombustible, totalLubricante,
    costoTrip, costoPuerto, costoServicio,
    totalCostos,
    ingreso,
    resultado,
    margen: ingreso > 0 ? resultado / ingreso : 0,
  };
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
const ZONA_LABEL = { zona_comun: "Zona Común", zona_alfa: "Zona Alfa", zona_delta: "Zona Delta" };
const nombreEscenario = (esc, puertos) => {
  const p = puertos.find(x => x.id === esc.puerto_id);
  const z = ZONA_LABEL[esc.zona] || esc.zona;
  return p ? `${p.nombre} → ${z}` : z;
};

// ─── TAB SERVICIO GENÉRICA ─────────────────────────────────────────────────
function TabServicio({ tipoServicio, titulo, icono }) {
  const [escenarios, setEscenarios]                   = useState([]);
  const [barcos, setBarcos]                           = useState([]);
  const [puertos, setPuertos]                         = useState([]);
  const [consumosPorBarco, setConsumosPorBarco]       = useState({});
  const [tripulacionPorBarco, setTripulacionPorBarco] = useState({});
  const [loading, setLoading]                         = useState(true);
  const [saving, setSaving]                           = useState(false);
  const [msg, setMsg]                                 = useState(null);
  const [activeIdx, setActiveIdx]                     = useState(0);

  const showMsg = useCallback((type, text) => {
    setMsg({ type, text });
    if (type === "ok") setTimeout(() => setMsg(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [re, rb, rp] = await Promise.all([
        supabase.from(TABLE_ESCENARIOS_SERVICIO).select("*")
          .eq("tipo_servicio", tipoServicio).order("orden"),
        supabase.from(TABLE_BARCOS).select("*").order("created_at"),
        supabase.from(TABLE_PUERTOS).select("*").order("orden"),
      ]);
      if (re.error) throw re.error;
      if (rb.error) throw rb.error;
      if (rp.error) throw rp.error;

      setEscenarios(re.data || []);
      setBarcos(rb.data || []);
      setPuertos(rp.data || []);

      const consumosMap = {};
      const tripMap = {};
      await Promise.all((rb.data || []).map(async (b) => {
        const [rc, rt] = await Promise.all([
          supabase.from(TABLE_CONSUMOS).select("*").eq("barco_id", b.id).order("orden"),
          supabase.from(TABLE_TRIPULACION).select("*").eq("barco_id", b.id).order("orden"),
        ]);
        consumosMap[b.id] = rc.data || [];
        tripMap[b.id]     = rt.data || [];
      }));
      setConsumosPorBarco(consumosMap);
      setTripulacionPorBarco(tripMap);
    } catch (e) {
      showMsg("err", `Error al cargar datos: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [tipoServicio, showMsg]);

  useEffect(() => { loadData(); }, [loadData]);

  const setField = useCallback((idx, key, val) => {
    setEscenarios(prev => prev.map((e, i) => i === idx ? { ...e, [key]: val } : e));
  }, []);

  const guardar = async (idx) => {
    const e = escenarios[idx];
    if (!e) return;
    setSaving(true);
    try {
      const { error } = await supabase.from(TABLE_ESCENARIOS_SERVICIO).update({
        nombre:               nombreEscenario(e, puertos),
        barco_id:             e.barco_id || null,
        puerto_id:            e.puerto_id || null,
        zona:                 e.zona,
        hs_alistamiento:      e.hs_alistamiento,
        dias_operacion:       e.dias_operacion,
        operaciones_anio:     e.operaciones_anio,
        modalidad_pago:       e.modalidad_pago,
        mob_demob_usd:        e.mob_demob_usd,
        tarifa_dia_navegando: e.tarifa_dia_navegando,
        tarifa_dia_operando:  e.tarifa_dia_operando,
        precio_unitario:      e.precio_unitario,
        m3_agua:              e.m3_agua,
        m3_slop:              e.m3_slop,
        drums_lubricante:     e.drums_lubricante,
      }).eq("id", e.id);
      if (error) throw error;
      setEscenarios(prev => prev.map((x, i) =>
        i === idx ? { ...x, nombre: nombreEscenario(e, puertos) } : x
      ));
      showMsg("ok", "Guardado.");
    } catch (err) {
      showMsg("err", `Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const nuevoEscenario = async () => {
    if (escenarios.length >= 20) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from(TABLE_ESCENARIOS_SERVICIO).insert({
        tipo_servicio:    tipoServicio,
        nombre:           `Escenario ${escenarios.length + 1}`,
        orden:            escenarios.length,
        hs_alistamiento:  12,
        dias_operacion:   1,
        operaciones_anio: 0,
        zona:             "zona_delta",
        modalidad_pago:   "mob_dia_operado",
        mob_demob_usd: 0, tarifa_dia_navegando: 0, tarifa_dia_operando: 0,
        precio_unitario: 0, m3_agua: 0, m3_slop: 0, drums_lubricante: 0,
      }).select().single();
      if (error) throw error;
      setEscenarios(prev => { setActiveIdx(prev.length); return [...prev, data]; });
    } catch (e) {
      showMsg("err", `No se pudo crear: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (idx) => {
    const e = escenarios[idx];
    if (!e || !window.confirm(`¿Eliminar "${nombreEscenario(e, puertos)}"?`)) return;
    try {
      const { error } = await supabase.from(TABLE_ESCENARIOS_SERVICIO).delete().eq("id", e.id);
      if (error) throw error;
      setEscenarios(prev => {
        const u = prev.filter((_, i) => i !== idx);
        setActiveIdx(i => Math.min(i, Math.max(0, u.length - 1)));
        return u;
      });
    } catch (err) {
      showMsg("err", `Error: ${err.message}`);
    }
  };

  if (loading) return <div className="empty-state">Cargando escenarios...</div>;

  const isAlije = tipoServicio === "alije";
  const isAgua  = tipoServicio === "agua";
  const isSlop  = tipoServicio === "slop";
  const isLub   = tipoServicio === "lubricantes";

  const FILAS = [
    { sec: "① Configuración" },
    { label: "Barco", render: (e, i) => (
        <select className="field-input" value={e.barco_id||""} onChange={ev => setField(i,"barco_id",ev.target.value)}>
          <option value="">— Seleccioná —</option>
          {barcos.map(b => <option key={b.id} value={b.id}>🚢 {b.nombre}</option>)}
        </select>
    )},
    { label: "Puerto de zarpe", render: (e, i) => (
        <select className="field-input" value={e.puerto_id||""} onChange={ev => setField(i,"puerto_id",ev.target.value)}>
          <option value="">— Seleccioná —</option>
          {puertos.map(p => <option key={p.id} value={p.id}>🏗️ {p.nombre}</option>)}
        </select>
    )},
    { label: "Zona de trabajo", render: (e, i) => (
        <select className="field-input" value={e.zona||"zona_delta"} onChange={ev => setField(i,"zona",ev.target.value)}>
          <option value="zona_comun">Zona Común</option>
          <option value="zona_alfa">Zona Alfa</option>
          <option value="zona_delta">Zona Delta</option>
        </select>
    )},
    { label: "Hs. alistamiento", render: (e, i) => (
        <input className="field-input" type="number" min="0" value={e.hs_alistamiento??12}
          onChange={ev => setField(i,"hs_alistamiento",parseNum(ev.target.value))} />
    )},
    { label: "Días en sitio", render: (e, i) => (
        <input className="field-input" type="number" min="0" step="0.5" value={e.dias_operacion??1}
          onChange={ev => setField(i,"dias_operacion",parseNum(ev.target.value))} />
    )},
    { label: "Operaciones / año", render: (e, i) => (
        <input className="field-input" type="number" min="0" value={e.operaciones_anio??0}
          onChange={ev => setField(i,"operaciones_anio",parseNum(ev.target.value))} />
    )},
    { sec: "② Tarifas" },
    ...(isAlije ? [
      { label: "Modalidad", render: (e, i) => (
          <select className="field-input" value={e.modalidad_pago||"mob_dia_operado"} onChange={ev => setField(i,"modalidad_pago",ev.target.value)}>
            <option value="mob_dia_operado">Mob/Demob + día op.</option>
            <option value="dia_zarpe">Día desde zarpe</option>
          </select>
      )},
      { label: "Mob/Demob (USD)", render: (e, i) => (
          <input className="field-input" type="number" min="0" value={e.mob_demob_usd??0}
            onChange={ev => setField(i,"mob_demob_usd",parseNum(ev.target.value))} />
      )},
      { label: "Tarifa día navegando", render: (e, i) => (
          <input className="field-input" type="number" min="0" value={e.tarifa_dia_navegando??0}
            onChange={ev => setField(i,"tarifa_dia_navegando",parseNum(ev.target.value))} />
      )},
      { label: "Tarifa día operando", render: (e, i) => (
          <input className="field-input" type="number" min="0" value={e.tarifa_dia_operando??0}
            onChange={ev => setField(i,"tarifa_dia_operando",parseNum(ev.target.value))} />
      )},
    ] : []),
    ...((isAgua || isSlop) ? [
      { label: isAgua ? "m³ a entregar" : "m³ slop a recoger", render: (e, i) => (
          <input className="field-input" type="number" min="0"
            value={isAgua ? (e.m3_agua??0) : (e.m3_slop??0)}
            onChange={ev => setField(i, isAgua?"m3_agua":"m3_slop", parseNum(ev.target.value))} />
      )},
      { label: "Precio (USD/m³)", render: (e, i) => (
          <input className="field-input" type="number" min="0" value={e.precio_unitario??0}
            onChange={ev => setField(i,"precio_unitario",parseNum(ev.target.value))} />
      )},
    ] : []),
    ...(isLub ? [
      { label: "Drums a entregar", render: (e, i) => (
          <input className="field-input" type="number" min="0" value={e.drums_lubricante??0}
            onChange={ev => setField(i,"drums_lubricante",parseNum(ev.target.value))} />
      )},
      { label: "Precio (USD/drum)", render: (e, i) => (
          <input className="field-input" type="number" min="0" value={e.precio_unitario??0}
            onChange={ev => setField(i,"precio_unitario",parseNum(ev.target.value))} />
      )},
    ] : []),
  ];

  // Tabla de sensibilidad del escenario activo
  const activeEsc     = escenarios[activeIdx];
  const activeBarco   = activeEsc ? barcos.find(b => b.id === activeEsc.barco_id) : null;
  const activePuerto  = activeEsc ? puertos.find(p => p.id === activeEsc.puerto_id) : null;
  const activeConsumos    = activeBarco ? (consumosPorBarco[activeBarco.id] || []) : [];
  const activeTripulacion = activeBarco ? (tripulacionPorBarco[activeBarco.id] || []) : [];
  const resultadosPorVel  = (activeBarco && activePuerto)
    ? activeConsumos.map(c =>
        calcularViaje(activeEsc, activeBarco, activePuerto, activeConsumos, activeTripulacion, c.velocidad)
      ).filter(Boolean)
    : [];

  const COL_W = 240;

  return (
    <div>
      {msg && <div className={`msg ${msg.type === "err" ? "msg-err" : "msg-ok"}`}>{msg.text}</div>}

      {/* Layout columnas */}
      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",marginBottom:16}}>
        <div style={{display:"flex",width:"max-content"}}>

          {/* Columna etiquetas */}
          <div style={{width:170,minWidth:170,flexShrink:0,paddingTop:52}}>
            {FILAS.map((fila, fi) => (
              fila.sec
                ? <div key={fi} style={{
                    height:34,display:"flex",alignItems:"center",padding:"0 10px",
                    marginTop:fi===0?0:8,fontSize:8,fontWeight:700,color:"var(--blue)",
                    textTransform:"uppercase",letterSpacing:1.5,
                    borderBottom:"1px solid var(--border)",background:"var(--bg)",
                  }}>{fila.sec}</div>
                : <div key={fi} style={{
                    height:38,display:"flex",alignItems:"center",padding:"0 10px",
                    fontSize:10,fontWeight:600,color:"var(--muted)",
                    borderBottom:"1px solid #F3F6FA",
                  }}>{fila.label}</div>
            ))}
          </div>

          {/* Columnas de escenarios */}
          {escenarios.map((esc, ei) => {
            const isActive = ei === activeIdx;
            return (
              <div key={esc.id} style={{
                width:COL_W,minWidth:COL_W,maxWidth:COL_W,flexShrink:0,
                borderLeft:"1px solid var(--border)",overflow:"hidden",
                outline: isActive ? "2px solid var(--blue)" : "none",
                outlineOffset:-1,
              }}>
                {/* Header */}
                <div style={{
                  height:52,display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"0 10px",cursor:"pointer",boxSizing:"border-box",width:COL_W,
                  background: isActive ? "var(--navy)" : "var(--mid)",
                }} onClick={() => setActiveIdx(ei)}>
                  <div style={{overflow:"hidden",flex:1}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#fff",whiteSpace:"nowrap",
                      overflow:"hidden",textOverflow:"ellipsis"}}>
                      {icono} {nombreEscenario(esc, puertos)}
                    </div>
                    <div style={{fontSize:8,color:"rgba(255,255,255,.5)",fontFamily:"var(--mono)",
                      textTransform:"uppercase",letterSpacing:.5,marginTop:2}}>
                      {esc.operaciones_anio||0} op/año
                    </div>
                  </div>
                  <button onClick={ev => { ev.stopPropagation(); eliminar(ei); }}
                    style={{background:"rgba(255,255,255,.15)",border:"none",color:"rgba(255,255,255,.7)",
                      fontSize:10,borderRadius:4,padding:"2px 6px",cursor:"pointer",flexShrink:0,marginLeft:4}}>
                    ✕
                  </button>
                </div>

                {/* Filas */}
                {FILAS.map((fila, fi) => (
                  fila.sec
                    ? <div key={fi} style={{height:34,marginTop:fi===0?0:8,
                        background:"var(--bg)",borderBottom:"1px solid var(--border)"}} />
                    : <div key={fi} style={{
                        height:38,display:"flex",alignItems:"center",
                        padding:"0 6px",borderBottom:"1px solid #F3F6FA",
                        width:COL_W,boxSizing:"border-box",overflow:"hidden",
                      }}>
                        {fila.render(esc, ei)}
                      </div>
                ))}

                {/* Footer */}
                <div style={{padding:"10px 6px 6px",borderTop:"1px solid var(--border)",marginTop:4}}>
                  <button className="btn btn-primary" style={{width:"100%",fontSize:10,padding:"6px 0"}}
                    onClick={() => guardar(ei)} disabled={saving}>
                    {saving ? "..." : "Guardar"}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Columna agregar */}
          {escenarios.length < 20 && (
            <div style={{width:COL_W,minWidth:COL_W,flexShrink:0,borderLeft:"1px solid var(--border)"}}>
              <div style={{height:52,display:"flex",alignItems:"center",justifyContent:"center",
                background:"var(--bg)"}}>
                <button className="sel-btn add" onClick={nuevoEscenario} disabled={saving} style={{margin:0}}>
                  + Nuevo escenario
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de sensibilidad del escenario activo */}
      {escenarios.length > 0 && (
        <div className="card">
          <div className="sec">
            Sensibilidad por velocidad —&nbsp;
            <span style={{color:"var(--navy)",fontWeight:800,textTransform:"none",letterSpacing:0}}>
              {activeEsc ? nombreEscenario(activeEsc, puertos) : ""}
            </span>
          </div>

          {(!activeBarco || !activePuerto) ? (
            <div className="empty-state" style={{padding:20}}>
              Seleccioná barco y puerto en este escenario para ver el análisis.
            </div>
          ) : resultadosPorVel.length === 0 ? (
            <div className="empty-state" style={{padding:20}}>Sin datos de consumo para este barco.</div>
          ) : (
            <>
              <div style={{overflowX:"auto"}}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vel. (kn)</th><th>Dist. (nm)</th><th>Hs. nav.</th>
                      <th>Días emb. ↑</th><th>Combustible</th><th>Lubricante</th>
                      <th>Tripulación</th><th>Puerto</th><th>Total costos</th>
                      <th>Ingreso</th><th style={{fontWeight:800}}>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadosPorVel.map((r, i) => {
                      const esMejor = r.resultado === Math.max(...resultadosPorVel.map(x => x.resultado));
                      return (
                        <tr key={i} style={{background: esMejor ? "var(--green-bg)" : "transparent"}}>
                          <td style={{fontWeight:700,textAlign:"center"}}>{r.velocidad}</td>
                          <td style={{textAlign:"right",fontFamily:"var(--mono)"}}>{r.dist}</td>
                          <td style={{textAlign:"right",fontFamily:"var(--mono)"}}>{r.hsNavIda.toFixed(1)}</td>
                          <td style={{textAlign:"center",fontWeight:700,color:"var(--navy)",fontFamily:"var(--mono)"}}>{r.totalDiasEmbarcados}</td>
                          <td style={{textAlign:"right",fontFamily:"var(--mono)",color:"var(--red)"}}>{fmtCompact(r.totalCombustible)}</td>
                          <td style={{textAlign:"right",fontFamily:"var(--mono)",color:"var(--red)"}}>{fmtCompact(r.totalLubricante)}</td>
                          <td style={{textAlign:"right",fontFamily:"var(--mono)",color:"var(--red)"}}>{fmtCompact(r.costoTrip)}</td>
                          <td style={{textAlign:"right",fontFamily:"var(--mono)",color:"var(--red)"}}>{fmtCompact(r.costoPuerto)}</td>
                          <td style={{textAlign:"right",fontFamily:"var(--mono)",fontWeight:700,color:"var(--red)"}}>{fmtCompact(r.totalCostos)}</td>
                          <td style={{textAlign:"right",fontFamily:"var(--mono)",color:"var(--green)"}}>{fmtCompact(r.ingreso)}</td>
                          <td style={{textAlign:"right",fontFamily:"var(--mono)",fontWeight:800,
                            color: r.resultado>=0?"var(--green)":"var(--red)"}}>{fmtCompact(r.resultado)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p style={{fontSize:9,color:"var(--muted)",marginTop:8,fontStyle:"italic"}}>
                * Verde = velocidad óptima · Días redondeados ↑ · VLSFO {fmtUSD(activePuerto.precio_vlsfo||1000)}/Tn · Lub {fmtUSD(activePuerto.precio_lubricante||2200)}/drum
              </p>
            </>
          )}
        </div>
      )}

      {escenarios.length === 0 && (
        <div className="empty-state">No hay escenarios. Creá uno para empezar.</div>
      )}
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
  const [session, setSession]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("barcos");
  const [crecimientoPct, setCrecimientoPct] = useState(4);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s); setLoading(false);
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
        {tab === "puertos"     && <TabPuertos />}
        {tab === "alije"       && <TabServicio tipoServicio="alije"       titulo="Alijes"             icono="⚓" />}
        {tab === "agua"        && <TabServicio tipoServicio="agua"        titulo="Entrega de Agua"    icono="💧" />}
        {tab === "slop"        && <TabServicio tipoServicio="slop"        titulo="Transporte de Slop" icono="🛢️" />}
        {tab === "lubricantes" && <TabServicio tipoServicio="lubricantes" titulo="Lubricantes"        icono="🔧" />}
        {tab === "pl"          && <TabPL crecimientoPct={crecimientoPct} onCrecimientoChange={setCrecimientoPct} />}
        {tab === "cashflow"    && <TabCashflow crecimientoPct={crecimientoPct} onCrecimientoChange={setCrecimientoPct} />}
        {tab === "comparacion" && <TabComparacion crecimientoPct={crecimientoPct} onCrecimientoChange={setCrecimientoPct} />}
      </div>
    </>
  );
}
