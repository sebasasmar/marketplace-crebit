export const exportToCsv = (data: any[], filename: string): void => {
    if (!data || data.length === 0) {
        alert("No data to export.");
        return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','), // header row
        ...data.map(row => 
            headers.map(fieldName => 
                // Avoid unused param warning by naming it _key
                JSON.stringify(row[fieldName], (_key, value) => value === null ? '' : value)
            ).join(',')
        )
    ];

    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    if ((navigator as any).msSaveBlob) {
        // IE 10+
        (navigator as any).msSaveBlob(blob, filename);
    } else {
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}