<template>
  <div class="editable-cell" :class="{ 'has-error': hasError }">
    <!-- Display mode -->
    <div
      v-if="!editing"
      class="cell-display"
      @click="startEdit"
      @dblclick="startEdit"
    >
      <span v-if="displayValue" class="cell-value">{{ displayValue }}</span>
      <span v-else class="cell-placeholder">点击编辑</span>
    </div>

    <!-- Edit mode -->
    <div v-else class="cell-edit">
      <!-- Text input -->
      <el-input
        v-if="column.type === 'text'"
        ref="inputRef"
        v-model="editValue"
        size="small"
        @blur="handleBlur"
        @keydown.enter="handleEnter"
        @keydown.esc="handleEscape"
      />

      <!-- Number input -->
      <el-input-number
        v-else-if="column.type === 'number'"
        ref="inputRef"
        v-model="editValue"
        size="small"
        :controls="false"
        @blur="handleBlur"
        @keydown.enter="handleEnter"
        @keydown.esc="handleEscape"
      />

      <!-- Select input -->
      <el-select
        v-else-if="column.type === 'select'"
        ref="inputRef"
        v-model="editValue"
        size="small"
        @blur="handleBlur"
        @change="handleChange"
      >
        <el-option
          v-for="option in column.options"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>

      <!-- Date picker -->
      <el-date-picker
        v-else-if="column.type === 'date'"
        ref="inputRef"
        v-model="editValue"
        type="date"
        size="small"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        @blur="handleBlur"
        @change="handleChange"
      />

      <!-- Boolean switch -->
      <el-switch
        v-else-if="column.type === 'boolean'"
        ref="inputRef"
        v-model="editValue"
        @change="handleChange"
      />
    </div>

    <!-- Error message -->
    <div v-if="hasError" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import type { TableColumn, TableRow, CellEditEvent } from '../types/table'

interface Props {
  row: TableRow
  column: TableColumn
  value: any
  editing: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:value': [event: CellEditEvent]
  'start-edit': [row: TableRow]
  'end-edit': [row: TableRow]
}>()

// Refs
const inputRef = ref()
const editValue = ref(props.value)

// Computed
const displayValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') {
    return ''
  }

  switch (props.column.type) {
    case 'boolean':
      return props.value ? '是' : '否'
    case 'select':
      const option = props.column.options?.find(opt => opt.value === props.value)
      return option ? option.label : props.value
    case 'date':
      return props.value
    default:
      return String(props.value)
  }
})

const hasError = computed(() => {
  return props.row._errors && props.row._errors[props.column.key]
})

const errorMessage = computed(() => {
  return props.row._errors?.[props.column.key] || ''
})

// Methods
const startEdit = () => {
  if (!props.column.editable) return
  
  editValue.value = props.value
  emit('start-edit', props.row)
  
  nextTick(() => {
    if (inputRef.value) {
      if (inputRef.value.focus) {
        inputRef.value.focus()
      } else if (inputRef.value.$el && inputRef.value.$el.focus) {
        inputRef.value.$el.focus()
      }
    }
  })
}

const endEdit = () => {
  emit('end-edit', props.row)
}

const saveValue = () => {
  const event: CellEditEvent = {
    row: props.row,
    column: props.column,
    value: editValue.value,
    oldValue: props.value
  }
  
  emit('update:value', event)
  endEdit()
}

const cancelEdit = () => {
  editValue.value = props.value
  endEdit()
}

const handleBlur = () => {
  // Don't auto-save on blur for select and date components
  if (props.column.type === 'select' || props.column.type === 'date') {
    return
  }
  saveValue()
}

const handleEnter = () => {
  saveValue()
}

const handleEscape = () => {
  cancelEdit()
}

const handleChange = () => {
  saveValue()
}

// Watch for external editing state changes
watch(() => props.editing, (newEditing) => {
  if (newEditing) {
    editValue.value = props.value
    nextTick(() => {
      if (inputRef.value) {
        if (inputRef.value.focus) {
          inputRef.value.focus()
        } else if (inputRef.value.$el && inputRef.value.$el.focus) {
          inputRef.value.$el.focus()
        }
      }
    })
  }
})

// Watch for external value changes
watch(() => props.value, (newValue) => {
  if (!props.editing) {
    editValue.value = newValue
  }
})
</script>

<style scoped>
.editable-cell {
  position: relative;
  min-height: 32px;
  width: 100%;
}

.cell-display {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  min-height: 16px;
  display: flex;
  align-items: center;
}

.cell-display:hover {
  background-color: #f5f7fa;
}

.cell-value {
  color: #303133;
}

.cell-placeholder {
  color: #c0c4cc;
  font-style: italic;
}

.cell-edit {
  width: 100%;
}

.cell-edit :deep(.el-input),
.cell-edit :deep(.el-input-number),
.cell-edit :deep(.el-select),
.cell-edit :deep(.el-date-editor) {
  width: 100%;
}

.has-error .cell-display {
  border: 1px solid #f56c6c;
  background-color: #fef0f0;
}

.has-error .cell-edit :deep(.el-input__wrapper),
.has-error .cell-edit :deep(.el-input-number .el-input__wrapper),
.has-error .cell-edit :deep(.el-select .el-input__wrapper) {
  border-color: #f56c6c;
}

.error-message {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #f56c6c;
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 0 0 4px 4px;
  z-index: 10;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>