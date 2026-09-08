import { api, isDemo } from './api';
export const demoProducts = [
  { id: '1', nombre: 'Laptop Studio 14', marca: 'CLOUDSHOP SELECT', categoria: 'Laptops', precio: 3299, stock: 8, tipo: 'laptop', color: '#7c8f82', descripcion: 'Una laptop ligera para estudiar, trabajar y llevar tus proyectos a cualquier lugar.', specs: { Procesador: 'Intel Core i5', Memoria: '16 GB RAM', Almacenamiento: '512 GB SSD', Pantalla: '14 pulgadas · Full HD' } },
  { id: '2', nombre: 'Audífonos Wireless Pro', marca: 'CLOUDSHOP SELECT', categoria: 'Audio', precio: 249, stock: 24, tipo: 'headphones', color: '#c4b69e', descripcion: 'Audio inalámbrico y un diseño cómodo para acompañarte durante el día.', specs: { Conexión: 'Bluetooth 5.3', Autonomía: 'Hasta 30 horas', Carga: 'USB-C', Formato: 'Over-ear' } },
  { id: '3', nombre: 'Teclado mecánico K75', marca: 'CLOUDSHOP SELECT', categoria: 'Accesorios', precio: 289, stock: 12, tipo: 'keyboard', color: '#bac7ba', descripcion: 'Un formato compacto que deja más espacio en tu escritorio sin renunciar a lo esencial.', specs: { Distribución: 'Español · 75 %', Switches: 'Mecánicos táctiles', Conexión: 'USB-C', Material: 'ABS' } },
  { id: '4', nombre: 'Monitor View 27', marca: 'CLOUDSHOP SELECT', categoria: 'Monitores', precio: 899, stock: 5, tipo: 'monitor', color: '#a3b4be', descripcion: 'Más espacio para tus ideas. Una pantalla amplia para trabajar y disfrutar tu contenido.', specs: { Pantalla: '27 pulgadas · IPS', Resolución: '2560 × 1440', Frecuencia: '75 Hz', Puertos: 'HDMI / DisplayPort' } },
  { id: '5', nombre: 'Mouse inalámbrico M3', marca: 'CLOUDSHOP SELECT', categoria: 'Accesorios', precio: 119, stock: 0, tipo: 'mouse', color: '#c5bcaa', descripcion: 'Precisión y comodidad en un mouse compacto, pensado para el uso diario.', specs: { Sensor: 'Óptico · 2400 DPI', Conexión: 'Bluetooth / USB', Botones: '6', Alimentación: 'Recargable' } },
  { id: '6', nombre: 'Parlante portátil Mini', marca: 'CLOUDSHOP SELECT', categoria: 'Audio', precio: 159, stock: 18, tipo: 'speaker', color: '#9eafa0', descripcion: 'Tu música, donde estés. Un parlante pequeño y fácil de llevar.', specs: { Potencia: '10 W', Conexión: 'Bluetooth 5.3', Autonomía: 'Hasta 12 horas', Carga: 'USB-C' } },
];
export const productService = {
  list: () => isDemo ? Promise.resolve(demoProducts) : api('/catalogo/productos'),
  get: (id) => isDemo ? Promise.resolve(demoProducts.find(p => p.id === id) || null) : api(`/catalogo/productos/${encodeURIComponent(id)}`),
};
