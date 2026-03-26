<template>
  <div class="purchase-suggestion">
    <div class="card-header">采购建议</div>
    <div class="card-body">
      <!-- 仓库选择 -->
      <div class="select-row">
        <div class="select-label">仓库：</div>
        <div class="select-box" @click="openWarehouseModal">
          <span class="select-placeholder">点击选择仓库</span>
        </div>
      </div>
      <div v-if="selectedWarehouseIds.length" class="tags-area">
        <span v-for="id in selectedWarehouseIds" :key="id" class="tag">
          {{ getWarehouseName(id) }}
          <button class="tag-remove" @click.stop="removeWarehouse(id)">×</button>
        </span>
      </div>

      <!-- 冶炼厂选择 -->
      <div class="select-row">
        <div class="select-label">冶炼厂：</div>
        <div class="select-box" @click="openSmelterModal">
          <span class="select-placeholder">点击选择冶炼厂</span>
        </div>
      </div>
      <div v-if="selectedSmelterIds.length" class="smelter-list">
        <div v-for="id in selectedSmelterIds" :key="id" class="smelter-item">
          <div class="smelter-info">
            <span class="smelter-name">{{ getSmelterName(id) }}</span>
            <span 
              class="config-status" 
              :class="getSmelterConfig(id).length ? 'configured' : 'unconfigured'"
            >
              {{ getSmelterConfig(id).length ? getSmelterConfig(id).length + '个品类' : '未配置' }}
            </span>
          </div>
          <button class="btn-config" @click="configureSmelter(id)">配置</button>
        </div>
      </div>

      <!-- 获取建议按钮 -->
      <div class="action-row">
        <button class="btn-primary" :disabled="!hasDemands || suggestionLoading" @click="openSummaryModal">
          {{ suggestionLoading ? '计算中...' : '获取采购建议' }}
        </button>
      </div>

      <!-- 采购建议结果 -->
      <div v-if="suggestions.length" class="result-section">
        <div class="section-title">采购建议结果</div>
        <div class="suggestions-list">
          <div v-for="(item, idx) in suggestions" :key="idx" class="suggestion-card">
            <div class="suggestion-header">
              <strong>{{ item.warehouse }}</strong> → <strong>{{ item.smelter }}</strong>
              <span class="category">{{ item.category }}</span>
            </div>
            <div class="suggestion-content">
              <div class="info-row">
                <span>需求吨数：</span>
                <span class="value">{{ item.demand }} 吨</span>
              </div>
              <div class="info-row">
                <span>价格：</span>
                <span class="value price">{{ item.price }} 元/吨</span>
              </div>
              <div class="info-row">
                <span>运费：</span>
                <span class="value">{{ item.freight }} 元/吨</span>
              </div>
              <div class="info-row total">
                <span>总成本：</span>
                <span class="value total-price">{{ item.total }} 元</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗1：选择仓库 -->
    <teleport to="body">
      <div v-if="warehouseModalVisible" class="modal-overlay" @click.self="closeWarehouseModal">
        <div class="modal-container modal-large">
          <div class="modal-header">
            <h3>选择仓库</h3>
            <button class="close" @click="closeWarehouseModal">×</button>
          </div>
          <div class="modal-body">
            <input 
              v-model="warehouseSearch" 
              type="text" 
              placeholder="搜索仓库..." 
              class="search-input"
            />
            <div class="checkbox-group-modal">
              <label v-for="w in filteredWarehouses" :key="w.id" class="checkbox-label">
                <input type="checkbox" :value="w.id" v-model="tempSelectedWarehouseIds" />
                {{ w.name }}
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-modal btn-primary-modal" @click="confirmWarehouseSelection">保存</button>
            <button class="btn-modal" @click="resetWarehouseSelection">重置</button>
            <button class="btn-modal" @click="closeWarehouseModal">取消</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 弹窗2：选择冶炼厂 -->
    <teleport to="body">
      <div v-if="smelterModalVisible" class="modal-overlay" @click.self="closeSmelterModal">
        <div class="modal-container modal-large">
          <div class="modal-header">
            <h3>选择冶炼厂</h3>
            <button class="close" @click="closeSmelterModal">×</button>
          </div>
          <div class="modal-body">
            <input 
              v-model="smelterSearch" 
              type="text" 
              placeholder="搜索冶炼厂..." 
              class="search-input"
            />
            <div class="checkbox-group-modal">
              <label v-for="s in filteredSmelters" :key="s.id" class="checkbox-label">
                <input type="checkbox" :value="s.id" v-model="tempSelectedSmelterIds" />
                {{ s.name }}
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-modal btn-primary-modal" @click="confirmSmelterSelection">保存</button>
            <button class="btn-modal" @click="resetSmelterSelection">重置</button>
            <button class="btn-modal" @click="closeSmelterModal">取消</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 弹窗3：配置需求 -->
    <teleport to="body">
      <div v-if="configModalVisible" class="modal-overlay" @click.self="closeConfigModal">
        <div class="modal-container modal-large">
          <div class="modal-header">
            <h3>配置需求 - {{ currentSmelter?.name }}</h3>
            <button class="close" @click="closeConfigModal">×</button>
          </div>
          <div class="modal-body config-modal-body">
            <div class="category-section">
              <div class="section-subtitle">选择品类（可多选）</div>
              <div class="checkbox-group">
                <label v-for="c in allCategories" :key="c.id" class="checkbox-label">
                  <input type="checkbox" :value="c.id" v-model="tempCategoryIds" />
                  {{ c.name }}
                </label>
              </div>
            </div>
            
            <div v-if="tempCategoryIds.length" class="demand-input-section">
              <div class="section-subtitle">需求吨数</div>
              <div class="demand-input-list">
                <div v-for="catId in tempCategoryIds" :key="catId" class="demand-input-item">
                  <span class="category-name">{{ getCategoryName(catId) }}</span>
                  <input 
                    v-model.number="tempDemands[catId]" 
                    type="number" 
                    step="0.01" 
                    min="0"
                    placeholder="请输入吨数"
                    class="demand-input"
                  />
                  <span class="unit">吨</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-modal btn-primary-modal" @click="saveConfig">保存</button>
            <button class="btn-modal" @click="resetConfig">重置</button>
            <button class="btn-modal" @click="closeConfigModal">取消</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 弹窗4：汇总确认弹窗 -->
    <teleport to="body">
      <div v-if="summaryModalVisible" class="modal-overlay" @click.self="closeSummaryModal">
        <div class="modal-container summary-modal">
          <div class="modal-header">
            <h3>确认采购需求</h3>
            <button class="close" @click="closeSummaryModal">×</button>
          </div>
          <div class="modal-body summary-body">
            <div class="summary-list">
              <div v-for="smelterId in selectedSmelterIds" :key="smelterId" class="summary-item">
                <div class="summary-smelter-name">{{ getSmelterName(smelterId) }}</div>
                <div class="summary-categories">
                  <div 
                    v-for="(item, idx) in getSmelterConfig(smelterId)" 
                    :key="idx" 
                    class="summary-category-item"
                  >
                    {{ item.categoryName }}:{{ item.demand }}吨
                  </div>
                  <div v-if="!getSmelterConfig(smelterId).length" class="empty-config">
                    未配置
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-modal btn-primary-modal" @click="confirmAndGetSuggestions">确定</button>
            <button class="btn-modal" @click="closeSummaryModal">取消</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// ==================== 模拟数据 ====================
