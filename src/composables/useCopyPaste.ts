import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import type { TableRow, TableColumn, CopyPasteData } from '../types/table'

export function useCopyPaste() {
  const selectedCells = ref<Array<{ row: number; col: number }>>([])
  const copiedData = ref<CopyPasteData | null>(null)
  const isSelecting = ref(false)
  const selectionStart = ref<{ row: number; col: number } | null>(null)
  const selectionEnd = ref<{ row: number; col: number } | null>(null)

  // Parse clipboard data
  const parseClipboardData = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim() !== '')
    return lines.map(line => {
      // Handle both tab and comma separated values
      if (line.includes('\t')) {
        return line.split('\t')
      } else if (line.includes(',')) {
        // Simple CSV parsing (doesn't handle quoted commas)
        return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
      } else {
        return [line]
      }
    })
  }

  // Format data for clipboard
  const formatDataForClipboard = (data: string[][]): string => {
    return data.map(row => row.join('\t')).join('\n')
  }

  // Copy selected cells
  const copySelectedCells = async (
    tableData: TableRow[],
    columns: TableColumn[],
    selectedRows: number[],
    selectedCols: number[]
  ) => {
    if (selectedRows.length === 0 || selectedCols.length === 0) {
      ElMessage.warning('请先选择要复制的单元格')
      return
    }

    const copyData: string[][] = []
    
    selectedRows.forEach(rowIndex => {
      const row: string[] = []
      selectedCols.forEach(colIndex => {
        const column = columns[colIndex]
        const cellValue = tableData[rowIndex]?.[column.key]
        
        let displayValue = ''
        if (cellValue !== null && cellValue !== undefined) {
          switch (column.type) {
            case 'boolean':
              displayValue = cellValue ? '是' : '否'
              break
            case 'select':
              const option = column.options?.find(opt => opt.value === cellValue)
              displayValue = option ? option.label : String(cellValue)
              break
            default:
              displayValue = String(cellValue)
          }
        }
        row.push(displayValue)
      })
      copyData.push(row)
    })

    copiedData.value = {
      rows: copyData.length,
      cols: copyData[0]?.length || 0,
      data: copyData
    }

    // Copy to system clipboard
    try {
      const clipboardText = formatDataForClipboard(copyData)
      await navigator.clipboard.writeText(clipboardText)
      ElMessage.success(`已复制 ${copyData.length} 行 ${copyData[0]?.length || 0} 列数据`)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      ElMessage.error('复制失败，请检查浏览器权限')
    }
  }

  // Paste data to selected cells
  const pasteToSelectedCells = async (
    tableData: TableRow[],
    columns: TableColumn[],
    startRow: number,
    startCol: number,
    onCellUpdate: (row: TableRow, column: TableColumn, value: any) => void
  ) => {
    try {
      // Try to get data from system clipboard first
      let clipboardText = ''
      try {
        clipboardText = await navigator.clipboard.readText()
      } catch (error) {
        console.warn('Failed to read from clipboard:', error)
        if (!copiedData.value) {
          ElMessage.error('无法读取剪贴板内容')
          return
        }
      }

      let pasteData: string[][]
      if (clipboardText) {
        pasteData = parseClipboardData(clipboardText)
      } else if (copiedData.value) {
        pasteData = copiedData.value.data
      } else {
        ElMessage.error('没有可粘贴的数据')
        return
      }

      if (pasteData.length === 0) {
        ElMessage.error('粘贴数据为空')
        return
      }

      let updatedCells = 0
      let errors = 0

      // Paste data starting from the selected cell
      pasteData.forEach((rowData, rowOffset) => {
        const targetRowIndex = startRow + rowOffset
        if (targetRowIndex >= tableData.length) return

        const targetRow = tableData[targetRowIndex]
        
        rowData.forEach((cellValue, colOffset) => {
          const targetColIndex = startCol + colOffset
          if (targetColIndex >= columns.length) return

          const targetColumn = columns[targetColIndex]
          if (!targetColumn.editable) return

          try {
            // Convert value based on column type
            let convertedValue: any = cellValue

            switch (targetColumn.type) {
              case 'number':
                convertedValue = cellValue === '' ? null : Number(cellValue)
                if (cellValue !== '' && isNaN(convertedValue)) {
                  throw new Error('无效的数字格式')
                }
                break
              case 'boolean':
                convertedValue = cellValue === '是' || cellValue === 'true' || cellValue === '1'
                break
              case 'select':
                // Try to match by label first, then by value
                const option = targetColumn.options?.find(opt => 
                  opt.label === cellValue || opt.value === cellValue
                )
                if (option) {
                  convertedValue = option.value
                } else if (cellValue !== '') {
                  throw new Error('无效的选项值')
                }
                break
              case 'date':
                if (cellValue && cellValue !== '') {
                  // Try to parse date
                  const date = new Date(cellValue)
                  if (isNaN(date.getTime())) {
                    throw new Error('无效的日期格式')
                  }
                  convertedValue = cellValue
                }
                break
              default:
                convertedValue = cellValue
            }

            // Validate the value
            if (targetColumn.validator) {
              const validationResult = targetColumn.validator(convertedValue)
              if (validationResult !== true) {
                throw new Error(typeof validationResult === 'string' ? validationResult : '验证失败')
              }
            }

            // Update the cell
            onCellUpdate(targetRow, targetColumn, convertedValue)
            updatedCells++

          } catch (error) {
            console.warn(`Failed to paste cell [${targetRowIndex}, ${targetColIndex}]:`, error)
            errors++
          }
        })
      })

      if (updatedCells > 0) {
        ElMessage.success(`成功粘贴 ${updatedCells} 个单元格${errors > 0 ? `，${errors} 个单元格粘贴失败` : ''}`)
      } else {
        ElMessage.error('粘贴失败，请检查数据格式和目标单元格')
      }

    } catch (error) {
      console.error('Paste operation failed:', error)
      ElMessage.error('粘贴操作失败')
    }
  }

  // Handle keyboard shortcuts
  const handleKeyboardShortcut = async (
    event: KeyboardEvent,
    tableData: TableRow[],
    columns: TableColumn[],
    selectedRows: number[],
    selectedCols: number[],
    onCellUpdate: (row: TableRow, column: TableColumn, value: any) => void
  ) => {
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'c' || event.key === 'C') {
        event.preventDefault()
        await copySelectedCells(tableData, columns, selectedRows, selectedCols)
      } else if (event.key === 'v' || event.key === 'V') {
        event.preventDefault()
        if (selectedRows.length > 0 && selectedCols.length > 0) {
          await pasteToSelectedCells(
            tableData,
            columns,
            selectedRows[0],
            selectedCols[0],
            onCellUpdate
          )
        } else {
          ElMessage.warning('请先选择要粘贴的起始位置')
        }
      }
    }
  }

  // Select range of cells
  const selectCellRange = (
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ) => {
    selectedCells.value = []
    
    const minRow = Math.min(startRow, endRow)
    const maxRow = Math.max(startRow, endRow)
    const minCol = Math.min(startCol, startCol)
    const maxCol = Math.max(startCol, endCol)

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        selectedCells.value.push({ row, col })
      }
    }
  }

  // Clear selection
  const clearSelection = () => {
    selectedCells.value = []
    selectionStart.value = null
    selectionEnd.value = null
    isSelecting.value = false
  }

  // Check if cell is selected
  const isCellSelected = (rowIndex: number, colIndex: number): boolean => {
    return selectedCells.value.some(cell => cell.row === rowIndex && cell.col === colIndex)
  }

  return {
    selectedCells,
    copiedData,
    isSelecting,
    selectionStart,
    selectionEnd,
    copySelectedCells,
    pasteToSelectedCells,
    handleKeyboardShortcut,
    selectCellRange,
    clearSelection,
    isCellSelected
  }
}