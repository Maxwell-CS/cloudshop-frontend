import { useState } from 'react';
import { Search, ArrowDown } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { productService } from '../services/productService';
import ProductCard from '../components/ProductCard';
import RequestState from '../components/RequestState';
export default function Products() {
  const request = useFetch(productService.list);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [sort, setSort] = useState('default');
  const [available, setAvailable] = useState(false);
  const products = request.data || [];
  const categories = ['Todos', ...new Set(products.map(p => p.categoria))];
  const filtered = products.filter(p => (category === 'Todos' || p.categoria === category) && `${p.nombre} ${p.marca}`.toLowerCase().includes(search.toLowerCase().trim()) && (!available || p.stock > 0)).sort((a, b) => sort === 'asc' ? a.precio - b.precio : sort === 'desc' ? b.precio - a.precio : 0);
  return <main className="container"><section className="intro"><div><p className="eyebrow">TU PRÓXIMO UPGRADE</p><h1>Lo que necesitas.<br/><span>Sin dar tantas vueltas.</span></h1><p>Encuentra tecnología para trabajar, estudiar<br className="desktop-break"/> y disfrutar a tu manera.</p></div><a className="intro-link" href="#catalogo">Explora el catálogo <ArrowDown size={18}/></a></section><section id="catalogo" className="catalog"><div className="catalog-heading"><h2>Elige tu próximo equipo</h2><label className="search"><Search size={19}/><input aria-label="Buscar productos" placeholder="¿Qué estás buscando?" value={search} onChange={e => setSearch(e.target.value)}/></label></div><div className="filters"><div className="categories" aria-label="Categorías">{categories.map(c => <button key={c} aria-pressed={category === c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div><label className="sort">Ordenar por <select aria-label="Ordenar productos" value={sort} onChange={e => setSort(e.target.value)}><option value="default">Destacados</option><option value="asc">Menor precio</option><option value="desc">Mayor precio</option></select></label></div><div className="results"><span aria-live="polite">{filtered.length} productos</span><label><input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)}/> Solo disponibles</label></div><RequestState {...request}/>{!request.loading && !request.error && (filtered.length ? <div className="product-grid">{filtered.map(p => <ProductCard key={p.id} product={p}/>)}</div> : <div className="notice"><h3>No encontramos productos</h3><p>Prueba con otra búsqueda o categoría.</p><button onClick={() => { setSearch(''); setCategory('Todos'); setAvailable(false); }}>Limpiar filtros</button></div>)}</section></main>;
}
