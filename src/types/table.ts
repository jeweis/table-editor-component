export interface TableColumn {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'date' | 'boolean'
  width?: number
  sortable?: boolean
  filterable?: boolean
  editable?: boolean
  required?: boolean
  options?: Array<{ label: string; value: any }>
  validator?: (value: any) => boolean | string
}

export interface TableRow {
  id: string | number
  [key: string]: any
  _editing?: boolean
  _errors?: Record<string, string>
  _isNew?: boolean
}

export interface TableConfig {
  columns: TableColumn[]
  data: TableRow[]
  editable?: boolean
  sortable?: boolean
  filterable?: boolean
  selectable?: boolean
  pagination?: boolean
  pageSize?: number
  showToolbar?: boolean
  allowAdd?: boolean
  allowDelete?: boolean
  allowExport?: boolean
  allowCopyPaste?: boolean
}

export interface CellEditEvent {
  row: TableRow
  column: TableColumn
  value: any
  oldValue: any
}

export interface ValidationError {
  rowId: string | number
  field: string
  message: string
}

export interface CopyPasteData {
  rows: number
  cols: number
  data: string[][]
}