const warehouses = ref([
  { id: 101, name: '北京仓' },
  { id: 102, name: '上海仓' },
  { id: 103, name: '广州仓' },
  { id: 104, name: '成都仓' }
])

const smelters = ref([
  { id: 201, name: '华北冶炼厂' },
  { id: 202, name: '华东冶炼厂' },
  { id: 203, name: '华南冶炼厂' },
  { id: 204, name: '西南冶炼厂' },
  { id: 205, name: '华中冶炼厂' }
])

const allCategories = ref([
  { id: 301, name: '铜' },
  { id: 302, name: '铝' },
  { id: 303, name: '锌' },
  { id: 304, name: '铅' }
])

// ==================== 状态 ====================
// 仓库
const warehouseModalVisible = ref(false)
const warehouseSearch = ref('')
const tempSelectedWarehouseIds = ref([])
const selectedWarehouseIds = ref([])

// 冶炼厂
const smelterModalVisible = ref(false)
const smelterSearch = ref('')
const tempSelectedSmelterIds = ref([])
const selectedSmelterIds = ref([])

// 需求配置
const smelterConfigs = ref({})

// 配置弹窗
const configModalVisible = ref(false)
const currentSmelter = ref(null)
const tempCategoryIds = ref([])
const tempDemands = ref({})

// 汇总弹窗
const summaryModalVisible = ref(false)

// 建议结果
const suggestions = ref([])
const suggestionLoading = ref(false)

// ==================== 计算属性 ====================
const filteredWarehouses = computed(() => {
  if (!warehouseSearch.value) return warehouses.value
  return warehouses.value.filter(w => 
    w.name.toLowerCase().includes(warehouseSearch.value.toLowerCase())
  )
})

const filteredSmelters = computed(() => {
  if (!smelterSearch.value) return smelters.value
  return smelters.value.filter(s => 
    s.name.toLowerCase().includes(smelterSearch.value.toLowerCase())
  )
})

const hasDemands = computed(() => {
  return Object.keys(smelterConfigs.value).length > 0
})

// ==================== 辅助函数 ====================
function getWarehouseName(id) {
  const w = warehouses.value.find(w => w.id === id)
  return w ? w.name : ''
}

