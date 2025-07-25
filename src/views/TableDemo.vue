<template>
  <div class="table-demo">
    <div class="demo-header">
      <h1>高级表格编辑组件演示</h1>
      <p>基于 Vue3 + Element Plus 的企业级表格编辑组件，支持单元格编辑、数据验证、排序筛选、复制粘贴等功能</p>
    </div>

    <div class="demo-content">
      <AdvancedTableEditor
        :config="tableConfig"
        @update:data="handleDataUpdate"
        @cell-edit="handleCellEdit"
        @row-add="handleRowAdd"
        @row-delete="handleRowDelete"
        @data-export="handleDataExport"
      />
    </div>

    <div class="demo-info">
      <el-card header="功能说明">
        <ul>
          <li><strong>单元格编辑</strong>: 单击或双击单元格进行编辑，支持文本、数字、选择器、日期等类型</li>
          <li><strong>行级操作</strong>: 支持添加新行、删除行、批量删除等操作</li>
          <li><strong>数据验证</strong>: 实时验证输入数据，显示错误提示</li>
          <li><strong>排序筛选</strong>: 点击列头进行排序，使用筛选下拉菜单过滤数据</li>
          <li><strong>复制粘贴</strong>: 支持 Ctrl+C/Ctrl+V 进行数据复制粘贴（开发中）</li>
          <li><strong>数据导出</strong>: 支持导出表格数据为 Excel 或 CSV 格式</li>
        </ul>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import AdvancedTableEditor from '../components/AdvancedTableEditor.vue'
import type { TableConfig, TableRow, CellEditEvent } from '../types/table'

// Sample data
const sampleData: TableRow[] = [
  {
    id: 1,
    name: '张三',
    age: 28,
    department: 'IT',
    position: '前端工程师',
    salary: 15000,
    joinDate: '2023-01-15',
    active: true
  },
  {
    id: 2,
    name: '李四',
    age: 32,
    department: 'IT',
    position: '后端工程师',
    salary: 18000,
    joinDate: '2022-08-20',
    active: true
  },
  {
    id: 3,
    name: '王五',
    age: 26,
    department: 'Design',
    position: 'UI设计师',
    salary: 12000,
    joinDate: '2023-03-10',
    active: false
  },
  {
    id: 4,
    name: '赵六',
    age: 35,
    department: 'Marketing',
    position: '市场经理',
    salary: 20000,
    joinDate: '2021-12-05',
    active: true
  },
  {
    id: 5,
    name: '钱七',
    age: 29,
    department: 'HR',
    position: '人事专员',
    salary: 10000,
    joinDate: '2023-05-18',
    active: true
  }
]

// Table configuration
const tableConfig = reactive<TableConfig>({
  columns: [
    {
      key: 'name',
      label: '姓名',
      type: 'text',
      width: 120,
      sortable: true,
      filterable: false,
      editable: true,
      required: true,
      validator: (value: string) => {
        if (!value || value.trim().length === 0) {
          return '姓名不能为空'
        }
        if (value.length < 2) {
          return '姓名至少2个字符'
        }
        return true
      }
    },
    {
      key: 'age',
      label: '年龄',
      type: 'number',
      width: 100,
      sortable: true,
      filterable: false,
      editable: true,
      required: true,
      validator: (value: number) => {
        if (!value) return '年龄不能为空'
        if (value < 18 || value > 65) return '年龄必须在18-65之间'
        return true
      }
    },
    {
      key: 'department',
      label: '部门',
      type: 'select',
      width: 120,
      sortable: true,
      filterable: true,
      editable: true,
      required: true,
      options: [
        { label: 'IT部门', value: 'IT' },
        { label: '设计部门', value: 'Design' },
        { label: '市场部门', value: 'Marketing' },
        { label: '人事部门', value: 'HR' },
        { label: '财务部门', value: 'Finance' }
      ]
    },
    {
      key: 'position',
      label: '职位',
      type: 'text',
      width: 150,
      sortable: true,
      filterable: true,
      editable: true,
      required: true
    },
    {
      key: 'salary',
      label: '薪资',
      type: 'number',
      width: 120,
      sortable: true,
      filterable: false,
      editable: true,
      required: true,
      validator: (value: number) => {
        if (!value) return '薪资不能为空'
        if (value < 5000) return '薪资不能低于5000'
        return true
      }
    },
    {
      key: 'joinDate',
      label: '入职日期',
      type: 'date',
      width: 140,
      sortable: true,
      filterable: false,
      editable: true,
      required: true
    },
    {
      key: 'active',
      label: '在职状态',
      type: 'boolean',
      width: 100,
      sortable: true,
      filterable: true,
      editable: true
    }
  ],
  data: [...sampleData],
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

// Event handlers
const handleDataUpdate = (data: TableRow[]) => {
  console.log('Data updated:', data)
  ElMessage.success('数据已更新')
}

const handleCellEdit = (event: CellEditEvent) => {
  console.log('Cell edited:', event)
}

const handleRowAdd = (row: TableRow) => {
  console.log('Row added:', row)
  ElMessage.success('新行已添加')
}

const handleRowDelete = (rows: TableRow[]) => {
  console.log('Rows deleted:', rows)
  ElMessage.success(`已删除 ${rows.length} 行数据`)
}

const handleDataExport = (data: TableRow[]) => {
  console.log('Export data:', data)
  
  // Simple CSV export implementation
  const headers = tableConfig.columns.map(col => col.label).join(',')
  const rows = data.map(row => 
    tableConfig.columns.map(col => {
      let value = row[col.key]
      if (col.type === 'boolean') {
        value = value ? '是' : '否'
      } else if (col.type === 'select') {
        const option = col.options?.find(opt => opt.value === value)
        value = option ? option.label : value
      }
      return `"${value || ''}"`
    }).join(',')
  ).join('\n')
  
  const csvContent = `${headers}\n${rows}`
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'table-data.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('数据导出成功')
}
</script>

<style scoped>
.table-demo {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-header {
  margin-bottom: 24px;
  text-align: center;
}

.demo-header h1 {
  color: #303133;
  margin-bottom: 8px;
}

.demo-header p {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.demo-content {
  margin-bottom: 24px;
}

.demo-info {
  margin-top: 24px;
}

.demo-info ul {
  margin: 0;
  padding-left: 20px;
}

.demo-info li {
  margin-bottom: 8px;
  line-height: 1.6;
}
</style>