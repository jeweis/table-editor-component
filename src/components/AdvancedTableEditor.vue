<template>
  <div class="advanced-table-editor">
    <!-- Toolbar -->
    <div v-if="config.showToolbar" class="table-toolbar">
      <div class="toolbar-left">
        <el-button
          v-if="config.allowAdd"
          type="primary"
          :icon="Plus"
          @click="addRow"
        >
          添加行
        </el-button>
        <el-button
          v-if="config.allowDelete && selectedRows.length > 0"
          type="danger"
          :icon="Delete"
          @click="deleteSelectedRows"
        >
          删除选中 ({{ selectedRows.length }})
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-button
          v-if="config.allowExport"
          :icon="Download"
          @click="exportData"
        >
          导出
        </el-button>
      </div>
    </div>

    <!-- Table -->
    <el-table
      ref="tableRef"
      :data="tableData"
      :border="true"
      :stripe="true"
      :highlight-current-row="true"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      class="advanced-table"
    >
      <!-- Selection column -->
      <el-table-column
        v-if="config.selectable"
        type="selection"
        width="55"
        fixed="left"
      />

      <!-- Data columns -->
      <el-table-column
        v-for="column in config.columns"
        :key="column.key"
        :prop="column.key"
        :label="column.label"
        :width="column.width"
        :sortable="column.sortable ? 'custom' : false"
        :show-overflow-tooltip="true"
      >
        <template #header="{ column: headerColumn }">
          <div class="column-header">
            <span>{{ headerColumn.label }}</span>
            <el-dropdown
              v-if="getColumnConfig(headerColumn.property)?.filterable"
              trigger="click"
              @command="(value) => handleFilter(headerColumn.property, value)"
            >
              <el-icon class="filter-icon">
                <Filter />
              </el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="">全部</el-dropdown-item>
                  <el-dropdown-item
                    v-for="option in getFilterOptions(headerColumn.property)"
                    :key="option.value"
                    :command="option.value"
                  >
                    {{ option.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>

        <template #default="{ row, column: tableColumn, $index }">
          <div
            :class="{
              'cell-wrapper': true,
              'cell-selected': isCellHighlighted($index, getColumnIndex(tableColumn.property))
            }"
            @click="handleCellClick($index, getColumnIndex(tableColumn.property), $event)"
          >
            <EditableCell
              :row="row"
              :column="getColumnConfig(tableColumn.property)!"
              :value="row[tableColumn.property]"
              :editing="row._editing"
              @update:value="handleCellUpdate"
              @start-edit="handleStartEdit"
              @end-edit="handleEndEdit"
            />
          </div>
        </template>
      </el-table-column>

      <!-- Actions column -->
      <el-table-column
        label="操作"
        width="120"
        fixed="right"
      >
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button
              v-if="!row._editing"
              type="primary"
              size="small"
              :icon="Edit"
              @click="startRowEdit(row)"
            />
            <template v-else>
              <el-button
                type="success"
                size="small"
                :icon="Check"
                @click="saveRow(row)"
              />
              <el-button
                type="info"
                size="small"
                :icon="Close"
                @click="cancelRowEdit(row)"
              />
            </template>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="deleteRow(row)"
            />
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <el-pagination
      v-if="config.pagination"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="totalRows"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      class="table-pagination"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Delete,
  Download,
  Filter,
  Edit,
  Check,
  Close
} from '@element-plus/icons-vue'
import type {
  TableConfig,
  TableRow,
  TableColumn,
  CellEditEvent,
  CopyPasteData
} from '../types/table'
import EditableCell from './EditableCell.vue'
import { useCopyPaste } from '../composables/useCopyPaste'
import { useDataExport } from '../composables/useDataExport'

interface Props {
  config: TableConfig
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:data': [data: TableRow[]]
  'cell-edit': [event: CellEditEvent]
  'row-add': [row: TableRow]
  'row-delete': [rows: TableRow[]]
  'data-export': [data: TableRow[]]
}>()

// Refs
const tableRef = ref()
const selectedRows = ref<TableRow[]>([])
const currentPage = ref(1)
const pageSize = ref(props.config.pageSize || 20)
const sortConfig = ref<{ prop: string; order: string } | null>(null)
const filterConfig = ref<Record<string, any>>({})

// Copy & Paste functionality
const {
  selectedCells,
  copiedData,
  handleKeyboardShortcut,
  selectCellRange,
  clearSelection,
  isCellSelected
} = useCopyPaste()

