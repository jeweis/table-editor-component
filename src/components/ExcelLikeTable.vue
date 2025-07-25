<template>
  <div class="excel-table-container" @contextmenu.prevent>
    <!-- Context Menu -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="context-menu-item" @click="insertRowAbove">
        <el-icon><Plus /></el-icon>
        <span>在上方插入行</span>
      </div>
      <div class="context-menu-item" @click="insertRowBelow">
        <el-icon><Plus /></el-icon>
        <span>在下方插入行</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="copySelection">
        <el-icon><CopyDocument /></el-icon>
        <span>复制</span>
        <span class="shortcut">Ctrl+C</span>
      </div>
      <div class="context-menu-item" @click="pasteSelection">
        <el-icon><Document /></el-icon>
        <span>粘贴</span>
        <span class="shortcut">Ctrl+V</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item danger" @click="deleteSelectedRows">
        <el-icon><Delete /></el-icon>
        <span>删除行</span>
      </div>
    </div>

    <!-- Excel-like Table -->
    <div class="excel-table" @click="hideContextMenu">
      <!-- Column Headers -->
      <div class="table-header">
        <div class="row-header-cell"></div>
        <div
          v-for="(column, colIndex) in config.columns"
          :key="column.key"
          class="column-header"
          :style="{ width: column.width + 'px' }"
          @click="selectColumn(colIndex)"
        >
          <span>{{ column.label }}</span>
          <div class="column-resizer" @mousedown="startColumnResize(colIndex, $event)"></div>
        </div>
      </div>

      <!-- Table Body -->
      <div class="table-body">
        <div
          v-for="(row, rowIndex) in tableData"
          :key="row.id"
          class="table-row"
          :class="{ 'row-selected': isRowSelected(rowIndex) }"
        >
          <!-- Row Header -->
          <div
            class="row-header"
            @click="selectRow(rowIndex)"
          >
            {{ rowIndex + 1 }}
          </div>

          <!-- Data Cells -->
          <div
            v-for="(column, colIndex) in config.columns"
            :key="column.key"
            class="table-cell"
            :class="{
              'cell-selected': isCellSelected(rowIndex, colIndex),
              'cell-editing': editingCell.row === rowIndex && editingCell.col === colIndex,
              'cell-error': hasError(row, column.key)
            }"
            :style="{ width: column.width + 'px' }"
            @click="selectCell(rowIndex, colIndex)"
            @dblclick="startEdit(rowIndex, colIndex)"
            @contextmenu="showContextMenu($event, rowIndex, colIndex)"
            @mousedown="startCellDrag(rowIndex, colIndex, $event)"
            @mouseover="handleCellHover(rowIndex, colIndex)"
          >
            <!-- Cell Content -->
            <div v-if="editingCell.row === rowIndex && editingCell.col === colIndex" class="cell-editor">
              <input
                v-if="column.type === 'text' || column.type === 'number'"
                ref="cellInput"
                v-model="editingValue"
                :type="column.type === 'number' ? 'number' : 'text'"
                class="cell-input"
                @blur="finishEdit"
                @keydown.enter="finishEdit"
                @keydown.esc="cancelEdit"
              />
              <select
                v-else-if="column.type === 'select'"
                ref="cellInput"
                v-model="editingValue"
                class="cell-select"
                @blur="finishEdit"
                @change="finishEdit"
              >
                <option v-for="option in column.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <input
                v-else-if="column.type === 'date'"
                ref="cellInput"
                v-model="editingValue"
                type="date"
                class="cell-input"
                @blur="finishEdit"
                @change="finishEdit"
              />
            </div>
            <div v-else class="cell-display">
              <span v-if="column.type === 'boolean'">
                {{ row[column.key] ? '✓' : '' }}
              </span>
              <span v-else-if="column.type === 'select'">
                {{ getSelectLabel(column, row[column.key]) }}
              </span>
              <span v-else>
                {{ formatCellValue(row[column.key], column.type) }}
              </span>
            </div>

            <!-- Drag Handle -->
            <div
              v-if="isCellSelected(rowIndex, colIndex)"
              class="drag-handle"
              @mousedown="startFillDrag(rowIndex, colIndex, $event)"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selection Overlay -->
    <div
      v-if="selection.visible"
      class="selection-overlay"
      :style="selectionStyle"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, CopyDocument, Document, Delete } from '@element-plus/icons-vue'
import type { TableConfig, TableRow, TableColumn, CellEditEvent } from '../types/table'

interface Props {
  config: TableConfig
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:data': [data: TableRow[]]
  'cell-edit': [event: CellEditEvent]
  'row-add': [row: TableRow]
  'row-delete': [rows: TableRow[]]
}>()

// Refs
const cellInput = ref()

