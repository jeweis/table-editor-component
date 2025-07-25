<template>
  <div class="home">
    <div class="hero-section">
      <h1>高级表格编辑组件</h1>
      <p>基于 Vue3 + Element Plus 的企业级表格编辑解决方案</p>
      <div class="hero-buttons">
        <el-button type="primary" size="large" @click="goToDemo">
          查看演示
        </el-button>
        <el-button size="large" @click="scrollToFeatures">
          了解功能
        </el-button>
      </div>
    </div>

    <div class="features-section" ref="featuresRef">
      <h2>核心功能</h2>
      <div class="features-grid">
        <div class="feature-card">
          <el-icon class="feature-icon"><Edit /></el-icon>
          <h3>单元格编辑</h3>
          <p>支持多种数据类型的内联编辑，包括文本、数字、选择器、日期等</p>
        </div>
        <div class="feature-card">
          <el-icon class="feature-icon"><Operation /></el-icon>
          <h3>行级操作</h3>
          <p>完整的行操作功能，支持添加、删除、批量操作等</p>
        </div>
        <div class="feature-card">
          <el-icon class="feature-icon"><Warning /></el-icon>
          <h3>数据验证</h3>
          <p>实时数据验证，支持自定义验证规则和错误提示</p>
        </div>
        <div class="feature-card">
          <el-icon class="feature-icon"><Sort /></el-icon>
          <h3>排序筛选</h3>
          <p>多列排序和高级筛选功能，快速定位目标数据</p>
        </div>
        <div class="feature-card">
          <el-icon class="feature-icon"><CopyDocument /></el-icon>
          <h3>复制粘贴</h3>
          <p>支持键盘快捷键进行数据的复制粘贴操作</p>
        </div>
        <div class="feature-card">
          <el-icon class="feature-icon"><Download /></el-icon>
          <h3>数据导出</h3>
          <p>支持导出为 CSV、Excel 等多种格式</p>
        </div>
      </div>
    </div>

    <div class="tech-section">
      <h2>技术栈</h2>
      <div class="tech-stack">
        <div class="tech-item">
          <strong>Vue 3</strong>
          <span>Composition API + TypeScript</span>
        </div>
        <div class="tech-item">
          <strong>Element Plus</strong>
          <span>企业级 UI 组件库</span>
        </div>
        <div class="tech-item">
          <strong>Vite</strong>
          <span>快速构建工具</span>
        </div>
        <div class="tech-item">
          <strong>TypeScript</strong>
          <span>类型安全保障</span>
        </div>
      </div>
    </div>

    <div class="cta-section">
      <h2>立即体验</h2>
      <p>点击下方按钮查看完整的表格编辑功能演示</p>
      <el-button type="primary" size="large" @click="goToDemo">
        进入演示页面
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Edit,
  Operation,
  Warning,
  Sort,
  CopyDocument,
  Download
} from '@element-plus/icons-vue'

const router = useRouter()
const featuresRef = ref()

const goToDemo = () => {
  router.push('/table-demo')
}

const scrollToFeatures = () => {
  featuresRef.value?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.hero-section {
  text-align: center;
  padding: 80px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.hero-section h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.hero-section p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.features-section {
  padding: 80px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.features-section h2 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  color: #303133;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 3rem;
  color: #409eff;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #303133;
}

.feature-card p {
  color: #606266;
  line-height: 1.6;
}

.tech-section {
  padding: 80px 20px;
  background: #f5f7fa;
}

.tech-section h2 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  color: #303133;
}

.tech-stack {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.tech-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.tech-item strong {
  font-size: 1.2rem;
  color: #303133;
  margin-bottom: 0.5rem;
}

.tech-item span {
  color: #606266;
  font-size: 0.9rem;
}

.cta-section {
  text-align: center;
  padding: 80px 20px;
  background: #303133;
  color: white;
}

.cta-section h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.cta-section p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .hero-section h1 {
    font-size: 2rem;
  }
  
  .hero-section p {
    font-size: 1rem;
  }
  
  .features-section h2,
  .tech-section h2,
  .cta-section h2 {
    font-size: 2rem;
  }
  
  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }
}
</style>