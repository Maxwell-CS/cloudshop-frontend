import { useCallback, useState } from 'react';
import { BarChart3, Database, RefreshCw } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import RequestState from '../components/RequestState';
import { isDemo } from '../services/api';
import { analiticaService } from '../services/analiticaService';
import { money } from '../utils/format';

const number = value => {
  const parsed = Number(value);
  return value === '' || value == null || !Number.isFinite(parsed)
    ? '—'
    : new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 }).format(parsed);
};

const safeNumber = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const sum = (rows, key) => rows.reduce((total, row) => total + safeNumber(row[key]), 0);
const uniqueCount = (rows, key) => new Set(rows.map(row => row[key]).filter(value => value != null && value !== '')).size;
const leader = (rows, key) => rows.reduce((best, row) => safeNumber(row[key]) > safeNumber(best?.[key]) ? row : best, null);

const reports = [
  {
    id: 'ticket-promedio', label: 'Ticket promedio', description: 'Importe medio de las órdenes confirmadas por ciudad.',
    columns: [
      { key: 'ciudad', label: 'Ciudad' },
      { key: 'ticket_promedio', label: 'Ticket promedio', format: money },
      { key: 'total_ordenes', label: 'Órdenes', format: number },
    ],
    chart: 'ticket_promedio', chartFormat: money, chartTitle: 'Ticket promedio por ciudad',
    chartLabel: row => row.ciudad || 'Sin ciudad',
  },
  {
    id: 'productos-mas-vendidos', label: 'Productos más vendidos', description: 'Unidades vendidas e ingresos por producto.',
    columns: [
      { key: 'nombre', label: 'Producto' },
      { key: 'unidades_vendidas', label: 'Unidades', format: number },
      { key: 'ingresos', label: 'Ingresos', format: money },
    ],
    chart: 'unidades_vendidas', chartFormat: number, chartTitle: 'Unidades vendidas por producto',
    chartLabel: row => row.nombre || 'Sin producto',
  },
  {
    id: 'ventas-por-categoria', label: 'Ventas por categoría', description: 'Ingresos mensuales de cada categoría.',
    columns: [
      { key: 'categoria', label: 'Categoría' },
      { key: 'mes', label: 'Mes' },
      { key: 'ingresos', label: 'Ingresos', format: money },
    ],
    chart: 'ingresos', chartFormat: money, chartTitle: 'Evolución mensual por categoría', chartType: 'trend',
    chartLabel: row => `${row.categoria || 'Sin categoría'} · ${row.mes || 'Sin mes'}`,
  },
  {
    id: 'ventas-por-ciudad', label: 'Ventas por ciudad', description: 'Órdenes confirmadas e ingresos por ciudad.',
    columns: [
      { key: 'ciudad', label: 'Ciudad' },
      { key: 'total_ordenes', label: 'Órdenes', format: number },
      { key: 'ingresos', label: 'Ingresos', format: money },
    ],
    chart: 'ingresos', chartFormat: money, chartTitle: 'Ingresos por ciudad',
    chartLabel: row => row.ciudad || 'Sin ciudad',
  },
  {
    id: 'calificacion-vs-ventas', label: 'Calificación y ventas', description: 'Relación entre reseñas y unidades vendidas.',
    columns: [
      { key: 'nombre', label: 'Producto' },
      { key: 'calificacion_promedio', label: 'Calificación', format: number },
      { key: 'unidades_vendidas', label: 'Unidades', format: number },
    ],
    chart: 'unidades_vendidas', chartFormat: number, chartTitle: 'Calificación frente a unidades vendidas', chartType: 'scatter',
    chartLabel: row => row.nombre || 'Sin producto',
  },
  {
    id: 'clientes-frecuentes', label: 'Clientes frecuentes', description: 'Clientes con más órdenes confirmadas.',
    columns: [
      { key: 'nombre', label: 'Cliente' },
      { key: 'email', label: 'Correo' },
      { key: 'total_ordenes', label: 'Órdenes', format: number },
      { key: 'gasto_total', label: 'Gasto total', format: money },
    ],
    chart: 'total_ordenes', chartFormat: number, chartTitle: 'Órdenes por cliente',
    chartLabel: row => row.nombre || row.email || 'Sin cliente',
  },
];

