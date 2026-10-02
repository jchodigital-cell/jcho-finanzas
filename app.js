const CATEGORIAS = {
  ingreso: ['Salario', 'Ventas', 'Inversiones', 'Otros ingresos'],
  gasto: ['Alimentación', 'Transporte', 'Vivienda', 'Salud', 'Educación', 'Entretenimiento', 'Otros gastos']
};
const COLORES = ['#38bdf8', '#4ade80', '#f87171', '#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#fb923c'];

let transacciones = JSON.parse(localStorage.getItem('jcho-transacciones') || '[]');

const $ = id => document.getElementById(id);
const form = $('form-transaccion');
const lista = $('lista-transacciones');

// Categorías según tipo
$('tipo').addEventListener('change', actualizarCategorias);
function actualizarCategorias() {
  const tipo = $('tipo').value;
  $('categoria').innerHTML = CATEGORIAS[tipo].map(c => `<option value="${c}">${c}</option>`).join('');
}
actualizarCategorias();

// Fecha por defecto: hoy
$('fecha').value = new Date().toISOString().slice(0, 10);

form.addEventListener('submit', e => {
  e.preventDefault();
  transacciones.push({
    id: Date.now(),
    tipo: $('tipo').value,
    monto: parseFloat($('monto').value),
    categoria: $('categoria').value,
    fecha: $('fecha').value,
    descripcion: $('descripcion').value.trim()
  });
  guardar();
  form.reset();
  $('fecha').value = new Date().toISOString().slice(0, 10);
  actualizarCategorias();
  render();
});

$('filtro-mes').addEventListener('change', render);
$('limpiar-filtro').addEventListener('click', () => { $('filtro-mes').value = ''; render(); });
$('exportar').addEventListener('click', exportarCSV);

function guardar() {
  localStorage.setItem('jcho-transacciones', JSON.stringify(transacciones));
}

function transaccionesFiltradas() {
  const mes = $('filtro-mes').value; // 'YYYY-MM'
  return transacciones.filter(t => !mes || t.fecha.startsWith(mes));
}

function render() {
  const datos = transaccionesFiltradas();
  const ingresos = datos.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
  const gastos = datos.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0);
  const fmt = n => 'S/ ' + n.toFixed(2);
  $('total-ingresos').textContent = fmt(ingresos);
  $('total-gastos').textContent = fmt(gastos);
  $('balance').textContent = fmt(ingresos - gastos);

  lista.innerHTML = '';
  $('sin-datos').style.display = datos.length ? 'none' : 'block';
  [...datos].sort((a, b) => b.fecha.localeCompare(a.fecha)).forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${t.categoria}</strong> ${t.descripcion ? '— ' + escapeHtml(t.descripcion) : ''}<br><small>${t.fecha}</small></div>
      <div><span class="monto ${t.tipo}">${t.tipo === 'gasto' ? '-' : '+'} ${fmt(t.monto)}</span>
      <button data-id="${t.id}">✕</button></div>`;
    li.querySelector('button').addEventListener('click', () => {
      transacciones = transacciones.filter(x => x.id !== t.id);
      guardar(); render();
    });
    lista.appendChild(li);
  });

  renderGrafico(datos.filter(t => t.tipo === 'gasto'));
}

function renderGrafico(gastos) {
  const porCategoria = {};
  gastos.forEach(t => porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + t.monto);
  const total = Object.values(porCategoria).reduce((s, n) => s + n, 0);
  const svg = $('grafico-donut');
  const leyenda = $('leyenda');
  svg.innerHTML = ''; leyenda.innerHTML = '';
  if (total === 0) {
    svg.innerHTML = '<text x="100" y="105" fill="#64748b" text-anchor="middle" font-size="12">Sin gastos</text>';
    return;
  }
  let ang = -90;
  Object.entries(porCategoria).forEach(([cat, val], i) => {
    const frac = val / total;
    const a1 = ang, a2 = ang + frac * 360;
    ang = a2;
    const pol = (a, r) => [100 + r * Math.cos(a * Math.PI / 180), 100 + r * Math.sin(a * Math.PI / 180)];
    const [x1, y1] = pol(a1, 80), [x2, y2] = pol(a2, 80), [x3, y3] = pol(a2, 50), [x4, y4] = pol(a1, 50);
    const grande = frac > 0.5 ? 1 : 0;
    svg.innerHTML += `<path d="M${x1},${y1} A80,80 0 ${grande} 1 ${x2},${y2} L${x3},${y3} A50,50 0 ${grande} 0 ${x4},${y4} Z" fill="${COLORES[i % COLORES.length]}"/>`;
    leyenda.innerHTML += `<li><span class="dot" style="background:${COLORES[i % COLORES.length]}"></span>${cat}: S/ ${val.toFixed(2)} (${(frac * 100).toFixed(1)}%)</li>`;
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function exportarCSV() {
  const datos = transaccionesFiltradas();
  if (!datos.length) return alert('No hay datos para exportar.');
  const filas = [['Tipo', 'Monto', 'Categoría', 'Fecha', 'Descripción']];
  datos.forEach(t => filas.push([t.tipo, t.monto.toFixed(2), t.categoria, t.fecha, t.descripcion]));
  const csv = filas.map(f => f.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'jcho-finanzas.csv';
  a.click();
}

render();