const selectedRowIndices = ref<number[]>([])
const selectedColIndices = ref<number[]>([])

// Data Export functionality
const {
  exportToCSV,
  exportToExcel,
  exportToJSON
} = useDataExport()

// Computed
const tableData = computed(() => {
  let data = [...props.config.data]
  
  // Apply filters
  Object.entries(filterConfig.value).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      data = data.filter(row => row[key] === value)
    }
  })
  
  // Apply sorting
  if (sortConfig.value) {
    const { prop, order } = sortConfig.value
    data.sort((a, b) => {
      const aVal = a[prop]
      const bVal = b[prop]
      const result = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      return order === 'ascending' ? result : -result
    })
  }
  
  // Apply pagination
  if (props.config.pagination) {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return data.slice(start, end)
  }
  
  return data
})

const totalRows = computed(() => props.config.data.length)

// Methods
const getColumnConfig = (key: string): TableColumn | undefined => {
  return props.config.columns.find(col => col.key === key)
}

const getColumnIndex = (key: string): number => {
  return props.config.columns.findIndex(col => col.key === key)
}

const getFilterOptions = (key: string) => {
  const column = getColumnConfig(key)
  if (column?.options) {
    return column.options
  }
  
  // Generate unique values for filtering
  const uniqueValues = [...new Set(props.config.data.map(row => row[key]))]
  return uniqueValues.map(value => ({ label: String(value), value }))
}

const handleSelectionChange = (selection: TableRow[]) => {
  selectedRows.value = selection
}

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortConfig.value = order ? { prop, order } : null
}

const handleFilter = (key: string, value: any) => {
  filterConfig.value[key] = value
}

const handleCellUpdate = (event: CellEditEvent) => {
  const { row, column, value } = event
  
  // Validate
  if (column.validator) {
    const result = column.validator(value)
    if (result !== true) {
      if (!row._errors) row._errors = {}
      row._errors[column.key] = typeof result === 'string' ? result : '验证失败'
      return
    } else {
      if (row._errors) {
        delete row._errors[column.key]
      }
    }
  }
  
  // Update value
  row[column.key] = value
  emit('cell-edit', event)
  emit('update:data', props.config.data)
}

const handleStartEdit = (row: TableRow) => {
  row._editing = true
}

const handleEndEdit = (row: TableRow) => {
  row._editing = false
}

const startRowEdit = (row: TableRow) => {
  row._editing = true
}

const saveRow = (row: TableRow) => {
  // Validate all fields
  const errors: Record<string, string> = {}
  
  props.config.columns.forEach(column => {
    if (column.required && !row[column.key]) {
      errors[column.key] = '此字段为必填项'
    }
    
    if (column.validator && row[column.key]) {
      const result = column.validator(row[column.key])
      if (result !== true) {
        errors[column.key] = typeof result === 'string' ? result : '验证失败'
      }
    }
  })
  
  if (Object.keys(errors).length > 0) {
    row._errors = errors
    ElMessage.error('请修正表单错误后再保存')
    return
  }
  
  row._editing = false
  row._errors = {}
  delete row._isNew
  
  emit('update:data', props.config.data)
  ElMessage.success('保存成功')
}

const cancelRowEdit = (row: TableRow) => {
  if (row._isNew) {
    const index = props.config.data.findIndex(r => r.id === row.id)
    if (index > -1) {
      props.config.data.splice(index, 1)
    }
  } else {
    row._editing = false
    row._errors = {}
  }
}

const addRow = () => {
  const newRow: TableRow = {
    id: Date.now(),
    _editing: true,
    _isNew: true
  }
  
  // Initialize with default values
  props.config.columns.forEach(column => {
    newRow[column.key] = column.type === 'boolean' ? false : ''
  })
  
  props.config.data.unshift(newRow)
  emit('row-add', newRow)
}

const deleteRow = async (row: TableRow) => {
  try {
    await ElMessageBox.confirm('确定要删除这行数据吗？', '确认删除', {
      type: 'warning'
    })
    
    const index = props.config.data.findIndex(r => r.id === row.id)
    if (index > -1) {
      props.config.data.splice(index, 1)
      emit('row-delete', [row])
      emit('update:data', props.config.data)
      ElMessage.success('删除成功')
    }
  } catch {
    // User cancelled
  }
}

