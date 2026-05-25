import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";

const PORTAL_URL = "https://evaluacion-proyectos.vercel.app";
const TABLE_BARCOS      = "gdm_barcos";
const TABLE_ESCENARIOS  = "gdm_escenarios";
const TABLE_CONSUMOS    = "gdm_consumos";
const TABLE_TRIPULACION = "gdm_tripulacion";
const TABLE_PUERTOS     = "gdm_puertos";

const TABS = [
  { id: "barcos",      label: "Barcos",          icon: "🚢" },
  { id: "puertos",     label: "Puertos",         icon: "🏗️" },
  { id: "servicios",   label: "Servicios",       icon: "⚙️" },
  { id: "variables",   label: "Variables",       icon: "⛽" },
  { id: "pl",          label: "P&L",             icon: "📊" },
  { id: "cashflow",    label: "Cashflow",        icon: "💰" },
  { id: "comparacion", label: "Comparación",     icon: "📐" },
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
  opex_drydock: 60000,
  opex_seguros: 60000,
  opex_comunicaciones: 3000,
  opex_prefectura: 4400,
  opex_admin: 60000,
  opex_retiro_slob: 7000,
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
const calcOpexFijo = (b) =>
  (b.opex_mantenimiento || 0) + (b.opex_drydock || 0) + (b.opex_seguros || 0) +
  (b.opex_comunicaciones || 0) + (b.opex_prefectura || 0) + (b.opex_admin || 0) +
  (b.opex_retiro_slob || 0);

// ─── BLOQUE CONSUMOS ───────────────────────────────────────────────────────
function BloqueConsumos({ barcoId, precioVlsfo }) {
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

  const pvlsfo = precioVlsfo || 1000;

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

      <p className="nota">* Precio VLSFO tomado de Variables Globales ({fmtUSD(pvlsfo)}/Tn)</p>

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
function TabBarcos({ precioVlsfo }) {
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
      const { error } = await supabase.from(TABLE_BARCOS).update(barco).eq("id", barco.id);
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
          </div>
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
      <BloqueConsumos barcoId={barco.id} precioVlsfo={precioVlsfo} />

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
            ["opex_drydock",        "Dry dock / dique seco"],
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

// ─── TAB VARIABLES GLOBALES ────────────────────────────────────────────────
function TabVariables({ onPrecioChange }) {
  const [vars, setVars]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  const showMsg = useCallback((type, text) => {
    setMsg({ type, text });
    if (type === "ok") setTimeout(() => setMsg(null), 3000);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("gdm_variables_globales").select("*").order("clave");
        if (error) throw error;
        setVars(data || []);
        const vlsfo = data?.find(v => v.clave === "precio_vlsfo");
        if (vlsfo && onPrecioChange) onPrecioChange(vlsfo.valor);
      } catch (e) {
        showMsg("err", `Error al cargar variables: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [showMsg, onPrecioChange]);

  const setVar = (id, val) => {
    setVars(prev => prev.map(v => v.id === id ? { ...v, valor: parseNum(val) } : v));
  };

  const guardar = async () => {
    setSaving(true);
    try {
      for (const v of vars) {
        const { error } = await supabase.from("gdm_variables_globales")
          .update({ valor: v.valor, updated_at: new Date().toISOString() })
          .eq("id", v.id);
        if (error) throw error;
      }
      const vlsfo = vars.find(v => v.clave === "precio_vlsfo");
      if (vlsfo && onPrecioChange) onPrecioChange(vlsfo.valor);
      showMsg("ok", "Variables guardadas.");
    } catch (e) {
      showMsg("err", `Error al guardar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state">Cargando variables...</div>;

  return (
    <div>
      {msg && <div className={`msg ${msg.type === "err" ? "msg-err" : "msg-ok"}`}>{msg.text}</div>}
      <div className="card">
        <div className="sec">⛽ Variables globales — afectan todos los modelos</div>
        <div className="g2">
          {vars.map(v => (
            <div className="campo" key={v.id}>
              <div className="campo-label">{v.descripcion || v.clave}</div>
              <input className="campo-input" type="number" value={v.valor}
                onChange={e => setVar(v.id, e.target.value)} />
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
          <button className="btn btn-primary" onClick={guardar} disabled={saving}>
            {saving ? "Guardando..." : "Guardar variables"}
          </button>
        </div>
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
  costo_agua_m3: 0,
  costo_slop_m3: 0,
  costo_bunker_operacion: 0,
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
  const [selIdx, setSelIdx]     = useState(0);
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
        setSelIdx(0);
      } else {
        setPuertos(data);
        setSelIdx(0);
      }
    } catch (e) {
      showMsg("err", `Error al cargar puertos: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [showMsg]);

  useEffect(() => { loadPuertos(); }, [loadPuertos]);

  const set = useCallback((k, v) => {
    setPuertos(prev => prev.map((p, i) => i === selIdx ? { ...p, [k]: v } : p));
  }, [selIdx]);

  const guardar = async () => {
    const puerto = puertos[selIdx];
    if (!puerto) return;
    setSaving(true);
    try {
      const { error } = await supabase.from(TABLE_PUERTOS).update({
        nombre: puerto.nombre,
        activo: puerto.activo,
        costo_portuario_dia: puerto.costo_portuario_dia,
        costo_estiba: puerto.costo_estiba,
        costo_agua_m3: puerto.costo_agua_m3,
        costo_slop_m3: puerto.costo_slop_m3,
        costo_bunker_operacion: puerto.costo_bunker_operacion,
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
      showMsg("ok", "Puerto guardado correctamente.");
    } catch (e) {
      showMsg("err", `No se pudo guardar: ${e.message}`);
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
      setPuertos(prev => { const u = [...prev, data]; setSelIdx(u.length - 1); return u; });
    } catch (e) {
      showMsg("err", `No se pudo crear el puerto: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    const puerto = puertos[selIdx];
    if (!puerto) return;
    if (!window.confirm(`¿Eliminar "${puerto.nombre}"? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    try {
      const { error } = await supabase.from(TABLE_PUERTOS).delete().eq("id", puerto.id);
      if (error) throw error;
      setPuertos(prev => { const u = prev.filter((_, i) => i !== selIdx); setSelIdx(Math.max(0, selIdx - 1)); return u; });
      showMsg("ok", "Puerto eliminado.");
    } catch (e) {
      showMsg("err", `No se pudo eliminar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state">Cargando puertos...</div>;

  const puerto = puertos[selIdx];
  if (!puerto) return <div className="empty-state">No hay puertos cargados.</div>;

  return (
    <div>
      {msg && <div className={`msg ${msg.type === "err" ? "msg-err" : "msg-ok"}`}>{msg.text}</div>}

      <div className="selector">
        {puertos.map((p, i) => (
          <button key={p.id} className={`sel-btn ${i === selIdx ? "on" : ""}`} onClick={() => setSelIdx(i)}>
            🏗️ {p.nombre}
          </button>
        ))}
        {puertos.length < 5 && (
          <button className="sel-btn add" onClick={nuevoPuerto} disabled={saving}>+ Nuevo puerto</button>
        )}
      </div>

      <div className="g2">
        <div className="card">
          <div className="sec">① Identidad</div>
          <div className="g2">
            <div className="campo"><div className="campo-label">Nombre</div>
              <input className="campo-input" value={puerto.nombre || ""} onChange={e => set("nombre", e.target.value)} /></div>
            <div className="campo"><div className="campo-label">Estado</div>
              <select className="campo-input" value={puerto.activo ? "true" : "false"} onChange={e => set("activo", e.target.value === "true")}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="sec">② Distancias a zonas de trabajo (nm)</div>
          <div className="g3">
            <div className="campo"><div className="campo-label">Zona Común</div>
              <input className="campo-input" type="number" value={puerto.dist_zona_comun ?? 0} onChange={e => set("dist_zona_comun", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">Zona Alfa</div>
              <input className="campo-input" type="number" value={puerto.dist_zona_alfa ?? 0} onChange={e => set("dist_zona_alfa", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">Zona Delta</div>
              <input className="campo-input" type="number" value={puerto.dist_zona_delta ?? 0} onChange={e => set("dist_zona_delta", parseNum(e.target.value))} /></div>
          </div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="sec">③ Costos operativos (USD)</div>
          <div className="g2">
            <div className="campo"><div className="campo-label">Costo portuario (por día)</div>
              <input className="campo-input" type="number" value={puerto.costo_portuario_dia ?? 0} onChange={e => set("costo_portuario_dia", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">Costo estiba (por operación)</div>
              <input className="campo-input" type="number" value={puerto.costo_estiba ?? 0} onChange={e => set("costo_estiba", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">Agua (USD/m³)</div>
              <input className="campo-input" type="number" value={puerto.costo_agua_m3 ?? 0} onChange={e => set("costo_agua_m3", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">Slop (USD/m³)</div>
              <input className="campo-input" type="number" value={puerto.costo_slop_m3 ?? 0} onChange={e => set("costo_slop_m3", parseNum(e.target.value))} /></div>
            <div className="campo"><div className="campo-label">Bunker (por operación)</div>
              <input className="campo-input" type="number" value={puerto.costo_bunker_operacion ?? 0} onChange={e => set("costo_bunker_operacion", parseNum(e.target.value))} /></div>
          </div>
        </div>

        <div className="card">
          <div className="sec">④ Costos indirectos</div>
          <div className="campo"><div className="campo-label">Lump sum mensual (USD)</div>
            <input className="campo-input" type="number" value={puerto.costo_indirecto_lumpsum ?? 0} onChange={e => set("costo_indirecto_lumpsum", parseNum(e.target.value))} /></div>
          <div className="campo" style={{marginTop:6}}><div className="campo-label">Descripción / nota</div>
            <textarea className="campo-input" rows={3} value={puerto.nota_indirectos || ""}
              onChange={e => set("nota_indirectos", e.target.value)}
              style={{resize:"vertical",fontFamily:"var(--sans)",fontSize:12}} /></div>
        </div>
      </div>

      <div className="card">
        <div className="sec">⑤ Restricciones y condiciones operativas</div>
        <div className="g4">
          <div className="campo"><div className="campo-label">Calado máx. (m)</div>
            <input className="campo-input" type="number" step="0.1" value={puerto.calado_max_m ?? 0} onChange={e => set("calado_max_m", parseNum(e.target.value))} /></div>
          <div className="campo"><div className="campo-label">Horas operativas / día</div>
            <input className="campo-input" type="number" value={puerto.horas_operativas ?? 24} onChange={e => set("horas_operativas", parseNum(e.target.value))} /></div>
          <div className="campo"><div className="campo-label">Espera promedio (hs)</div>
            <input className="campo-input" type="number" step="0.5" value={puerto.espera_promedio_hs ?? 0} onChange={e => set("espera_promedio_hs", parseNum(e.target.value))} /></div>
          <div className="campo"><div className="campo-label">Grúa disponible</div>
            <select className="campo-input" value={puerto.tiene_grua ? "true" : "false"} onChange={e => set("tiene_grua", e.target.value === "true")}>
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>
        </div>
        <div className="campo" style={{marginTop:4}}><div className="campo-label">Restricciones de viento / clima</div>
          <input className="campo-input" value={puerto.restriccion_viento || ""} onChange={e => set("restriccion_viento", e.target.value)}
            placeholder="Ej: Operación suspendida con viento > 25 kn" /></div>
      </div>

      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
        {puertos.length > 1 && (
          <button className="btn btn-danger" onClick={eliminar} disabled={saving}>Eliminar puerto</button>
        )}
        <button className="btn btn-primary" onClick={guardar} disabled={saving}>
          {saving ? "Guardando..." : "Guardar puerto"}
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
  const [session, setSession]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState("barcos");
  const [precioVlsfo, setPrecioVlsfo] = useState(1000);
  const handlePrecioChange = useCallback((precio) => setPrecioVlsfo(precio), []);

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
        {tab === "barcos"      && <TabBarcos precioVlsfo={precioVlsfo} />}
        {tab === "puertos"     && <TabPuertos />}
        {tab === "servicios"   && <Pronto label="Servicios — próximamente" />}
        {tab === "variables"   && <TabVariables onPrecioChange={handlePrecioChange} />}
        {tab === "pl"          && <Pronto label="P&L — próximamente" />}
        {tab === "cashflow"    && <Pronto label="Cashflow — próximamente" />}
        {tab === "comparacion" && <Pronto label="Comparación — próximamente" />}
      </div>
    </>
  );
}
