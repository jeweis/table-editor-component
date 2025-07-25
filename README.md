# Advanced Table Editor Component

A comprehensive table editing component built with Vue 3, TypeScript, and Element Plus, inspired by ag-grid functionality. This component provides enterprise-level data grid capabilities with inline editing, validation, and data management features.

## Features

- ✅ **Cell Editing**: Click-to-edit individual cells with various input types (text, number, select, date, boolean)
- ✅ **Row Operations**: Add, delete, and bulk edit table rows with validation
- ✅ **Data Validation**: Real-time field validation with error highlighting and messages
- ✅ **Sorting & Filtering**: Multi-column sorting and advanced filtering options
- ✅ **Copy & Paste**: Keyboard shortcuts (Ctrl+C/Ctrl+V) for data manipulation
- ✅ **Data Export**: Export table data to CSV/Excel formats
- ✅ **Responsive Design**: Adapts to different screen sizes
- ✅ **TypeScript Support**: Full type safety and IntelliSense support

## Demo

A working demo is available in the `test.html` file. Open it in your browser to see all features in action.

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd table-editor-component

# Install dependencies
npm install

# Start development server
npm run dev
```

## Quick Start

### Basic Usage

```vue
<template>
  <AdvancedTableEditor
    :config="tableConfig"
    @update:data="handleDataUpdate"
    @cell-edit="handleCellEdit"
    @row-add="handleRowAdd"
    @row-delete="handleRowDelete"
    @data-export="handleDataExport"
  />
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import AdvancedTableEditor from './components/AdvancedTableEditor.vue'
import type { TableConfig, TableRow, CellEditEvent } from './types/table'

const tableConfig = reactive<TableConfig>({
  columns: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      width: 120,
      sortable: true,
      editable: true,
      required: true,
      validator: (value: string) => {
        if (!value || value.trim().length === 0) {
          return 'Name is required'
        }
        return true
      }
    },
    {
      key: 'age',
      label: 'Age',
      type: 'number',
      width: 100,
      sortable: true,
      editable: true,
      required: true,
      validator: (value: number) => {
        if (!value) return 'Age is required'
        if (value < 18 || value > 65) return 'Age must be between 18-65'
        return true
      }
    },
    {
      key: 'department',
      label: 'Department',
      type: 'select',
      width: 120,
      sortable: true,
      filterable: true,
      editable: true,
      required: true,
      options: [
        { label: 'IT Department', value: 'IT' },
        { label: 'Design Department', value: 'Design' },
        { label: 'Marketing Department', value: 'Marketing' },
        { label: 'HR Department', value: 'HR' }
      ]
    }
  ],
  data: [
    {
      id: 1,
      name: 'John Doe',
      age: 28,
      department: 'IT'
    }
  ],
  editable: true,
  sortable: true,
  filterable: true,
  selectable: true,
  pagination: true,
  pageSize: 10,
  showToolbar: true,
  allowAdd: true,
  allowDelete: true,
  allowExport: true,
  allowCopyPaste: true
})

const handleDataUpdate = (data: TableRow[]) => {
  console.log('Data updated:', data)
}

const handleCellEdit = (event: CellEditEvent) => {
  console.log('Cell edited:', event)
}

const handleRowAdd = (row: TableRow) => {
  console.log('Row added:', row)
}

const handleRowDelete = (rows: TableRow[]) => {
  console.log('Rows deleted:', rows)
}