function buildMetrics(report, rows) {
  const top = leader(rows, report.chart);
  switch (report.id) {
    case 'ticket-promedio': {
      const orders = sum(rows, 'total_ordenes');
      const weighted = orders > 0
        ? rows.reduce((total, row) => total + safeNumber(row.ticket_promedio) * safeNumber(row.total_ordenes), 0) / orders
        : 0;
      return [
        { label: 'Ticket ponderado', value: money(weighted), note: 'Según órdenes por ciudad' },
        { label: 'Órdenes analizadas', value: number(orders), note: `${number(rows.length)} ciudades` },
        { label: 'Mayor ticket', value: top?.ciudad || '—', note: top ? money(top.ticket_promedio) : 'Sin datos' },
      ];
    }
    case 'productos-mas-vendidos':
      return [
        { label: 'Unidades vendidas', value: number(sum(rows, 'unidades_vendidas')), note: 'Total de la consulta' },
        { label: 'Ingresos', value: money(sum(rows, 'ingresos')), note: 'Ventas confirmadas' },
        { label: 'Producto líder', value: top?.nombre || '—', note: top ? `${number(top.unidades_vendidas)} unidades` : 'Sin datos' },
      ];
    case 'ventas-por-categoria':
      return [
        { label: 'Ingresos', value: money(sum(rows, 'ingresos')), note: 'Total del periodo' },
        { label: 'Categorías', value: number(uniqueCount(rows, 'categoria')), note: 'Con ventas registradas' },
        { label: 'Periodos', value: number(uniqueCount(rows, 'mes')), note: 'Meses disponibles' },
      ];
    case 'ventas-por-ciudad':
      return [
        { label: 'Ingresos', value: money(sum(rows, 'ingresos')), note: 'Total por ciudades' },
        { label: 'Órdenes', value: number(sum(rows, 'total_ordenes')), note: 'Ventas confirmadas' },
        { label: 'Ciudad líder', value: top?.ciudad || '—', note: top ? money(top.ingresos) : 'Sin datos' },
      ];
    case 'calificacion-vs-ventas': {
      const rated = rows.filter(row => safeNumber(row.calificacion_promedio) > 0);
      const average = rated.length ? sum(rated, 'calificacion_promedio') / rated.length : 0;
      return [
        { label: 'Calificación media', value: average ? `${number(average)} / 5` : '—', note: `${number(rated.length)} productos calificados` },
        { label: 'Unidades vendidas', value: number(sum(rows, 'unidades_vendidas')), note: 'Total de la consulta' },
        { label: 'Más vendido', value: top?.nombre || '—', note: top ? `${number(top.unidades_vendidas)} unidades` : 'Sin datos' },
      ];
    }
    case 'clientes-frecuentes':
      return [
        { label: 'Gasto acumulado', value: money(sum(rows, 'gasto_total')), note: 'Clientes del ranking' },
        { label: 'Órdenes', value: number(sum(rows, 'total_ordenes')), note: 'Compras confirmadas' },
        { label: 'Cliente principal', value: top?.nombre || top?.email || '—', note: top ? `${number(top.total_ordenes)} órdenes` : 'Sin datos' },
      ];
    default:
      return [];
  }
}

function ChartHeader({ title, detail }) {
  return <div className="analytics-chart-header">
    <div><span>VISUALIZACIÓN</span><h4>{title}</h4></div>
    <p>{detail}</p>
  </div>;
}