// Reactive state
const selectedCells = reactive(new Set<string>())
const selectedRows = reactive(new Set<number>())
const selectedColumns = reactive(new Set<number>())

const editingCell = reactive({ row: -1, col: -1 })
const editingValue = ref('')

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  row: -1,
  col: -1
})

const selection = reactive({
  visible: false,
  startRow: -1,
  startCol: -1,
  endRow: -1,
  endCol: -1
})

const dragState = reactive({
  isDragging: false,
  startRow: -1,
  startCol: -1,
  currentRow: -1,
  currentCol: -1
})

// Computed
const tableData = computed(() => props.config.data)

const selectionStyle = computed(() => {
  if (!selection.visible) return {}
  
  const startRow = Math.min(selection.startRow, selection.endRow)
  const endRow = Math.max(selection.startRow, selection.endRow)
  const startCol = Math.min(selection.startCol, selection.endCol)
  const endCol = Math.max(selection.startCol, selection.endCol)
  
  const cellWidth = props.config.columns[0]?.width || 100
  const cellHeight = 32
  const headerHeight = 40
  const rowHeaderWidth = 50
  
  return {
    left: rowHeaderWidth + startCol * cellWidth + 'px',
    top: headerHeight + startRow * cellHeight + 'px',
    width: (endCol - startCol + 1) * cellWidth + 'px',
    height: (endRow - startRow + 1) * cellHeight + 'px'
  }
})

// Methods
const getCellKey = (row: number, col: number) => `${row}-${col}`

const isCellSelected = (row: number, col: number) => {
  return selectedCells.has(getCellKey(row, col))
}

const isRowSelected = (row: number) => {
  return selectedRows.has(row)
}

const selectCell = (row: number, col: number, extend = false) => {
  if (!extend) {
    selectedCells.clear()
    selectedRows.clear()
    selectedColumns.clear()
  }
  
  selectedCells.add(getCellKey(row, col))
  
  if (extend && selection.startRow !== -1) {
    // Extend selection
    selection.endRow = row
    selection.endCol = col
    selection.visible = true
    
    // Add all cells in range to selection
    const startRow = Math.min(selection.startRow, selection.endRow)
    const endRow = Math.max(selection.startRow, selection.endRow)
    const startCol = Math.min(selection.startCol, selection.endCol)
    const endCol = Math.max(selection.startCol, selection.endCol)
    
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        selectedCells.add(getCellKey(r, c))
      }
    }
  } else {
    // Start new selection
    selection.startRow = row
    selection.startCol = col
    selection.endRow = row
    selection.endCol = col
    selection.visible = false
  }
}

const selectRow = (row: number) => {
  selectedCells.clear()
  selectedColumns.clear()
  selectedRows.clear()
  selectedRows.add(row)
  
  // Select all cells in the row
  props.config.columns.forEach((_, colIndex) => {
    selectedCells.add(getCellKey(row, colIndex))
  })
}

const selectColumn = (col: number) => {
  selectedCells.clear()
  selectedRows.clear()
  selectedColumns.clear()
  selectedColumns.add(col)
  
  // Select all cells in the column
  tableData.value.forEach((_, rowIndex) => {
    selectedCells.add(getCellKey(rowIndex, col))
  })
}

const startEdit = (row: number, col: number) => {
  const column = props.config.columns[col]
  if (!column.editable) return
  
  editingCell.row = row
  editingCell.col = col
  editingValue.value = tableData.value[row][column.key]
  
  nextTick(() => {
    if (cellInput.value) {
      cellInput.value.focus()
      if (cellInput.value.select) {
        cellInput.value.select()
      }
    }
  })
}

const finishEdit = () => {
  if (editingCell.row === -1 || editingCell.col === -1) return
  
  const row = tableData.value[editingCell.row]
  const column = props.config.columns[editingCell.col]
  const oldValue = row[column.key]
  
  // Validate
  if (column.validator) {
    const result = column.validator(editingValue.value)
    if (result !== true) {
      ElMessage.error(typeof result === 'string' ? result : '验证失败')
      return
    }
  }
  
  // Update value
  row[column.key] = editingValue.value
  
  // Emit events
  const event: CellEditEvent = {
    row,
    column,
    value: editingValue.value,
    oldValue
  }
  emit('cell-edit', event)
  emit('update:data', props.config.data)
  
  // Clear editing state
  editingCell.row = -1
  editingCell.col = -1
  editingValue.value = ''
}

const cancelEdit = () => {
  editingCell.row = -1
  editingCell.col = -1
  editingValue.value = ''
}

const showContextMenu = (event: MouseEvent, row: number, col: number) => {
  event.preventDefault()
  contextMenu.visible = true
  contextMenu.x = event.clientX
  contextMenu.y = event.clientY
  contextMenu.row = row
  contextMenu.col = col
  
  selectCell(row, col)
}

