const CATEGORIAS = {
  ingreso: ['Salario', 'Ventas', 'Inversiones', 'Arriendo casa Delicias', 'Arriendo apartamento Protecho Salado', 'Otros ingresos'],
  gasto: ['Alimentación', 'Transporte', 'Vivienda', 'Salud', 'Educación', 'Colegio', 'Entretenimiento', 'Luz', 'Gas', 'Agua', 'Internet casa', 'Internet plan personal', 'Otros gastos']
};
const COLORES = ['#38bdf8', '#4ade80', '#f87171', '#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#fb923c'];
const ICONOS = {
  'Salario': '💼', 'Ventas': '🛒', 'Inversiones': '📈', 'Otros ingresos': '💰',
  'Arriendo casa Delicias': '🏠', 'Arriendo apartamento Protecho Salado': '🏢',
  'Alimentación': '🍔', 'Transporte': '🚗', 'Vivienda': '🏘️', 'Salud': '🏥',
  'Educación': '📚', 'Colegio': '🏫', 'Entretenimiento': '🎮', 'Luz': '💡',
  'Gas': '🔥', 'Agua': '💧', 'Internet casa': '🏠📶', 'Internet plan personal': '📱',
  'Otros gastos': '📦'
};
const icono = c => ICONOS[c] || '💳';

const FIREBASE_URL = 'https://jcho-finanzas-default-rtdb.firebaseio.com';

async function cargarNube() {
  try {
    const r = await fetch(`${FIREBASE_URL}/jcho.json`);
    const d = await r.json();
    if (d) {
      if (d.transacciones) transacciones = d.transacciones;
      if (d.presupuesto != null) presupuesto = d.presupuesto;
      if (d.meta_ahorro != null) metaAhorro = d.meta_ahorro;
      if (d.mes_ahorro === new Date().toISOString().slice(0, 7) && d.ahorrado != null) ahorrado = d.ahorrado;
      if (d.tema) localStorage.setItem('jcho-tema', d.tema);
      guardarLocal();
      if (presupuesto > 0) $('presupuesto').value = presupuesto;
      if (metaAhorro > 0) $('meta-ahorro').value = metaAhorro;
      if (localStorage.getItem('jcho-tema') === 'claro') { document.body.classList.add('claro'); $('tema-btn').textContent = '🌙 Modo oscuro'; }
      render();
    } else {
      guardarNube(); // subir datos locales si la nube está vacía
    }
  } catch (e) { console.warn('Sin conexión a la nube', e); }
}