function BarChart({ report, rows }) {
  const values = rows
    .map(row => ({ label: report.chartLabel(row), value: safeNumber(row[report.chart]) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const max = Math.max(0, ...values.map(item => item.value));

  return <div className="analytics-chart-panel">
    <ChartHeader title={report.chartTitle} detail={`Top ${number(values.length)}`}/>
    <div className="analytics-bars" role="img" aria-label={report.chartTitle}>
      {values.map((item, index) => <div className="analytics-bar-row" key={`${item.label}-${index}`}>
        <div className="analytics-bar-label"><span title={item.label}>{item.label}</span><strong>{report.chartFormat(item.value)}</strong></div>
        <div className="analytics-bar-track" aria-hidden="true"><span style={{ width: `${max > 0 ? Math.max(2, item.value / max * 100) : 0}%` }}/></div>
      </div>)}
    </div>
  </div>;
}

function ScatterChart({ report, rows }) {
  const width = 760;
  const height = 300;
  const padding = { left: 54, right: 28, top: 22, bottom: 42 };
  const maxUnits = Math.max(1, ...rows.map(row => safeNumber(row.unidades_vendidas)));
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const x = value => padding.left + Math.max(0, Math.min(5, safeNumber(value))) / 5 * plotWidth;
  const y = value => padding.top + plotHeight - safeNumber(value) / maxUnits * plotHeight;

  return <div className="analytics-chart-panel">
    <ChartHeader title={report.chartTitle} detail="Cada punto representa un producto"/>
    <div className="analytics-svg-wrap">
      <svg className="analytics-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={report.chartTitle}>
        {[0, .25, .5, .75, 1].map(tick => <line key={tick} x1={padding.left} x2={width - padding.right} y1={padding.top + plotHeight * tick} y2={padding.top + plotHeight * tick} className="analytics-grid-line"/>)}
        {[0, 1, 2, 3, 4, 5].map(tick => <g key={tick}><line x1={x(tick)} x2={x(tick)} y1={height - padding.bottom} y2={height - padding.bottom + 5} className="analytics-axis-line"/><text x={x(tick)} y={height - 18} textAnchor="middle" className="analytics-axis-text">{tick}</text></g>)}
        <text x={padding.left - 8} y={padding.top + 4} textAnchor="end" className="analytics-axis-text">{number(maxUnits)}</text>
        <text x={padding.left - 8} y={height - padding.bottom + 4} textAnchor="end" className="analytics-axis-text">0</text>
        {rows.map((row, index) => <circle key={`${report.chartLabel(row)}-${index}`} cx={x(row.calificacion_promedio)} cy={y(row.unidades_vendidas)} r="7" className="analytics-dot"><title>{`${report.chartLabel(row)}: ${number(row.calificacion_promedio)} estrellas, ${number(row.unidades_vendidas)} unidades`}</title></circle>)}
      </svg>
      <div className="analytics-axis-caption"><span>Unidades vendidas ↑</span><span>Calificación promedio →</span></div>
    </div>
  </div>;
}

function TrendChart({ report, rows }) {
  const width = 760;
  const height = 300;
  const padding = { left: 54, right: 28, top: 22, bottom: 48 };
  const months = [...new Set(rows.map(row => String(row.mes || 'Sin mes')))].sort((a, b) => a.localeCompare(b, 'es'));
  const categories = [...new Set(rows.map(row => String(row.categoria || 'Sin categoría')))].slice(0, 6);
  const palette = ['#245b46', '#9a6b3d', '#65788a', '#7b6a8d', '#7b8561', '#a05e58'];
  const points = categories.map(category => ({
    category,
    values: months.map(month => rows.filter(row => String(row.categoria || 'Sin categoría') === category && String(row.mes || 'Sin mes') === month).reduce((total, row) => total + safeNumber(row.ingresos), 0)),
  }));
  const max = Math.max(1, ...points.flatMap(series => series.values));
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const x = index => padding.left + (months.length > 1 ? index / (months.length - 1) * plotWidth : plotWidth / 2);
  const y = value => padding.top + plotHeight - value / max * plotHeight;

  if (months.length < 2) return <BarChart report={report} rows={rows}/>;

  return <div className="analytics-chart-panel">
    <ChartHeader title={report.chartTitle} detail={`${number(months.length)} periodos`}/>
    <div className="analytics-svg-wrap">
      <svg className="analytics-svg" style={{ minWidth: `${Math.max(620, months.length * 90)}px` }} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={report.chartTitle}>
        {[0, .25, .5, .75, 1].map(tick => <line key={tick} x1={padding.left} x2={width - padding.right} y1={padding.top + plotHeight * tick} y2={padding.top + plotHeight * tick} className="analytics-grid-line"/>)}
        <text x={padding.left - 8} y={padding.top + 4} textAnchor="end" className="analytics-axis-text">{number(max)}</text>
        <text x={padding.left - 8} y={height - padding.bottom + 4} textAnchor="end" className="analytics-axis-text">0</text>
        {months.map((month, index) => <text key={month} x={x(index)} y={height - 20} textAnchor="middle" className="analytics-axis-text">{month}</text>)}
        {points.map((series, seriesIndex) => <g key={series.category}>
          <polyline points={series.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')} fill="none" stroke={palette[seriesIndex]} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
          {series.values.map((value, index) => <circle key={`${series.category}-${months[index]}`} cx={x(index)} cy={y(value)} r="5" fill={palette[seriesIndex]}><title>{`${series.category} · ${months[index]}: ${money(value)}`}</title></circle>)}
        </g>)}
      </svg>
      <div className="analytics-legend">{categories.map((category, index) => <span key={category}><i style={{ backgroundColor: palette[index] }}/>{category}</span>)}</div>
    </div>
  </div>;
}

function AnalyticsChart({ report, rows }) {
  if (report.chartType === 'scatter') return <ScatterChart report={report} rows={rows}/>;
  if (report.chartType === 'trend') return <TrendChart report={report} rows={rows}/>;
  return <BarChart report={report} rows={rows}/>;
}

function ReportResults({ report }) {
  const loader = useCallback(() => analiticaService.consultar(report.id), [report.id]);
  const request = useFetch(loader);
  const rows = request.data || [];
  const metrics = buildMetrics(report, rows);

  return <div className="analytics-results">
    <div className="analytics-toolbar"><p>{report.description}</p><button className="analytics-refresh" onClick={request.retry} disabled={request.loading}><RefreshCw size={14}/> Actualizar datos</button></div>
    <RequestState {...request}/>
    {!request.loading && !request.error && (rows.length
      ? <>
        <div className="analytics-kpis">{metrics.map(metric => <article key={metric.label}><span>{metric.label}</span><strong title={metric.value}>{metric.value}</strong><small>{metric.note}</small></article>)}</div>
        <AnalyticsChart report={report} rows={rows}/>
        <div className="analytics-detail-heading"><div><span>DETALLE</span><h4>Resultados de la consulta</h4></div><p><Database size={14}/>{number(rows.length)} registros · AWS Athena</p></div>
        <div className="analytics-table-wrap"><table className="admin-table analytics-table">
          <thead><tr>{report.columns.map(column => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead>
          <tbody>{rows.map((row, index) => <tr key={`${report.id}-${index}`}>{report.columns.map(column => <td key={column.key}>{column.format ? column.format(row[column.key]) : (row[column.key] || '—')}</td>)}</tr>)}</tbody>
        </table></div>
      </>
      : <p className="empty-address">La consulta no devolvió registros. Comprueba que la ingesta haya cargado datos en S3.</p>)}
  </div>;
}

export default function AdminAnalitica() {
  const [selected, setSelected] = useState(reports[0].id);
  const report = reports.find(item => item.id === selected);

  return <section className="admin-section analytics-section">
    <div className="section-heading"><div><p className="analytics-overline"><BarChart3 size={15}/> CENTRO DE ANÁLISIS</p><h2>Analítica de CloudShop</h2><p className="analytics-intro">Información procesada por el microservicio analítico. Cada vista consulta únicamente el reporte seleccionado.</p></div></div>
    <div className="analytics-selector" role="group" aria-label="Consultas de analítica">
      {reports.map(item => <button key={item.id} type="button" className={selected === item.id ? 'selected' : ''} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>{item.label}</button>)}
    </div>
    <div className="analytics-report-heading"><div><span>REPORTE ACTIVO</span><h3>{report.label}</h3></div><p>Consulta almacenada en caché durante 5 minutos</p></div>
    {isDemo
      ? <div className="analytics-live-state"><Database size={22}/><div><strong>Datos analíticos disponibles en el entorno conectado a AWS</strong><p>Esta vista se alimenta de los endpoints reales de analítica cuando <code>VITE_USE_MOCKS=false</code>.</p></div></div>
      : <ReportResults key={report.id} report={report}/>}
  </section>;
}