function getSmelterName(id) {
  const s = smelters.value.find(s => s.id === id)
  return s ? s.name : ''
}

function getCategoryName(id) {
  const c = allCategories.value.find(c => c.id === id)
  return c ? c.name : ''
}

function getSmelterConfig(smelterId) {
  const config = smelterConfigs.value[smelterId]
  if (!config) return []
  return Object.entries(config).map(([categoryId, demand]) => ({
    categoryId: Number(categoryId),
    categoryName: getCategoryName(Number(categoryId)),
    demand: demand
  }))
}

// ==================== 仓库弹窗 ====================
function openWarehouseModal() {
  tempSelectedWarehouseIds.value = [...selectedWarehouseIds.value]
  warehouseSearch.value = ''
  warehouseModalVisible.value = true
}

function closeWarehouseModal() {
  warehouseModalVisible.value = false
}

function resetWarehouseSelection() {
  tempSelectedWarehouseIds.value = []
}

function confirmWarehouseSelection() {
  selectedWarehouseIds.value = [...tempSelectedWarehouseIds.value]
  closeWarehouseModal()
}

function removeWarehouse(id) {
  selectedWarehouseIds.value = selectedWarehouseIds.value.filter(i => i !== id)
}

// ==================== 冶炼厂弹窗 ====================
function openSmelterModal() {
  tempSelectedSmelterIds.value = [...selectedSmelterIds.value]
  smelterSearch.value = ''
  smelterModalVisible.value = true
}

function closeSmelterModal() {
  smelterModalVisible.value = false
}

function resetSmelterSelection() {
  tempSelectedSmelterIds.value = []
}

function confirmSmelterSelection() {
  selectedSmelterIds.value = [...tempSelectedSmelterIds.value]
  closeSmelterModal()
}

// ==================== 配置弹窗 ====================
function configureSmelter(smelterId) {
  const smelter = smelters.value.find(s => s.id === smelterId)
  if (smelter) {
    currentSmelter.value = smelter
    const existingConfig = smelterConfigs.value[smelterId] || {}
    tempCategoryIds.value = Object.keys(existingConfig).map(Number)
    tempDemands.value = { ...existingConfig }
    configModalVisible.value = true
  }
}

function closeConfigModal() {
  configModalVisible.value = false
  currentSmelter.value = null
}

function resetConfig() {
  tempCategoryIds.value = []
  tempDemands.value = {}
}

function saveConfig() {
  if (!tempCategoryIds.value.length) {
    alert('请至少选择一个品类')
    return
  }
  
  for (const catId of tempCategoryIds.value) {
    const demand = tempDemands.value[catId]
    if (!demand || demand <= 0) {
      alert(`请填写 ${getCategoryName(catId)} 的需求吨数`)
      return
    }
  }
  
  const config = {}
  for (const catId of tempCategoryIds.value) {
    config[catId] = tempDemands.value[catId]
  }
  smelterConfigs.value[currentSmelter.value.id] = config
  
  closeConfigModal()
}

// ==================== 汇总弹窗 ====================
function openSummaryModal() {
  if (!selectedWarehouseIds.value.length) {
    alert('请选择仓库')
    return
  }
  
  const hasAnyConfig = selectedSmelterIds.value.some(id => {
    const config = smelterConfigs.value[id]
    return config && Object.keys(config).length > 0
  })
  
  if (!hasAnyConfig) {
    alert('请先配置需求')
    return
  }
  
  summaryModalVisible.value = true
}

function closeSummaryModal() {
  summaryModalVisible.value = false
}

// 确认后获取建议
async function confirmAndGetSuggestions() {
  closeSummaryModal()
  await getSuggestions()
}

// 需求列表
const demandList = computed(() => {
  const list = []
  for (const smelterId of selectedSmelterIds.value) {
    const config = smelterConfigs.value[smelterId]
    if (config) {
      for (const [categoryId, demand] of Object.entries(config)) {
        list.push({
          smelterId: Number(smelterId),
          smelterName: getSmelterName(Number(smelterId)),
          categoryId: Number(categoryId),
          categoryName: getCategoryName(Number(categoryId)),
          demand: demand
        })
      }
    }
  }
  return list
})

// ==================== 获取采购建议 ====================
async function getSuggestions() {
  suggestionLoading.value = true
  
  setTimeout(() => {
    suggestions.value = demandList.value.map(item => {
      const warehouse = warehouses.value.find(w => selectedWarehouseIds.value.includes(w.id)) || warehouses.value[0]
      return {
        warehouse: warehouse.name,
        smelter: item.smelterName,
        category: item.categoryName,
        demand: item.demand,
        price: Math.floor(Math.random() * 5000) + 5000,
        freight: Math.floor(Math.random() * 300) + 100,
        total: item.demand * (Math.floor(Math.random() * 5000) + 5000 + Math.floor(Math.random() * 300) + 100)
      }
    })
    suggestionLoading.value = false
  }, 1000)
}
</script>