const deleteSelectedRows = async () => {
  if (selectedRows.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 行数据吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    selectedRows.value.forEach(row => {
      const index = props.config.data.findIndex(r => r.id === row.id)
      if (index > -1) {
        props.config.data.splice(index, 1)
      }
    })
    
    emit('row-delete', selectedRows.value)
    emit('update:data', props.config.data)
    selectedRows.value = []
    ElMessage.success('删除成功')
  } catch {
    // User cancelled
  }
}

const exportData = () => {
  // Show export options
  ElMessageBox.confirm(
    '请选择导出格式',
    '数据导出',
    {
      distinguishCancelAndClose: true,
      confirmButtonText: 'Excel',
      cancelButtonText: 'CSV',
      type: 'info'
    }
  ).then(() => {
    // Export to Excel
    exportToExcel(props.config.data, props.config.columns)
  }).catch((action) => {
    if (action === 'cancel') {
      // Export to CSV
      exportToCSV(props.config.data, props.config.columns)
    }
  })
  
  emit('data-export', props.config.data)
}

// Copy & Paste functionality
const handleKeyDown = async (event: KeyboardEvent) => {
  if (!props.config.allowCopyPaste) return
  
  await handleKeyboardShortcut(
    event,
    tableData.value,
    props.config.columns,
    selectedRowIndices.value,
    selectedColIndices.value,
    (row, column, value) => {
      const cellEvent: CellEditEvent = {
        row,
        column,
        value,
        oldValue: row[column.key]
      }
      handleCellUpdate(cellEvent)
    }
  )
}

const handleCellClick = (rowIndex: number, colIndex: number, event: MouseEvent) => {
  if (!props.config.allowCopyPaste) return

  if (event.ctrlKey || event.metaKey) {
    // Multi-select mode
    const rowIdx = selectedRowIndices.value.indexOf(rowIndex)
    const colIdx = selectedColIndices.value.indexOf(colIndex)
    
    if (rowIdx === -1) selectedRowIndices.value.push(rowIndex)
    else selectedRowIndices.value.splice(rowIdx, 1)
    
    if (colIdx === -1) selectedColIndices.value.push(colIndex)
    else selectedColIndices.value.splice(colIdx, 1)
  } else if (event.shiftKey && selectedRowIndices.value.length > 0 && selectedColIndices.value.length > 0) {
    // Range select mode
    const startRow = selectedRowIndices.value[0]
    const startCol = selectedColIndices.value[0]
    
    const minRow = Math.min(startRow, rowIndex)
    const maxRow = Math.max(startRow, rowIndex)
    const minCol = Math.min(startCol, colIndex)
    const maxCol = Math.max(startCol, colIndex)
    
    selectedRowIndices.value = []
    selectedColIndices.value = []
    
    for (let r = minRow; r <= maxRow; r++) {
      selectedRowIndices.value.push(r)
    }
    for (let c = minCol; c <= maxCol; c++) {
      selectedColIndices.value.push(c)
    }
  } else {
    // Single select mode
    selectedRowIndices.value = [rowIndex]
    selectedColIndices.value = [colIndex]
  }
}

const isCellHighlighted = (rowIndex: number, colIndex: number): boolean => {
  return selectedRowIndices.value.includes(rowIndex) && selectedColIndices.value.includes(colIndex)
}

// Lifecycle
onMounted(() => {
  if (props.config.allowCopyPaste) {
    document.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  if (props.config.allowCopyPaste) {
    document.removeEventListener('keydown', handleKeyDown)
  }
})
</script>

<style scoped>
.advanced-table-editor {
  width: 100%;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 8px;
}

.advanced-table {
  width: 100%;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-icon {
  cursor: pointer;
  margin-left: 4px;
  opacity: 0.6;
}

.filter-icon:hover {
  opacity: 1;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.cell-wrapper {
  position: relative;
  cursor: pointer;
}

.cell-selected {
  background-color: #e6f7ff !important;
  border: 2px solid #1890ff !important;
}

.cell-selected .editable-cell {
  background-color: transparent;
}

/* Copy paste selection styles */
.advanced-table :deep(.el-table__body-wrapper) {
  user-select: none;
}

.advanced-table :deep(.el-table__row:hover .cell-wrapper) {
  background-color: #f5f7fa;
}

.advanced-table :deep(.el-table__row .cell-wrapper:hover) {
  background-color: #ecf5ff;
}
</style>
