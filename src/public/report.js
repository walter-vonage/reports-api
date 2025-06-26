function sortTable(event, colIndex) {
    const table = event.target.closest('table');
    const th = event.target.closest('th');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    if (rows.length === 0) return;

    // Detect and separate the last row if it's the totals row
    const lastRow = rows[rows.length - 1];
    const isTotalRow = lastRow.classList.contains('totals');
    const dataRows = isTotalRow ? rows.slice(0, -1) : rows;

    const isAsc = th.getAttribute('data-sorted') !== 'asc';

    // Clear sort indicators from all headers
    table.querySelectorAll('th').forEach(th => {
        th.setAttribute('data-sorted', '');
        const arrow = th.querySelector('.sort-arrow');
        if (arrow) arrow.textContent = '↓';
    });

    // Set sort state and arrow
    th.setAttribute('data-sorted', isAsc ? 'asc' : 'desc');
    const currentArrow = th.querySelector('.sort-arrow');
    if (currentArrow) currentArrow.textContent = isAsc ? '↑' : '↓';

    dataRows.sort((a, b) => {
        const aText = a.children[colIndex]?.innerText.trim() || '';
        const bText = b.children[colIndex]?.innerText.trim() || '';

        const aNum = parseFloat(aText.replace(/,/g, ''));
        const bNum = parseFloat(bText.replace(/,/g, ''));

        const bothAreNumbers = !isNaN(aNum) && !isNaN(bNum);

        if (bothAreNumbers) {
            return isAsc ? aNum - bNum : bNum - aNum;
        } else {
            return isAsc
                ? aText.localeCompare(bText, undefined, { numeric: true })
                : bText.localeCompare(aText, undefined, { numeric: true });
        }
    });

    // Clear table and append sorted + totals row
    tbody.innerHTML = '';
    dataRows.forEach(row => tbody.appendChild(row));
    if (isTotalRow) tbody.appendChild(lastRow);
}