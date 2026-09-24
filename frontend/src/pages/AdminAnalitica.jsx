import { useCallback, useState } from 'react';
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

const reports = [
  {
    id: 'ticket-promedio', label: 'Ticket promedio', description: 'Importe medio de las órdenes confirmadas por ciudad.',
    columns: [
      { key: 'ciudad', label: 'Ciudad' },
      { key: 'ticket_promedio', label: 'Ticket promedio', format: money },
      { key: 'total_ordenes', label: 'Órdenes', format: number },
    ],
    chart: 'ticket_promedio',
  },
  {
    id: 'productos-mas-vendidos', label: 'Productos más vendidos', description: 'Unidades vendidas e ingresos por producto.',
    columns: [
      { key: 'nombre', label: 'Producto' },
      { key: 'unidades_vendidas', label: 'Unidades', format: number },
      { key: 'ingresos', label: 'Ingresos', format: money },
    ],
    chart: 'unidades_vendidas',
  },
  {
    id: 'ventas-por-categoria', label: 'Ventas por categoría', description: 'Ingresos mensuales de cada categoría.',
    columns: [
      { key: 'categoria', label: 'Categoría' },
      { key: 'mes', label: 'Mes' },
      { key: 'ingresos', label: 'Ingresos', format: money },
    ],
    chart: 'ingresos',
  },
  {
    id: 'ventas-por-ciudad', label: 'Ventas por ciudad', description: 'Órdenes confirmadas e ingresos por ciudad.',
    columns: [
      { key: 'ciudad', label: 'Ciudad' },
      { key: 'total_ordenes', label: 'Órdenes', format: number },
      { key: 'ingresos', label: 'Ingresos', format: money },
    ],
    chart: 'ingresos',
  },
  {
    id: 'calificacion-vs-ventas', label: 'Calificación y ventas', description: 'Relación entre reseñas y unidades vendidas.',
    columns: [
      { key: 'nombre', label: 'Producto' },
      { key: 'calificacion_promedio', label: 'Calificación', format: number },
      { key: 'unidades_vendidas', label: 'Unidades', format: number },
    ],
    chart: 'unidades_vendidas',
  },
  {
    id: 'clientes-frecuentes', label: 'Clientes frecuentes', description: 'Clientes con más órdenes confirmadas.',
    columns: [
      { key: 'nombre', label: 'Cliente' },
      { key: 'email', label: 'Correo' },
      { key: 'total_ordenes', label: 'Órdenes', format: number },
      { key: 'gasto_total', label: 'Gasto total', format: money },
    ],
    chart: 'total_ordenes',
  },
];

function ReportResults({ report }) {
  const loader = useCallback(() => analiticaService.consultar(report.id), [report.id]);
  const request = useFetch(loader);
  const rows = request.data || [];
  const max = Math.max(0, ...rows.map(row => Number(row[report.chart]) || 0));

  return <div className="analytics-results">
    <div className="analytics-toolbar"><p>{report.description}</p><button className="text-button" onClick={request.retry} disabled={request.loading}>Actualizar consulta</button></div>
    <RequestState {...request}/>
    {!request.loading && !request.error && (rows.length
      ? <><p className="analytics-count">{number(rows.length)} resultados · Fuente: AWS Athena</p><div className="analytics-table-wrap"><table className="admin-table analytics-table">
          <thead><tr>{report.columns.map(column => <th key={column.key} scope="col">{column.label}</th>)}<th scope="col">Comparación</th></tr></thead>
          <tbody>{rows.map((row, index) => <tr key={`${report.id}-${index}`}>
            {report.columns.map(column => <td key={column.key}>{column.format ? column.format(row[column.key]) : (row[column.key] || '—')}</td>)}
            <td><div className="analytics-bar" aria-hidden="true"><span style={{ width: `${max > 0 ? Math.max(0, Math.min(100, Number(row[report.chart]) / max * 100)) : 0}%` }}/></div></td>
          </tr>)}</tbody>
        </table></div></>
      : <p className="empty-address">La consulta no devolvió registros. Comprueba que la ingesta haya cargado datos en S3.</p>)}
  </div>;
}

export default function AdminAnalitica() {
  const [selected, setSelected] = useState(reports[0].id);
  const report = reports.find(item => item.id === selected);

  return <section className="admin-section analytics-section">
    <div className="section-heading"><div><h2>Analítica de CloudShop</h2><p className="analytics-intro">Seis consultas del microservicio analítico. Acceso exclusivo para administradores.</p></div></div>
    <div className="analytics-selector" role="group" aria-label="Consultas de analítica">
      {reports.map(item => <button key={item.id} type="button" className={selected === item.id ? 'selected' : ''} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>{item.label}</button>)}
    </div>
    <h3 className="analytics-title">{report.label}</h3>
    {!isDemo && <ReportResults key={report.id} report={report}/>}
  </section>;
}
