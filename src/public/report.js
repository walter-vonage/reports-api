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

function downloadCSV() {
    let csv = [];
    const tables = document.querySelectorAll('table');

    tables.forEach((table, tableIndex) => {
        const rows = table.querySelectorAll('tr');
        if (tableIndex > 0) csv.push(''); // Separate tables

        rows.forEach((row, rowIndex) => {
            const cols = row.querySelectorAll('th, td');
            const rowData = Array.from(cols).map(col => {
                // Clean up arrows or extra sorting symbols
                let text = col.textContent.trim().replace(/[↑↓]/g, '').trim();
                text = text.replace(/"/g, '""'); // escape quotes
                return `"${text}"`;
            });

            // Only push rows that have some data (avoid empty rows)
            if (rowData.some(cell => cell.replace(/"/g, '').trim() !== '')) {
                csv.push(rowData.join(','));
            }
        });
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'pivot_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}