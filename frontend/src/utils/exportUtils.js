/**
 * Export utilities for CSV and PDF generation
 */

// Export data to CSV
export const exportToCSV = (data, filename = 'export.csv', columns = null) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Determine columns (use provided or extract from first object)
  const headers = columns || Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = getNestedValue(row, header);
        // Handle values with commas, quotes, or newlines
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
};

// Export table to CSV (extracts data from DOM table)
export const exportTableToCSV = (tableId, filename = 'table-export.csv') => {
  const table = document.getElementById(tableId) || document.querySelector('table');
  if (!table) {
    console.error('Table not found');
    return;
  }

  const rows = Array.from(table.querySelectorAll('tr'));
  const csvContent = rows.map(row => {
    const cells = Array.from(row.querySelectorAll('th, td'));
    return cells.map(cell => {
      const text = cell.textContent.trim();
      // Handle values with commas or quotes
      if (text.includes(',') || text.includes('"')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    }).join(',');
  }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
};

// Export to PDF (simple implementation using HTML canvas)
export const exportToPDF = async (elementId, filename = 'export.pdf') => {
  try {
    // This is a simplified version. For production, consider using jsPDF or similar library
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found');
      return;
    }

    // Create a printable version
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 100);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    alert('PDF export failed. Please use browser print function (Ctrl+P).');
  }
};

// Export chart data to JSON
export const exportToJSON = (data, filename = 'export.json') => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, filename);
};

// Helper function to download blob
const downloadBlob = (blob, filename) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper function to get nested object values
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
};

// Format data for export (removes unnecessary fields, formats dates, etc.)
export const formatDataForExport = (data, config = {}) => {
  const {
    excludeFields = [],
    dateFields = [],
    customFormatters = {}
  } = config;

  return data.map(item => {
    const formatted = {};
    
    Object.keys(item).forEach(key => {
      // Skip excluded fields
      if (excludeFields.includes(key)) return;
      
      let value = item[key];
      
      // Apply custom formatter if exists
      if (customFormatters[key]) {
        value = customFormatters[key](value);
      }
      // Format dates
      else if (dateFields.includes(key) && value) {
        value = new Date(value).toLocaleDateString();
      }
      // Handle nested objects
      else if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      formatted[key] = value;
    });
    
    return formatted;
  });
};

// Batch export multiple sheets to CSV (creates zip would require library)
export const exportMultipleToCSV = (datasets, baseFilename = 'export') => {
  datasets.forEach(({ data, sheetName }) => {
    const filename = `${baseFilename}-${sheetName}.csv`;
    exportToCSV(data, filename);
  });
};
