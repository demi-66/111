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
        <button class="btn-primary" :disabled="!hasDemands || suggestionLoading" @click="getSuggestions">
          {{ suggestionLoading ? '计算中...' : '获取采购建议' }}
        </button>
      </div>

      <!-- 建议结果 -->
      <div v-if="suggestionText" class="result-section">
        <div class="section-title">采购建议</div>
        <div class="suggestion-text">{{ suggestionText }}</div>
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
              <label v-for="w in warehouses" :key="w.id" class="checkbox-label">
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
              <label v-for="s in smelters" :key="s.id" class="checkbox-label">
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
                <label v-for="c in categories" :key="c.id" class="checkbox-label">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const API_BASE = '/tl'

// ==================== 数据 ====================
const warehouses = ref([])
const smelters = ref([])
const categories = ref([])

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

// 建议结果
const suggestionText = ref('')
const suggestionLoading = ref(false)

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
  const c = categories.value.find(c => c.id === id)
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

const hasDemands = computed(() => {
  return Object.keys(smelterConfigs.value).length > 0
})

// ==================== 接口调用 ====================
// 接口1: 获取仓库列表
async function loadWarehouses() {
  try {
    const res = await fetch(`${API_BASE}/get_warehouses`)
    const data = await res.json()
    if (data.code === 200) {
      warehouses.value = data.data.map(w => ({ id: w['仓库id'], name: w['仓库名'] }))
    }
  } catch (err) {
    console.error('获取仓库失败', err)
  }
}

// 接口2: 获取冶炼厂列表
async function loadSmelters() {
  try {
    const res = await fetch(`${API_BASE}/get_smelters`)
    const data = await res.json()
    if (data.code === 200) {
      smelters.value = data.data.map(s => ({ id: s['冶炼厂id'], name: s['冶炼厂'] }))
    }
  } catch (err) {
    console.error('获取冶炼厂失败', err)
  }
}

// 接口3: 获取品类列表
async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/get_categories`)
    const data = await res.json()
    if (data.code === 200) {
      categories.value = data.data.map(c => ({ id: c['品类id'], name: c['品类名'] }))
    }
  } catch (err) {
    console.error('获取品类失败', err)
  }
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

// ==================== 获取采购建议 ====================
async function getSuggestions() {
  if (!selectedWarehouseIds.value.length) {
    alert('请选择仓库')
    return
  }
  
  const demands = []
  for (const smelterId of selectedSmelterIds.value) {
    const config = smelterConfigs.value[smelterId]
    if (config) {
      for (const [categoryId, demand] of Object.entries(config)) {
        demands.push({
          smelter_id: Number(smelterId),
          category_id: Number(categoryId),
          demand: demand
        })
      }
    }
  }
  
  if (demands.length === 0) {
    alert('请先配置需求')
    return
  }
  
  suggestionLoading.value = true
  
  try {
    // TODO: 需要后端提供采购建议接口
    // 接口地址: /tl/get_purchase_suggestion
    // 请求方式: POST
    // 请求体: { warehouse_ids: [101,102], demands: [{ smelter_id, category_id, demand }] }
    // 返回: { code: 200, data: { suggestion: "建议文字..." } }
    
    const res = await fetch(`${API_BASE}/get_purchase_suggestion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        warehouse_ids: selectedWarehouseIds.value,
        demands: demands
      })
    })
    const data = await res.json()
    if (data.code === 200) {
      suggestionText.value = data.data?.suggestion || '暂无建议'
    } else {
      alert(data.msg || '获取建议失败')
    }
  } catch (err) {
    alert('请求失败，请稍后重试')
  } finally {
    suggestionLoading.value = false
  }
}

onMounted(() => {
  loadWarehouses()
  loadSmelters()
  loadCategories()
})
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

/* 结果区域 */
.result-section {
  margin-top: 24px;
  border-top: 1px solid #e8e8e8;
  padding-top: 20px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}
.suggestion-text {
  background: #f5f5f5;
  padding: 16px 20px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  border-left: 4px solid #2e7d32;
}

/* 弹窗样式 */
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