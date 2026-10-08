/* Table — tablas en el artículo de las noticias (y donde haga falta).
   Primera fila = cabecera (variante `no-header`: sin cabecera). Con 2 columnas o más, la
   primera celda de cada fila es la cabecera de esa fila (th scope="row": Nivel, Paquete…).
   Celdas vacías u omitidas: se rellenan para que todas las filas tengan las mismas columnas.
   En móvil, scroll horizontal. */

export default function decorate(block) {
  const rows = [...block.children];
  const columns = Math.max(0, ...rows.map((row) => row.children.length));
  const hasHeader = !block.classList.contains('no-header') && rows.length > 1;

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  rows.forEach((row, i) => {
    const header = hasHeader && i === 0;
    const tr = document.createElement('tr');
    const cells = [...row.children];
    for (let c = 0; c < columns; c += 1) {
      const rowHeader = !header && c === 0 && columns > 1;
      const cell = document.createElement(header || rowHeader ? 'th' : 'td');
      if (header) cell.scope = 'col';
      if (rowHeader) cell.scope = 'row';
      if (cells[c]) cell.append(...cells[c].childNodes);
      tr.append(cell);
    }
    (header ? thead : tbody).append(tr);
  });
  if (thead.children.length) table.append(thead);
  table.append(tbody);

  // Contenedor con scroll: enfocable para desplazarlo con el teclado
  const scroller = document.createElement('div');
  scroller.className = 'table__scroll';
  scroller.tabIndex = 0;
  scroller.append(table);
  block.replaceChildren(scroller);
}