const hideContextMenu = () => {
  contextMenu.visible = false
}

const insertRowAbove = () => {
  const newRow: TableRow = {
    id: Date.now(),
    _isNew: true
  }
  
  props.config.columns.forEach(column => {
    newRow[column.key] = column.type === 'boolean' ? false : ''
  })
  
  props.config.data.splice(contextMenu.row, 0, newRow)
  emit('row-add', newRow)
  emit('update:data', props.config.data)
  hideContextMenu()
}

const insertRowBelow = () => {
  const newRow: TableRow = {
    id: Date.now(),
    _isNew: true
  }
  
  props.config.columns.forEach(column => {
    newRow[column.key] = column.type === 'boolean' ? false : ''
  })
  
  props.config.data.splice(contextMenu.row + 1, 0, newRow)
  emit('row-add', newRow)
  emit('update:data', props.config.data)
  hideContextMenu()
}

const deleteSelectedRows = () => {
  const rowsToDelete = Array.from(selectedRows).sort((a, b) => b - a)
  const deletedRows: TableRow[] = []
  
  rowsToDelete.forEach(rowIndex => {
    const row = props.config.data[rowIndex]
    if (row) {
      deletedRows.push(row)
      props.config.data.splice(rowIndex, 1)
    }
  })
  
  if (deletedRows.length > 0) {
    emit('row-delete', deletedRows)
    emit('update:data', props.config.data)
    selectedRows.clear()
    selectedCells.clear()
  }
  
  hideContextMenu()
}