<style scoped>
.purchase-suggestion {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
  font-weight: 600;
  font-size: 18px;
}
.card-body {
  padding: 24px;
}

/* 选择行 */
.select-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.select-label {
  width: 70px;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}
.select-box {
  width: 220px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 10px 14px;
  background: #fff;
  cursor: pointer;
}
.select-box:hover {
  border-color: #2e7d32;
}
.select-placeholder {
  color: #999;
  font-size: 14px;
}

/* 标签区域 */
.tags-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
  margin-left: 70px;
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #e8f5e9;
  color: #2e7d32;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
}
.tag-remove {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 16px;
  padding: 0 2px;
}
.tag-remove:hover {
  color: #ff4d4f;
}

/* 冶炼厂列表 */
.smelter-list {
  margin-left: 70px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  max-width: 600px;
}
.smelter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}
.smelter-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}
.smelter-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  min-width: 110px;
}
.config-status {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 16px;
  white-space: nowrap;
}
.config-status.configured {
  background: #e8f5e9;
  color: #2e7d32;
}
.config-status.unconfigured {
  background: #f5f5f5;
  color: #999;
}
.btn-config {
  background: #2e7d32;
  border: none;
  color: white;
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.btn-config:hover {
  background: #1b5e20;
}

/* 按钮 */
.action-row {
  margin-top: 16px;
}
.btn-primary {
  background: #2e7d32;
  border: none;
  padding: 10px 32px;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 结果卡片 */
.result-section {
  margin-top: 24px;
  border-top: 1px solid #e8e8e8;
  padding-top: 20px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.suggestion-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 14px;
  background: #fafafa;
}
.suggestion-header {
  font-size: 14px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e8e8e8;
}
.suggestion-header strong {
  color: #2e7d32;
}
.category {
  background: #e8f5e9;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-left: 10px;
}
.suggestion-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.info-row span:first-child {
  color: #666;
}
.value {
  font-weight: 500;
}
.price {
  color: #2e7d32;
}
.total {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e8e8e8;
  grid-column: span 2;
}
.total-price {
  color: #f57c00;
  font-weight: 600;
  font-size: 15px;
}

/* 汇总弹窗样式 */
.summary-modal {
  max-width: 620px;
}
.summary-body {
  max-height: 65vh;
  overflow-y: auto;
}
.summary-body::-webkit-scrollbar {
  width: 6px;
}
.summary-body::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 3px;
}
.summary-body::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border-radius: 3px;
}
.summary-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.summary-item {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 14px;
  background: #fafafa;
}
.summary-smelter-name {
  font-weight: 600;
  font-size: 15px;
  color: #2e7d32;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8e8e8;
}
.summary-categories {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  max-height: 90px;
  overflow-y: auto;
  padding-right: 4px;
}
.summary-categories::-webkit-scrollbar {
  width: 4px;
}
.summary-categories::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 2px;
}
.summary-categories::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border-radius: 2px;
}
.summary-category-item {
  font-size: 14px;
  color: #333;
  padding: 6px 10px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
}
.empty-config {
  font-size: 13px;
  color: #999;
  padding: 6px 10px;
  text-align: center;
}

/* 通用弹窗 - 加大尺寸 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-container {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 580px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}
.modal-container.modal-large {
  max-width: 620px;
}
.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
}
.modal-header .close {
  background: none;
  border: none;
  font-size: 26px;
  cursor: pointer;
  color: #999;
}
.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  padding: 18px 24px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: center;
  gap: 20px;
}
.btn-modal {
  min-width: 90px;
  padding: 10px 20px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 15px;
  text-align: center;
}
.btn-modal:hover {
  border-color: #2e7d32;
  color: #2e7d32;
}
.btn-primary-modal {
  background: #2e7d32;
  border-color: #2e7d32;
  color: #fff;
}
.btn-primary-modal:hover {
  background: #1b5e20;
  color: #fff;
}
.search-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 15px;
  margin-bottom: 18px;
}
.checkbox-group-modal {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 320px;
  overflow-y: auto;
}
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  cursor: pointer;
}
.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.section-subtitle {
  font-size: 15px;
  font-weight: 500;
  color: #666;
  margin-bottom: 14px;
}
.demand-input-section {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid #e8e8e8;
}
.demand-input-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.demand-input-item {
  display: flex;
  align-items: center;
  gap: 14px;
}
.category-name {
  width: 80px;
  font-size: 15px;
  font-weight: 500;
}
.demand-input {
  width: 170px;
  padding: 10px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 15px;
}
.demand-input:focus {
  outline: none;
  border-color: #2e7d32;
}
.unit {
  font-size: 14px;
  color: #999;
}
</style>