const handleDataExport = (data: TableRow[]) => {
  console.log('Export data:', data)
}
</script>
```

## Configuration

### TableConfig Interface

```typescript
interface TableConfig {
  columns: TableColumn[]           // Column definitions
  data: TableRow[]                // Table data
  editable?: boolean              // Enable editing
  sortable?: boolean              // Enable sorting
  filterable?: boolean            // Enable filtering
  selectable?: boolean            // Enable row selection
  pagination?: boolean            // Enable pagination
  pageSize?: number              // Rows per page
  showToolbar?: boolean          // Show toolbar
  allowAdd?: boolean             // Allow adding rows
  allowDelete?: boolean          // Allow deleting rows
  allowExport?: boolean          // Allow data export
  allowCopyPaste?: boolean       // Allow copy/paste
}
```

### TableColumn Interface

```typescript
interface TableColumn {
  key: string                     // Column key (must match data property)
  label: string                   // Column display name
  type: 'text' | 'number' | 'select' | 'date' | 'boolean'
  width?: number                  // Column width in pixels
  sortable?: boolean             // Enable sorting for this column
  filterable?: boolean           // Enable filtering for this column
  editable?: boolean             // Enable editing for this column
  required?: boolean             // Mark as required field
  options?: Array<{              // Options for select type
    label: string
    value: any
  }>
  validator?: (value: any) => boolean | string  // Custom validator
}
```

### TableRow Interface

```typescript
interface TableRow {
  id: string | number            // Unique identifier
  [key: string]: any            // Dynamic properties based on columns
  _editing?: boolean            // Internal editing state
  _errors?: Record<string, string>  // Internal validation errors
  _isNew?: boolean              // Internal new row flag
}
```

## Column Types

### Text Column
```typescript
{
  key: 'name',
  label: 'Name',
  type: 'text',
  editable: true,
  required: true,
  validator: (value: string) => {
    return value.length >= 2 ? true : 'Name must be at least 2 characters'
  }
}
```

### Number Column
```typescript
{
  key: 'age',
  label: 'Age',
  type: 'number',
  editable: true,
  validator: (value: number) => {
    return value >= 0 && value <= 120 ? true : 'Invalid age'
  }
}
```

### Select Column
```typescript
{
  key: 'status',
  label: 'Status',
  type: 'select',
  editable: true,
  filterable: true,
  options: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Pending', value: 'pending' }
  ]
}
```

### Date Column
```typescript
{
  key: 'joinDate',
  label: 'Join Date',
  type: 'date',
  editable: true,
  sortable: true
}
```

### Boolean Column
```typescript
{
  key: 'isActive',
  label: 'Active',
  type: 'boolean',
  editable: true,
  filterable: true
}
```

## Events

### @update:data
Emitted when table data is updated.
```typescript
(data: TableRow[]) => void
```

### @cell-edit
Emitted when a cell is edited.
```typescript
(event: CellEditEvent) => void

interface CellEditEvent {
  row: TableRow
  column: TableColumn
  value: any
  oldValue: any
}
```

### @row-add
Emitted when a new row is added.
```typescript
(row: TableRow) => void
```

### @row-delete
Emitted when rows are deleted.
```typescript
(rows: TableRow[]) => void
```

### @data-export
Emitted when data export is triggered.
```typescript
(data: TableRow[]) => void
```

## Advanced Features

### Data Validation

The component supports both built-in and custom validation:

```typescript
// Built-in validation
{
  key: 'email',
  label: 'Email',
  type: 'text',
  required: true,  // Built-in required validation
}

// Custom validation
{
  key: 'email',
  label: 'Email',
  type: 'text',
  validator: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? true : 'Invalid email format'
  }
}
```

### Copy & Paste

The component supports keyboard shortcuts for copy and paste operations:

- **Ctrl+C**: Copy selected cells
- **Ctrl+V**: Paste data to selected cells

Data is automatically converted based on column types during paste operations.

### Data Export

Export functionality supports multiple formats:

```typescript
// The component will show a dialog to choose format
// - Excel (.xlsx)
// - CSV (.csv)
// - JSON (.json)

// You can also use the composable directly
import { useDataExport } from './composables/useDataExport'

const { exportToCSV, exportToExcel, exportToJSON } = useDataExport()

// Export to specific format
exportToCSV(data, columns, 'my-data.csv')
exportToExcel(data, columns, 'my-data.xlsx')
exportToJSON(data, columns, 'my-data.json')
```

### Sorting and Filtering

```typescript
// Enable sorting for specific columns
{
  key: 'name',
  label: 'Name',
  type: 'text',
  sortable: true  // Click column header to sort
}

// Enable filtering for specific columns
{
  key: 'department',
  label: 'Department',
  type: 'select',
  filterable: true,  // Show filter dropdown in header
  options: [
    { label: 'IT', value: 'it' },
    { label: 'HR', value: 'hr' }
  ]
}
```

## Styling

The component uses Element Plus design system and can be customized with CSS variables:

```css
/* Custom styling */
.advanced-table-editor {
  --primary-color: #409eff;
  --success-color: #67c23a;
  --danger-color: #f56c6c;
  --warning-color: #e6a23c;
}

/* Cell selection styling */
.cell-selected {
  background-color: #e6f7ff !important;
  border: 2px solid #1890ff !important;
}
```

## Browser Support

- Chrome >= 88
- Firefox >= 85
- Safari >= 14
- Edge >= 88

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [ag-grid](https://github.com/ag-grid/ag-grid)
- Built with [Vue 3](https://vuejs.org/)
- UI components from [Element Plus](https://element-plus.org/)
- Icons from [Element Plus Icons](https://element-plus.org/en-US/component/icon.html)