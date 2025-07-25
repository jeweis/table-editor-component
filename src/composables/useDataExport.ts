import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import type { TableRow, TableColumn } from '../types/table'

export function useDataExport() {
  
  // Export to CSV
  const exportToCSV = (data: TableRow[], columns: TableColumn[], filename = 'table-data.csv') => {
    try {
      // Create CSV headers
      const headers = columns.map(col => col.label).join(',')
      
      // Create CSV rows
      const rows = data.map(row => 
        columns.map(col => {
          let value = row[col.key]
          
          // Format value based on column type
          if (value === null || value === undefined) {
            value = ''
          } else if (col.type === 'boolean') {
            value = value ? '是' : '否'
          } else if (col.type === 'select') {
            const option = col.options?.find(opt => opt.value === value)
            value = option ? option.label : value
          }
          
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(',')
      ).join('\n')
      
      const csvContent = `${headers}\n${rows}`
      
      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      downloadFile(blob, filename)
      
      ElMessage.success('CSV文件导出成功')
    } catch (error) {
      console.error('CSV export failed:', error)
      ElMessage.error('CSV导出失败')
    }
  }

  // Export to Excel
  const exportToExcel = (data: TableRow[], columns: TableColumn[], filename = 'table-data.xlsx') => {
    try {
      // Prepare data for Excel
      const excelData = data.map(row => {
        const excelRow: any = {}
        columns.forEach(col => {
          let value = row[col.key]
          
          // Format value based on column type
          if (value === null || value === undefined) {
            value = ''
          } else if (col.type === 'boolean') {
            value = value ? '是' : '否'
          } else if (col.type === 'select') {
            const option = col.options?.find(opt => opt.value === value)
            value = option ? option.label : value
          } else if (col.type === 'date' && value) {
            // Keep date as string for better Excel compatibility
            value = String(value)
          }
          
          excelRow[col.label] = value
        })
        return excelRow
      })

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)
      
      // Set column widths
      const colWidths = columns.map(col => ({
        wch: Math.max(col.label.length, 15) // Minimum width of 15 characters
      }))
      ws['!cols'] = colWidths
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Data')
      
      // Generate Excel file and download
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      downloadFile(blob, filename)
      
      ElMessage.success('Excel文件导出成功')
    } catch (error) {
      console.error('Excel export failed:', error)
      ElMessage.error('Excel导出失败')
    }
  }

  // Export to JSON
  const exportToJSON = (data: TableRow[], columns: TableColumn[], filename = 'table-data.json') => {
    try {
      // Clean data for JSON export
      const jsonData = data.map(row => {
        const cleanRow: any = {}
        columns.forEach(col => {
          cleanRow[col.key] = row[col.key]
        })
        return cleanRow
      })
      
      const jsonString = JSON.stringify(jsonData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
      downloadFile(blob, filename)
      
      ElMessage.success('JSON文件导出成功')
    } catch (error) {
      console.error('JSON export failed:', error)
      ElMessage.error('JSON导出失败')
    }
  }

  // Helper function to download file
  const downloadFile = (blob: Blob, filename: string) => {
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Import from Excel
  const importFromExcel = (file: File, columns: TableColumn[]): Promise<TableRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          // Convert imported data to table format
          const importedRows: TableRow[] = jsonData.map((row: any, index) => {
            const tableRow: TableRow = {
              id: Date.now() + index,
              _isNew: true
            }
            
            columns.forEach(col => {
              const value = row[col.label]
              
              if (value !== undefined && value !== null && value !== '') {
                // Convert value based on column type
                switch (col.type) {
                  case 'number':
                    tableRow[col.key] = Number(value)
                    break
                  case 'boolean':
                    tableRow[col.key] = value === '是' || value === 'true' || value === true
                    break
                  case 'select':
                    // Try to match by label first, then by value
                    const option = col.options?.find(opt => 
                      opt.label === value || opt.value === value
                    )
                    tableRow[col.key] = option ? option.value : value
                    break
                  default:
                    tableRow[col.key] = value
                }
              } else {
                tableRow[col.key] = col.type === 'boolean' ? false : ''
              }
            })
            
            return tableRow
          })
          
          resolve(importedRows)
          ElMessage.success(`成功导入 ${importedRows.length} 行数据`)
        } catch (error) {
          console.error('Excel import failed:', error)
          reject(error)
          ElMessage.error('Excel导入失败')
        }
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
        ElMessage.error('文件读取失败')
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  return {
    exportToCSV,
    exportToExcel,
    exportToJSON,
    importFromExcel
  }
}