const copySelection = async () => {
  const selectedCellsArray = Array.from(selectedCells)
  if (selectedCellsArray.length === 0) return
  
  const copyData: string[][] = []
  const cellMap = new Map<number, Map<number, string>>()
  
  // Organize selected cells by row and column
  selectedCellsArray.forEach(cellKey => {
    const [row, col] = cellKey.split('-').map(Number)
    if (!cellMap.has(row)) {
      cellMap.set(row, new Map())
    }
    
    const column = props.config.columns[col]
    const value = tableData.value[row][column.key]
    let displayValue = ''
    
    if (value !== null && value !== undefined) {
      if (column.type === 'boolean') {
        displayValue = value ? '是' : '否'
      } else if (column.type === 'select') {
        const option = column.options?.find(opt => opt.value === value)
        displayValue = option ? option.label : String(value)
      } else {
        displayValue = String(value)
      }
    }
    
    cellMap.get(row)!.set(col, displayValue)
  })
  
  // Convert to 2D array
  const rows = Array.from(cellMap.keys()).sort((a, b) => a - b)
  rows.forEach(row => {
    const cols = Array.from(cellMap.get(row)!.keys()).sort((a, b) => a - b)
    const rowData = cols.map(col => cellMap.get(row)!.get(col) || '')
    copyData.push(rowData)
  })
  
  // Copy to clipboard
  try {
    const clipboardText = copyData.map(row => row.join('\t')).join('\n')
    await navigator.clipboard.writeText(clipboardText)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
  
  hideContextMenu()
}

const pasteSelection = async () => {
  try {
    const clipboardText = await navigator.clipboard.readText()
    const pasteData = clipboardText.split('\n').map(row => row.split('\t'))
    
    if (pasteData.length === 0) return
    
    const startRow = contextMenu.row
    const startCol = contextMenu.col
    
    pasteData.forEach((rowData, rowOffset) => {
      const targetRowIndex = startRow + rowOffset
      if (targetRowIndex >= tableData.value.length) return
      
      const targetRow = tableData.value[targetRowIndex]
      
      rowData.forEach((cellValue, colOffset) => {
        const targetColIndex = startCol + colOffset
        if (targetColIndex >= props.config.columns.length) return
        
        const targetColumn = props.config.columns[targetColIndex]
        if (!targetColumn.editable) return
        
        // Convert value based on column type
        let convertedValue: any = cellValue
        
        switch (targetColumn.type) {
          case 'number':
            convertedValue = cellValue === '' ? null : Number(cellValue)
            break
          case 'boolean':
            convertedValue = cellValue === '是' || cellValue === 'true'
            break
          case 'select':
            const option = targetColumn.options?.find(opt => 
              opt.label === cellValue || opt.value === cellValue
            )
            if (option) {
              convertedValue = option.value
            }
            break
        }
        
        targetRow[targetColumn.key] = convertedValue
      })
    })
    
    emit('update:data', props.config.data)
    ElMessage.success('粘贴成功')
  } catch (error) {
    ElMessage.error('粘贴失败')
  }
  
  hideContextMenu()
}

const startColumnResize = (colIndex: number, event: MouseEvent) => {
  event.preventDefault()
  const startX = event.clientX
  const startWidth = props.config.columns[colIndex].width || 100
  
  const handleMouseMove = (e: MouseEvent) => {
    const diff = e.clientX - startX
    const newWidth = Math.max(50, startWidth + diff)
    props.config.columns[colIndex].width = newWidth
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const startCellDrag = (row: number, col: number, event: MouseEvent) => {
  if (event.shiftKey) {
    selectCell(row, col, true)
  } else {
    selectCell(row, col)
  }
}

const startFillDrag = (row: number, col: number, event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  dragState.isDragging = true
  dragState.startRow = row
  dragState.startCol = col
  dragState.currentRow = row
  dragState.currentCol = col
  
  const handleMouseMove = (e: MouseEvent) => {
    // Handle fill drag logic here
  }
  
  const handleMouseUp = () => {
    dragState.isDragging = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleCellHover = (row: number, col: number) => {
  if (dragState.isDragging) {
    dragState.currentRow = row
    dragState.currentCol = col
  }
}

const getSelectLabel = (column: TableColumn, value: any) => {
  const option = column.options?.find(opt => opt.value === value)
  return option ? option.label : value
}

const formatCellValue = (value: any, type: string) => {
  if (value === null || value === undefined || value === '') return ''
  
  switch (type) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : value
    case 'date':
      return value
    default:
      return String(value)
  }
}

const hasError = (row: TableRow, key: string) => {
  return row._errors && row._errors[key]
}

// Keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    if (event.key === 'c' || event.key === 'C') {
      event.preventDefault()
      copySelection()
    } else if (event.key === 'v' || event.key === 'V') {
      event.preventDefault()
      pasteSelection()
    }
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('click', hideContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('click', hideContextMenu)
})
</script>

<style scoped>
.excel-table-container {
  position: relative;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 12px;
  background: #ffffff;
  border: 1px solid #d0d7de;
  user-select: none;
}

.excel-table {
  overflow: auto;
  max-height: 600px;
}

.table-header {
  display: flex;
  background: #f6f8fa;
  border-bottom: 1px solid #d0d7de;
  position: sticky;
  top: 0;
  z-index: 10;
}

.row-header-cell {
  width: 50px;
  height: 32px;
  background: #f6f8fa;
  border-right: 1px solid #d0d7de;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #656d76;
}

.column-header {
  position: relative;
  height: 32px;
  background: #f6f8fa;
  border-right: 1px solid #d0d7de;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #1f2328;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.column-header:hover {
  background: #eaeef2;
}

.column-resizer {
  position: absolute;
  right: 0;
  top: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
}

.column-resizer:hover {
  background: #0969da;
}

.table-body {
  background: #ffffff;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #d0d7de;
}

.table-row:hover {
  background: #f6f8fa;
}

.row-selected {
  background: #dbeafe !important;
}

.row-header {
  width: 50px;
  height: 32px;
  background: #f6f8fa;
  border-right: 1px solid #d0d7de;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #656d76;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.row-header:hover {
  background: #eaeef2;
}

.table-cell {
  position: relative;
  height: 32px;
  border-right: 1px solid #d0d7de;
  display: flex;
  align-items: center;
  padding: 0 8px;
  cursor: cell;
  transition: all 0.1s ease;
  background: #ffffff;
}

.table-cell:hover {
  background: #f6f8fa;
}

.cell-selected {
  background: #dbeafe !important;
  border: 2px solid #0969da !important;
  z-index: 5;
}

.cell-editing {
  background: #ffffff !important;
  border: 2px solid #0969da !important;
  z-index: 10;
}

.cell-error {
  background: #ffeaea !important;
  border-color: #da3633 !important;
}

.cell-display {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-editor {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.cell-input,
.cell-select {
  width: 100%;
  height: 28px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 12px;
  font-family: inherit;
}

.drag-handle {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 6px;
  height: 6px;
  background: #0969da;
  cursor: crosshair;
  border: 1px solid #ffffff;
}

.selection-overlay {
  position: absolute;
  border: 2px solid #0969da;
  background: rgba(9, 105, 218, 0.1);
  pointer-events: none;
  z-index: 3;
}

.context-menu {
  position: fixed;
  background: #ffffff;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(140, 149, 159, 0.2);
  z-index: 1000;
  min-width: 180px;
  padding: 4px 0;
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  color: #1f2328;
  transition: background-color 0.1s ease;
}

.context-menu-item:hover {
  background: #f6f8fa;
}

.context-menu-item.danger {
  color: #da3633;
}

.context-menu-item.danger:hover {
  background: #ffeaea;
}

.context-menu-item .el-icon {
  margin-right: 8px;
  font-size: 14px;
}

.context-menu-item .shortcut {
  margin-left: auto;
  color: #656d76;
  font-size: 11px;
}

.context-menu-divider {
  height: 1px;
  background: #d0d7de;
  margin: 4px 0;
}
</style>