async function guardarNube() {
  try {
    await fetch(`${FIREBASE_URL}/jcho.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transacciones, presupuesto, meta_ahorro: metaAhorro, ahorrado, mes_ahorro: mesActual, tema: localStorage.getItem('jcho-tema') || 'oscuro' })
    });
  } catch (e) { console.warn('No se pudo sincronizar', e); }
}

function guardarLocal() {
  localStorage.setItem('jcho-transacciones', JSON.stringify(transacciones));
  localStorage.setItem('jcho-presupuesto', presupuesto);
  localStorage.setItem('jcho-meta-ahorro', metaAhorro);
  localStorage.setItem('jcho-ahorrado', ahorrado);
  localStorage.setItem('jcho-mes-ahorro', mesActual);
}

function guardar() {
  guardarLocal();
  guardarNube();
}

let transacciones = JSON.parse(localStorage.getItem('jcho-transacciones') || '[]');
let presupuesto = parseFloat(localStorage.getItem('jcho-presupuesto') || '0');
let editId = null;

const $ = id => document.getElementById(id);
let metaAhorro = parseFloat(localStorage.getItem('jcho-meta-ahorro') || '0');
let mesAhorroGuardado = localStorage.getItem('jcho-mes-ahorro') || '';
const mesActual = new Date().toISOString().slice(0, 7);
let ahorrado = mesAhorroGuardado === mesActual
  ? parseFloat(localStorage.getItem('jcho-ahorrado') || '0')
  : 0; // Reinicio automático cada mes
if (mesAhorroGuardado !== mesActual) {
  localStorage.setItem('jcho-mes-ahorro', mesActual);
  localStorage.setItem('jcho-ahorrado', 0);
}
if (presupuesto > 0) $('presupuesto').value = presupuesto;
if (metaAhorro > 0) $('meta-ahorro').value = metaAhorro;
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
  const nueva = {
    id: editId ?? Date.now(),
    tipo: $('tipo').value,
    monto: parseFloat($('monto').value),
    categoria: $('categoria').value,
    fecha: $('fecha').value,
    descripcion: $('descripcion').value.trim()
  };
  if (editId) {
    transacciones = transacciones.map(t => t.id === editId ? nueva : t);
    editId = null;
    form.querySelector('button[type=submit]').textContent = 'Agregar';
  } else {
    transacciones.push(nueva);
  }
  guardar();
  form.reset();
  $('fecha').value = new Date().toISOString().slice(0, 10);
  actualizarCategorias();
  render();
});

$('filtro-mes').addEventListener('change', render);
$('buscar').addEventListener('input', render);
$('aportar').addEventListener('click', () => {
  ahorrado += parseFloat($('aporte-ahorro').value) || 0;
  metaAhorro = parseFloat($('meta-ahorro').value) || 0;
  $('aporte-ahorro').value = '';
  guardar();
  render();
});
$('reiniciar-ahorro').addEventListener('click', () => {
  ahorrado = 0; metaAhorro = 0;
  $('meta-ahorro').value = '';
  guardar();
  render();
});
$('guardar-presupuesto').addEventListener('click', () => {
  presupuesto = parseFloat($('presupuesto').value) || 0;
  guardar();
  render();
});
$('limpiar-filtro').addEventListener('click', () => { $('filtro-mes').value = ''; render(); });
$('exportar').addEventListener('click', exportarCSV);
$('exportar-pdf').addEventListener('click', () => window.print());

function transaccionesFiltradas() {
  const mes = $('filtro-mes').value;
  const q = ($('buscar').value || '').toLowerCase();
  return transacciones.filter(t => (!mes || t.fecha.startsWith(mes)) &&
    (!q || (t.descripcion || '').toLowerCase().includes(q) || t.categoria.toLowerCase().includes(q)));
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
    li.innerHTML = `<div><strong>${icono(t.categoria)} ${t.categoria}</strong> ${t.descripcion ? '— ' + escapeHtml(t.descripcion) : ''}<br><small>${t.fecha}</small></div>
      <div><span class="monto ${t.tipo}">${t.tipo === 'gasto' ? '-' : '+'} ${fmt(t.monto)}</span><br><button class="editar" data-id="${t.id}">✎</button><button data-id="${t.id}">✕</button></div>`;
    li.querySelector('button:last-child').addEventListener('click', () => {
      transacciones = transacciones.filter(x => x.id !== t.id);
      guardar(); render();
    });
    li.querySelector('.editar').addEventListener('click', () => {
      editId = t.id;
      $('tipo').value = t.tipo;
      actualizarCategorias();
      $('monto').value = t.monto;
      $('categoria').value = t.categoria;
      $('fecha').value = t.fecha;
      $('descripcion').value = t.descripcion;
      form.querySelector('button[type=submit]').textContent = 'Actualizar';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    lista.appendChild(li);
  });

  // Presupuesto
  const gastosTotal = datos.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0);
  const pct = presupuesto > 0 ? Math.min(100, (gastosTotal / presupuesto) * 100) : 0;
  $('barra-presupuesto').style.width = pct + '%';
  $('texto-presupuesto').textContent = presupuesto > 0
    ? `Gastaste S/ ${gastosTotal.toFixed(2)} de S/ ${presupuesto.toFixed(2)} (${pct.toFixed(1)}%)`
    : 'Define un presupuesto para ver tu progreso.';

  // Datos para el PDF
  const mesFiltro = $('filtro-mes').value;
  $('reporte-fecha').textContent = 'Período: ' + (mesFiltro || 'Todo el historial') + ' — Generado el ' + new Date().toLocaleDateString('es-PE');
  $('reporte-presupuesto').textContent = $('texto-presupuesto').textContent;

  renderGrafico(datos.filter(t => t.tipo === 'gasto'));
  renderMensual();

  // Ahorro
  const pctAhorro = metaAhorro > 0 ? Math.min(100, (ahorrado / metaAhorro) * 100) : 0;
  $('barra-ahorro').style.width = pctAhorro + '%';
  $('texto-ahorro').textContent = metaAhorro > 0
    ? `Has ahorrado S/ ${ahorrado.toFixed(2)} de S/ ${metaAhorro.toFixed(2)} (${pctAhorro.toFixed(1)}%)`
    : 'Define una meta y registra tus aportes.';
  $('reporte-ahorro').textContent = $('texto-ahorro').textContent;
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
    leyenda.innerHTML += `<li><span class="dot" style="background:${COLORES[i % COLORES.length]}"></span>${icono(cat)} ${cat}: S/ ${val.toFixed(2)} (${(frac * 100).toFixed(1)}%)</li>`;
  });
}

function renderMensual() {
  const por = {};
  transacciones.forEach(t => {
    const m = t.fecha.slice(0, 7);
    por[m] = por[m] || { ing: 0, gas: 0 };
    if (t.tipo === 'ingreso') por[m].ing += t.monto; else por[m].gas += t.monto;
  });
  const meses = Object.keys(por).sort().slice(-6);
  const svg = $('grafico-mensual');
  if (!meses.length) { svg.innerHTML = '<text x="300" y="130" fill="#64748b" text-anchor="middle">Sin datos</text>'; return; }
  const max = Math.max(...meses.flatMap(m => [por[m].ing, por[m].gas]), 1);
  const W = 600, H = 260, base = H - 30, ancho = W / meses.length;
  let html = '';
  meses.forEach((m, i) => {
    const x = i * ancho + ancho / 2;
    const hIng = (por[m].ing / max) * 200;
    const hGas = (por[m].gas / max) * 200;
    html += `<rect x="${x - 28}" y="${base - hIng}" width="24" height="${hIng}" rx="4" fill="#4ade80"/>`;
    html += `<rect x="${x + 4}" y="${base - hGas}" width="24" height="${hGas}" rx="4" fill="#f87171"/>`;
    html += `<text x="${x}" y="${H - 10}" fill="#94a3b8" text-anchor="middle" font-size="11">${m}</text>`;
  });
  svg.innerHTML = html;
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

// Tema claro/oscuro
if (localStorage.getItem('jcho-tema') === 'claro') {
  document.body.classList.add('claro');
  $('tema-btn').textContent = '🌙 Modo oscuro';
}
$('tema-btn').addEventListener('click', () => {
  const claro = document.body.classList.toggle('claro');
  localStorage.setItem('jcho-tema', claro ? 'claro' : 'oscuro');
  $('tema-btn').textContent = claro ? '🌙 Modo oscuro' : '☀️ Modo claro';
  guardarNube();
});

render();
cargarNube();
