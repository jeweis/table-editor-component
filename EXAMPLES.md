# Usage Examples

This document provides comprehensive examples of how to use the Advanced Table Editor Component in different scenarios.

## Table of Contents

1. [Basic Employee Management](#basic-employee-management)
2. [Product Inventory](#product-inventory)
3. [Financial Data](#financial-data)
4. [Custom Validation](#custom-validation)
5. [Advanced Configuration](#advanced-configuration)

## Basic Employee Management

```vue
<template>
  <div class="employee-management">
    <h2>Employee Management System</h2>
    <AdvancedTableEditor
      :config="employeeConfig"
      @update:data="handleEmployeeUpdate"
      @cell-edit="handleCellEdit"
      @row-add="handleEmployeeAdd"
      @row-delete="handleEmployeeDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import AdvancedTableEditor from './components/AdvancedTableEditor.vue'
import type { TableConfig, TableRow, CellEditEvent } from './types/table'

const employeeConfig = reactive<TableConfig>({
  columns: [
    {
      key: 'employeeId',
      label: 'Employee ID',
      type: 'text',
      width: 120,
      sortable: true,
      editable: false, // Read-only field
      required: true
    },
    {
      key: 'firstName',
      label: 'First Name',
      type: 'text',
      width: 120,
      sortable: true,
      editable: true,
      required: true,
      validator: (value: string) => {
        if (!value || value.trim().length === 0) return 'First name is required'
        if (value.length < 2) return 'First name must be at least 2 characters'
        return true
      }
    },
    {
      key: 'lastName',
      label: 'Last Name',
      type: 'text',
      width: 120,
      sortable: true,
      editable: true,
      required: true,
      validator: (value: string) => {
        if (!value || value.trim().length === 0) return 'Last name is required'
        if (value.length < 2) return 'Last name must be at least 2 characters'
        return true
      }
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      width: 200,
      sortable: true,
      editable: true,
      required: true,
      validator: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(value) ? true : 'Invalid email format'
      }
    },
    {
      key: 'department',
      label: 'Department',
      type: 'select',
      width: 150,
      sortable: true,
      filterable: true,
      editable: true,
      required: true,
      options: [
        { label: 'Engineering', value: 'engineering' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Sales', value: 'sales' },
        { label: 'HR', value: 'hr' },
        { label: 'Finance', value: 'finance' }
      ]
    },
    {
      key: 'position',
      label: 'Position',
      type: 'text',
      width: 150,
      sortable: true,
      filterable: true,
      editable: true,
      required: true
    },
    {
      key: 'salary',
      label: 'Salary',
      type: 'number',
      width: 120,
      sortable: true,
      editable: true,
      required: true,
      validator: (value: number) => {
        if (!value) return 'Salary is required'
        if (value < 30000) return 'Salary must be at least $30,000'
        if (value > 500000) return 'Salary cannot exceed $500,000'
        return true
      }
    },
    {
      key: 'hireDate',
      label: 'Hire Date',
      type: 'date',
      width: 140,
      sortable: true,
      editable: true,
      required: true
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'boolean',
      width: 80,
      sortable: true,
      filterable: true,
      editable: true
    }
  ],
  data: [
    {
      id: 1,
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      department: 'engineering',
      position: 'Senior Developer',
      salary: 85000,
      hireDate: '2022-01-15',
      isActive: true
    },
    {
      id: 2,
      employeeId: 'EMP002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@company.com',
      department: 'marketing',
      position: 'Marketing Manager',
      salary: 75000,
      hireDate: '2021-08-20',
      isActive: true
    }
  ],
  editable: true,
  sortable: true,
  filterable: true,
  selectable: true,
  pagination: true,
  pageSize: 20,
  showToolbar: true,
  allowAdd: true,
  allowDelete: true,
  allowExport: true,
  allowCopyPaste: true
})

const handleEmployeeUpdate = (data: TableRow[]) => {
  console.log('Employee data updated:', data)
  // Save to backend API
}

const handleCellEdit = (event: CellEditEvent) => {
  console.log('Employee cell edited:', event)
  // Log changes for audit trail
}

const handleEmployeeAdd = (row: TableRow) => {
  // Generate employee ID
  row.employeeId = `EMP${String(Date.now()).slice(-3).padStart(3, '0')}`
  console.log('New employee added:', row)
}

const handleEmployeeDelete = (rows: TableRow[]) => {
  console.log('Employees deleted:', rows)
  // Soft delete in backend
}
</script>
```

## Product Inventory

```vue
<template>
  <div class="inventory-management">
    <h2>Product Inventory</h2>
    <AdvancedTableEditor
      :config="inventoryConfig"
      @update:data="handleInventoryUpdate"
      @cell-edit="handleStockChange"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'

const inventoryConfig = reactive<TableConfig>({
  columns: [
    {
      key: 'sku',
      label: 'SKU',
      type: 'text',
      width: 120,
      sortable: true,
      editable: true,
      required: true,
      validator: (value: string) => {
        const skuRegex = /^[A-Z]{2,3}-\d{4,6}$/
        return skuRegex.test(value) ? true : 'SKU format: XX-1234 or XXX-123456'
      }
    },
    {
      key: 'productName',
      label: 'Product Name',
      type: 'text',
      width: 200,
      sortable: true,
      editable: true,
      required: true
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      width: 150,
      sortable: true,
      filterable: true,
      editable: true,
      required: true,
      options: [
        { label: 'Electronics', value: 'electronics' },
        { label: 'Clothing', value: 'clothing' },
        { label: 'Books', value: 'books' },
        { label: 'Home & Garden', value: 'home_garden' },
        { label: 'Sports', value: 'sports' }
      ]
    },
    {
      key: 'price',
      label: 'Price ($)',
      type: 'number',
      width: 100,
      sortable: true,
      editable: true,
      required: true,
      validator: (value: number) => {
        if (!value || value <= 0) return 'Price must be greater than 0'
        return true
      }
    },
    {
      key: 'stock',
      label: 'Stock',
      type: 'number',
      width: 100,
      sortable: true,
      editable: true,
      required: true,
      validator: (value: number) => {
        if (value < 0) return 'Stock cannot be negative'
        return true
      }
    },
    {
      key: 'minStock',
      label: 'Min Stock',
      type: 'number',
      width: 100,
      sortable: true,
      editable: true,
      required: true,
      validator: (value: number) => {
        if (value < 0) return 'Minimum stock cannot be negative'
        return true
      }
    },
    {
      key: 'supplier',
      label: 'Supplier',
      type: 'select',
      width: 150,
      sortable: true,
      filterable: true,
      editable: true,
      options: [
        { label: 'Supplier A', value: 'supplier_a' },
        { label: 'Supplier B', value: 'supplier_b' },
        { label: 'Supplier C', value: 'supplier_c' }
      ]
    },
    {
      key: 'lastRestocked',
      label: 'Last Restocked',
      type: 'date',
      width: 140,
      sortable: true,
      editable: true
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'boolean',
      width: 80,
      sortable: true,
      filterable: true,
      editable: true
    }
  ],
  data: [
    {
      id: 1,
      sku: 'EL-12345',
      productName: 'Wireless Headphones',
      category: 'electronics',
      price: 99.99,
      stock: 150,
      minStock: 20,
      supplier: 'supplier_a',
      lastRestocked: '2024-01-15',
      isActive: true
    },
    {
      id: 2,
      sku: 'CL-67890',
      productName: 'Cotton T-Shirt',
      category: 'clothing',
      price: 24.99,
      stock: 5,
      minStock: 10,
      supplier: 'supplier_b',
      lastRestocked: '2024-01-10',
      isActive: true
    }
  ],
  editable: true,
  sortable: true,
  filterable: true,
  selectable: true,
  pagination: true,
  pageSize: 25,
  showToolbar: true,
  allowAdd: true,
  allowDelete: true,
  allowExport: true,
  allowCopyPaste: true
})

const handleInventoryUpdate = (data: TableRow[]) => {
  // Check for low stock alerts
  data.forEach(item => {
    if (item.stock <= item.minStock && item.isActive) {
      ElMessage.warning(`Low stock alert: ${item.productName} (${item.stock} remaining)`)
    }
  })
}

const handleStockChange = (event: CellEditEvent) => {
  if (event.column.key === 'stock') {
    const item = event.row
    if (event.value <= item.minStock && item.isActive) {
      ElMessage.warning(`Low stock: ${item.productName}`)
    }
  }
}
</script>
```

## Custom Validation

```vue
<template>
  <div class="custom-validation-example">
    <h2>Advanced Validation Example</h2>
    <AdvancedTableEditor
      :config="validationConfig"
      @update:data="handleDataUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

const validationConfig = reactive<TableConfig>({
  columns: [
    {
      key: 'username',
      label: 'Username',
      type: 'text',
      width: 150,
      editable: true,
      required: true,
      validator: (value: string) => {
        if (!value || value.length < 3) {
          return 'Username must be at least 3 characters'
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          return 'Username can only contain letters, numbers, and underscores'
        }
        
        // Check against existing usernames
        const existingUsernames = ['admin', 'user', 'test']
        if (existingUsernames.includes(value.toLowerCase())) {
          return 'Username already exists'
        }
        
        return true
      }
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      width: 200,
      editable: true,
      required: true,
      validator: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          return 'Invalid email format'
        }
        
        // Check for business email domains
        const businessDomains = ['company.com', 'business.org']
        const domain = value.split('@')[1]
        if (!businessDomains.includes(domain)) {
          return 'Please use a business email address'
        }
        
        return true
      }
    },
    {
      key: 'phone',
      label: 'Phone',
      type: 'text',
      width: 150,
      editable: true,
      required: true,
      validator: (value: string) => {
        // US phone number validation
        const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/
        if (!phoneRegex.test(value)) {
          return 'Phone format: (123) 456-7890'
        }
        return true
      }
    },
    {
      key: 'age',
      label: 'Age',
      type: 'number',
      width: 100,
      editable: true,
      required: true,
      validator: (value: number) => {
        if (value < 18) return 'Must be at least 18 years old'
        if (value > 120) return 'Invalid age'
        return true
      }
    },
    {
      key: 'password',
      label: 'Password Strength',
      type: 'text',
      width: 150,
      editable: true,
      required: true,
      validator: (value: string) => {
        if (value.length < 8) {
          return 'Password must be at least 8 characters'
        }
        if (!/(?=.*[a-z])/.test(value)) {
          return 'Password must contain lowercase letter'
        }
        if (!/(?=.*[A-Z])/.test(value)) {
          return 'Password must contain uppercase letter'
        }
        if (!/(?=.*\d)/.test(value)) {
          return 'Password must contain number'
        }
        if (!/(?=.*[@$!%*?&])/.test(value)) {
          return 'Password must contain special character'
        }
        return true
      }
    }
  ],
  data: [
    {
      id: 1,
      username: 'john_doe',
      email: 'john@company.com',
      phone: '(555) 123-4567',
      age: 28,
      password: 'SecurePass123!'
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
  console.log('Validated data updated:', data)
}
</script>
```

## Advanced Configuration

```vue
<template>
  <div class="advanced-config-example">
    <h2>Advanced Configuration Example</h2>
    
    <!-- Configuration Controls -->
    <div class="config-controls">
      <el-switch v-model="config.editable" active-text="Editable" />
      <el-switch v-model="config.sortable" active-text="Sortable" />
      <el-switch v-model="config.filterable" active-text="Filterable" />
      <el-switch v-model="config.selectable" active-text="Selectable" />
      <el-switch v-model="config.pagination" active-text="Pagination" />
      <el-switch v-model="config.allowCopyPaste" active-text="Copy/Paste" />
    </div>

    <AdvancedTableEditor
      :config="config"
      @update:data="handleDataUpdate"
      @cell-edit="handleCellEdit"
      @row-add="handleRowAdd"
      @row-delete="handleRowDelete"
      @data-export="handleDataExport"
    />

    <!-- Statistics -->
    <div class="statistics">
      <el-card header="Statistics">
        <p>Total Rows: {{ config.data.length }}</p>
        <p>Selected Rows: {{ selectedCount }}</p>
        <p>Last Edit: {{ lastEdit || 'None' }}</p>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const selectedCount = ref(0)
const lastEdit = ref('')

const config = reactive<TableConfig>({
  columns: [
    {
      key: 'id',
      label: 'ID',
      type: 'number',
      width: 80,
      sortable: true,
      editable: false
    },
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      width: 150,
      sortable: true,
      editable: true,
      required: true
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      width: 120,
      sortable: true,
      filterable: true,
      editable: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Pending', value: 'pending' }
      ]
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      width: 120,
      sortable: true,
      filterable: true,
      editable: true,
      options: [
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' }
      ]
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      type: 'date',
      width: 140,
      sortable: true,
      editable: true
    },
    {
      key: 'completed',
      label: 'Completed',
      type: 'boolean',
      width: 100,
      sortable: true,
      filterable: true,
      editable: true
    }
  ],
  data: [
    {
      id: 1,
      name: 'Task 1',
      status: 'active',
      priority: 'high',
      dueDate: '2024-02-15',
      completed: false
    },
    {
      id: 2,
      name: 'Task 2',
      status: 'pending',
      priority: 'medium',
      dueDate: '2024-02-20',
      completed: false
    },
    {
      id: 3,
      name: 'Task 3',
      status: 'active',
      priority: 'low',
      dueDate: '2024-02-25',
      completed: true
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
  ElMessage.success('Data updated successfully')
}

const handleCellEdit = (event: CellEditEvent) => {
  lastEdit.value = `${event.column.label}: ${event.oldValue} → ${event.value}`
  console.log('Cell edited:', event)
}

const handleRowAdd = (row: TableRow) => {
  row.id = Math.max(...config.data.map(r => r.id || 0)) + 1
  ElMessage.success('New row added')
}

const handleRowDelete = (rows: TableRow[]) => {
  ElMessage.success(`${rows.length} row(s) deleted`)
}

const handleDataExport = (data: TableRow[]) => {
  ElMessage.info('Export initiated')
}
</script>

<style scoped>
.config-controls {
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.statistics {
  margin-top: 20px;
}
</style>
```

## Integration with Backend API

```vue
<template>
  <div class="api-integration-example">
    <h2>Backend API Integration</h2>
    <AdvancedTableEditor
      :config="apiConfig"
      @update:data="saveToBackend"
      @cell-edit="handleCellEdit"
      @row-add="createRecord"
      @row-delete="deleteRecords"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'

const apiConfig = reactive<TableConfig>({
  columns: [
    {
      key: 'id',
      label: 'ID',
      type: 'number',
      width: 80,
      sortable: true,
      editable: false
    },
    {
      key: 'title',
      label: 'Title',
      type: 'text',
      width: 200,
      sortable: true,
      editable: true,
      required: true
    },
    {
      key: 'description',
      label: 'Description',
      type: 'text',
      width: 300,
      editable: true
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      width: 120,
      sortable: true,
      filterable: true,
      editable: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' }
      ]
    },
    {
      key: 'createdAt',
      label: 'Created',
      type: 'date',
      width: 140,
      sortable: true,
      editable: false
    }
  ],
  data: [],
  editable: true,
  sortable: true,
  filterable: true,
  selectable: true,
  pagination: true,
  pageSize: 20,
  showToolbar: true,
  allowAdd: true,
  allowDelete: true,
  allowExport: true,
  allowCopyPaste: true
})

// API functions
const fetchData = async () => {
  const loading = ElLoading.service({ text: 'Loading data...' })
  try {
    const response = await fetch('/api/records')
    const data = await response.json()
    apiConfig.data = data
    ElMessage.success('Data loaded successfully')
  } catch (error) {
    ElMessage.error('Failed to load data')
    console.error('Fetch error:', error)
  } finally {
    loading.close()
  }
}

const saveToBackend = async (data: TableRow[]) => {
  try {
    const response = await fetch('/api/records/bulk-update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (response.ok) {
      ElMessage.success('Data saved successfully')
    } else {
      throw new Error('Save failed')
    }
  } catch (error) {
    ElMessage.error('Failed to save data')
    console.error('Save error:', error)
  }
}

const handleCellEdit = async (event: CellEditEvent) => {
  try {
    const response = await fetch(`/api/records/${event.row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        [event.column.key]: event.value
      })
    })
    
    if (!response.ok) {
      throw new Error('Update failed')
    }
  } catch (error) {
    ElMessage.error('Failed to update record')
    // Revert the change
    event.row[event.column.key] = event.oldValue
  }
}

const createRecord = async (row: TableRow) => {
  try {
    const response = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    })
    
    if (response.ok) {
      const newRecord = await response.json()
      Object.assign(row, newRecord)
      ElMessage.success('Record created successfully')
    } else {
      throw new Error('Create failed')
    }
  } catch (error) {
    ElMessage.error('Failed to create record')
    // Remove the row from the table
    const index = apiConfig.data.findIndex(r => r.id === row.id)
    if (index > -1) {
      apiConfig.data.splice(index, 1)
    }
  }
}

const deleteRecords = async (rows: TableRow[]) => {
  try {
    const ids = rows.map(row => row.id)
    const response = await fetch('/api/records/bulk-delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    })
    
    if (response.ok) {
      ElMessage.success(`${rows.length} record(s) deleted successfully`)
    } else {
      throw new Error('Delete failed')
    }
  } catch (error) {
    ElMessage.error('Failed to delete records')
    // Restore the deleted rows
    apiConfig.data.push(...rows)
  }
}

// Load data on component mount
onMounted(() => {
  fetchData()
})
</script>
```

These examples demonstrate various use cases and configurations for the Advanced Table Editor Component. Each example shows different aspects of the component's functionality and how to integrate it into real-world applications.