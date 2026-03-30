<template>
  <div v-if="!showResult" class="purchase-suggestion">
    <div class="query-card">
      <div class="card-header">
        <h2>采购建议</h2>
        <p class="subtitle">选择仓库、冶炼厂，配置需求后获取采购建议</p>
      </div>

      <div class="card-body">
        <div class="query-section">
          <div class="section-header">
            <span class="section-dot"></span>
            <span class="section-title">查询条件</span>
          </div>

          <div class="select-row">
            <div class="select-label required">仓库：</div>
            <div class="select-box" @click="openWarehouseModal">
              <span v-if="!selectedWarehouseIds.length" class="select-placeholder">点击选择仓库</span>
              <span v-else class="select-value">已选择 {{ selectedWarehouseIds.length }} 个仓库</span>
            </div>
          </div>
          <div v-if="selectedWarehouseIds.length" class="tags-area">
            <span v-for="id in selectedWarehouseIds" :key="id" class="tag">
              {{ getWarehouseName(id) }}
              <button class="tag-remove" @click.stop="removeWarehouse(id)">×</button>
            </span>
          </div>

          <div class="select-row">
            <div class="select-label required">价格类型：</div>
            <select v-model="selectedPriceType" class="price-type-select">
              <option :value="null">普通价（不含税）</option>
              <option value="1pct">含1%增值税</option>
              <option value="3pct">含3%增值税</option>
              <option value="13pct">含13%增值税</option>
              <option value="normal_invoice">普通发票价</option>
              <option value="reverse_invoice">反向发票价</option>
            </select>
          </div>

          <div class="select-row">
            <div class="select-label required">冶炼厂：</div>
            <div class="select-box" @click="openSmelterModal">
              <span v-if="!selectedSmelterIds.length" class="select-placeholder">点击选择冶炼厂</span>
              <span v-else class="select-value">已选择 {{ selectedSmelterIds.length }} 个冶炼厂</span>
            </div>
          </div>
          <div v-if="selectedSmelterIds.length" class="smelter-list">
            <div v-for="id in selectedSmelterIds" :key="id" class="smelter-item">
              <div class="smelter-info">
                <span class="smelter-name">{{ getSmelterName(id) }}</span>
                <span class="config-status" :class="getSmelterConfig(id).length ? 'configured' : 'unconfigured'">
                  {{ getSmelterConfig(id).length ? getSmelterConfig(id).length + '个品类' : '未配置' }}
                </span>
              </div>
              <button class="btn-config" @click="configureSmelter(id)">配置</button>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-primary" :disabled="!hasDemands || suggestionLoading" @click="openSummaryModal">
              <span class="btn-icon"></span>
              {{ suggestionLoading ? '计算中...' : '获取采购建议' }}
            </button>
            <button class="btn-outline" @click="resetAll">
              <span class="btn-icon"></span>
              重置
            </button>
          </div>
        </div>
      </div>
    </div>

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
                  <div v-for="(item, idx) in getSmelterConfig(smelterId)" :key="idx" class="summary-category-item">
                    {{ item.categoryName }}: {{ item.demand }}吨
                  </div>
                  <div v-if="!getSmelterConfig(smelterId).length" class="empty-config">
                    未配置
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-modal" @click="closeSummaryModal">取消</button>
            <button class="btn-modal btn-primary-modal" @click="confirmAndGetSuggestions">确定</button>
          </div>
        </div>
      </div>
    </teleport>

    <teleport to="body">
      <div v-if="warehouseModalVisible" class="modal-overlay" @click.self="closeWarehouseModal">
        <div class="modal-container modal-large">
          <div class="modal-header">
            <h3>选择仓库</h3>
            <button class="close" @click="closeWarehouseModal">×</button>
          </div>
          <div class="modal-body">
            <input v-model="warehouseSearch" type="text" placeholder="搜索仓库..." class="search-input">
            <div class="checkbox-group-modal">
              <label v-for="w in filteredWarehouses" :key="w.id" class="checkbox-item">
                <input type="checkbox" :value="w.id" v-model="tempSelectedWarehouseIds">
                {{ w.name }}
              </label>
              <div v-if="!filteredWarehouses.length" class="empty-hint">暂无数据</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-modal" @click="closeWarehouseModal">取消</button>
            <button class="btn-modal btn-primary-modal" @click="confirmWarehouseSelection">确定</button>
          </div>
        </div>
      </div>
    </teleport>

    <teleport to="body">
      <div v-if="smelterModalVisible" class="modal-overlay" @click.self="closeSmelterModal">
        <div class="modal-container modal-large">
          <div class="modal-header">
            <h3>选择冶炼厂</h3>
            <button class="close" @click="closeSmelterModal">×</button>
          </div>
          <div class="modal-body">
            <input v-model="smelterSearch" type="text" placeholder="搜索冶炼厂..." class="search-input">
            <div class="checkbox-group-modal">
              <label v-for="s in filteredSmelters" :key="s.id" class="checkbox-item">
                <input type="checkbox" :value="s.id" v-model="tempSelectedSmelterIds">
                {{ s.name }}
              </label>
              <div v-if="!filteredSmelters.length" class="empty-hint">暂无数据</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-modal" @click="closeSmelterModal">取消</button>
            <button class="btn-modal btn-primary-modal" @click="confirmSmelterSelection">确定</button>
          </div>
        </div>
      </div>
    </teleport>

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
                <label v-for="c in categories" :key="c.id" class="checkbox-item">
                  <input type="checkbox" :value="c.id" v-model="tempCategoryIds">
                  {{ c.name }}
                </label>
              </div>
            </div>
            <div v-if="tempCategoryIds.length" class="demand-input-section">
              <div class="section-subtitle">需求吨数</div>
              <div class="demand-input-list">
                <div v-for="catId in tempCategoryIds" :key="catId" class="demand-input-item">
                  <span class="category-name">{{ getCategoryName(catId) }}</span>
                  <input v-model.number="tempDemands[catId]" type="number" step="0.01" min="0" placeholder="请输入吨数" class="demand-input">
                  <span class="unit">吨</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-modal" @click="closeConfigModal">取消</button>
            <button class="btn-modal btn-primary-modal" @click="saveConfig">确定</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>

  <div v-else class="result-page">
    <div class="result-card">
      <div class="result-header">
        <h2>采购建议</h2>
      </div>
      <div class="result-body">
        <div class="result-content">
          <div class="result-text">{{ suggestionText }}</div>
        </div>
        <button class="btn-back" @click="backToQuery">返回查询</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const API_BASE = '/tl'

const showResult = ref(false)
const summaryModalVisible = ref(false)

const warehouses = ref([])
const smelters = ref([])
const categories = ref([])

const warehouseModalVisible = ref(false)
const warehouseSearch = ref('')
const tempSelectedWarehouseIds = ref([])
const selectedWarehouseIds = ref([])

const smelterModalVisible = ref(false)
const smelterSearch = ref('')
const tempSelectedSmelterIds = ref([])
const selectedSmelterIds = ref([])

const smelterConfigs = ref({})

const configModalVisible = ref(false)
const currentSmelter = ref(null)
const tempCategoryIds = ref([])
const tempDemands = ref({})

const suggestionText = ref('')
const suggestionLoading = ref(false)
const selectedPriceType = ref(null)

// 计算过滤后的仓库列表
const filteredWarehouses = computed(() => {
  if (!warehouseSearch.value) return warehouses.value
  return warehouses.value.filter(w => 
    w.name.toLowerCase().includes(warehouseSearch.value.toLowerCase())
  )
})

// 计算过滤后的冶炼厂列表
const filteredSmelters = computed(() => {
  if (!smelterSearch.value) return smelters.value
  return smelters.value.filter(s => 
    s.name.toLowerCase().includes(smelterSearch.value.toLowerCase())
  )
})

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
  return selectedSmelterIds.value.some(id => {
    const config = smelterConfigs.value[id]
    return config && Object.keys(config).length > 0
  })
})

// 获取仓库列表
async function fetchWarehouses() {
  try {
    const res = await fetch(`${API_BASE}/get_warehouses`)
    const data = await res.json()
    if (data.code === 200) {
      warehouses.value = data.data.map(item => ({
        id: item['仓库id'],
        name: item['仓库名']
      }))
    }
  } catch (err) {
    console.error('获取仓库列表失败:', err)
  }
}

// 获取冶炼厂列表
async function fetchSmelters() {
  try {
    const res = await fetch(`${API_BASE}/get_smelters`)
    const data = await res.json()
    if (data.code === 200) {
      smelters.value = data.data.map(item => ({
        id: item['冶炼厂id'],
        name: item['冶炼厂']
      }))
    }
  } catch (err) {
    console.error('获取冶炼厂列表失败:', err)
  }
}

// 获取品类列表
async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/get_categories`)
    const data = await res.json()
    if (data.code === 200) {
      categories.value = data.data.map(item => ({
        id: item['品类id'],
        name: item['品类名']
      }))
    }
  } catch (err) {
    console.error('获取品类列表失败:', err)
  }
}

function backToQuery() {
  showResult.value = false
}

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

async function confirmAndGetSuggestions() {
  closeSummaryModal()
  await getSuggestions()
}

function openWarehouseModal() {
  tempSelectedWarehouseIds.value = [...selectedWarehouseIds.value]
  warehouseSearch.value = ''
  warehouseModalVisible.value = true
}

function closeWarehouseModal() {
  warehouseModalVisible.value = false
}

function confirmWarehouseSelection() {
  selectedWarehouseIds.value = [...tempSelectedWarehouseIds.value]
  closeWarehouseModal()
}

function removeWarehouse(id) {
  selectedWarehouseIds.value = selectedWarehouseIds.value.filter(i => i !== id)
}

function openSmelterModal() {
  tempSelectedSmelterIds.value = [...selectedSmelterIds.value]
  smelterSearch.value = ''
  smelterModalVisible.value = true
}

function closeSmelterModal() {
  smelterModalVisible.value = false
}

function confirmSmelterSelection() {
  selectedSmelterIds.value = [...tempSelectedSmelterIds.value]
  closeSmelterModal()
}

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

function resetAll() {
  selectedWarehouseIds.value = []
  selectedSmelterIds.value = []
  smelterConfigs.value = {}
  selectedPriceType.value = null
}

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
    const res = await fetch(`${API_BASE}/get_purchase_suggestion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        warehouse_ids: selectedWarehouseIds.value,
        demands: demands,
        price_type: selectedPriceType.value
      })
    })
    const data = await res.json()
    if (data.code === 200) {
      // 直接使用后端返回的文本内容，不做任何包装
      suggestionText.value = data.data?.suggestion || '暂无建议'
      showResult.value = true
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
  fetchWarehouses()
  fetchSmelters()
  fetchCategories()
})
</script>

<style scoped>
.purchase-suggestion {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px;
  background: #f5f7fa;
}
.query-card {
  background: #fff;
  border-radius: 28px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  height: 75vh;
  overflow: hidden;
  margin-top: -70px;
}
.card-header {
  padding: 28px 44px;
  background: linear-gradient(135deg, #f8f9fc 0%, #fff 100%);
  border-bottom: 1px solid #e8ecef;
  flex-shrink: 0;
}
.card-header h2 {
  font-size: 32px;
  font-weight: 600;
  color: #1a2c3e;
  margin: 0 0 8px 0;
}
.card-header .subtitle {
  font-size: 16px;
  color: #7f8c8d;
  margin: 0;
}
.card-body {
  flex: 1;
  padding: 15px;
  box-sizing: border-box;
  min-height: 0;
  overflow: hidden;
}
.query-section {
  background: #f8fafc;
  border-radius: 24px;
  padding: 20px 24px;
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  height: calc(100% - 40px);
  overflow: hidden;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.section-dot {
  width: 4px;
  height: 18px;
  background: #2e7d32;
  border-radius: 2px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}
.select-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.select-label {
  width: 70px;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
}
.select-label.required::after {
  content: '*';
  color: #ff4d4f;
  margin-left: 4px;
}
.select-box {
  width: 220px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  min-height: 44px;
  padding: 8px 6px;
}
.select-box:hover {
  border-color: #2e7d32;
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
}
.select-placeholder {
  color: #a0aec0;
  font-size: 13px;
}
.select-value {
  color: #2e7d32;
  font-size: 13px;
  font-weight: 500;
}
.price-type-select {
  width: 220px;
  padding: 8px 6px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  min-height: 44px;
  font-size: 13px;
}
.price-type-select:focus {
  outline: none;
  border-color: #2e7d32;
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
}
.tags-area {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  margin-left: 70px;
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
}
.tag-remove {
  background: none;
  border: none;
  color: #9e9e9e;
  cursor: pointer;
  font-size: 14px;
  padding: 0 2px;
}
.tag-remove:hover {
  color: #e53935;
}
.smelter-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  margin-left: 70px;
  max-height: 200px;
  overflow-y: auto;
}
.smelter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}
.smelter-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}
.smelter-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.config-status {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 20px;
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
  padding: 4px 14px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}
.btn-config:hover {
  background: #1b5e20;
}
.form-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: auto;
  padding-top: 16px;
  flex-shrink: 0;
}
.btn-primary {
  background: #2e7d32;
  border: none;
  padding: 8px 28px;
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-primary:hover {
  background: #1b5e20;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-outline {
  background: #fff;
  border: 1px solid #e2e8f0;
  padding: 7px 27px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-outline:hover {
  border-color: #2e7d32;
  color: #2e7d32;
  background: #f8fafc;
}
.btn-icon {
  font-size: 14px;
}
.summary-modal {
  max-width: 560px;
}
.summary-body {
  max-height: 65vh;
  overflow-y: auto;
}
.summary-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.summary-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
}
.summary-smelter-name {
  font-weight: 600;
  font-size: 14px;
  color: #2e7d32;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e2e8f0;
}
.summary-categories {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  max-height: 80px;
  overflow-y: auto;
}
.summary-category-item {
  font-size: 13px;
  color: #333;
  padding: 4px 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}
.empty-config {
  font-size: 12px;
  color: #999;
  padding: 4px 8px;
  text-align: center;
}
.result-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px;
  background: #f5f7fa;
}
.result-card {
  background: #fff;
  border-radius: 28px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  overflow: hidden;
  height: 75vh;
  display: flex;
  flex-direction: column;
  margin-top: -70px;
}
.result-header {
  padding: 28px 44px;
  background: linear-gradient(135deg, #f8f9fc 0%, #fff 100%);
  border-bottom: 1px solid #e8ecef;
  flex-shrink: 0;
}
.result-header h2 {
  font-size: 32px;
  font-weight: 600;
  color: #1a2c3e;
  margin: 0;
}
.result-body {
  flex: 1;
  padding: 36px 44px;
  overflow-y: auto;
}
.result-content {
  background: #f8fafc;
  border-radius: 20px;
  padding: 28px;
}
.result-text {
  font-size: 16px;
  line-height: 1.6;
  color: #2c3e50;
  white-space: pre-wrap;
}
.btn-back {
  display: block;
  width: 160px;
  margin: 24px auto 0;
  background: #2e7d32;
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}
.btn-back:hover {
  background: #1b5e20;
}
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
  border-radius: 20px;
  width: 90%;
  max-width: 520px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
.modal-container.modal-large {
  max-width: 560px;
}
.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.modal-header .close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #a0aec0;
}
.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.search-input {
  width: 100%;
  padding: 10px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}
.checkbox-group-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
}
.checkbox-item:hover {
  background: #f8fafc;
}
.checkbox-item input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.demand-input-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}
.demand-input-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.demand-input-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.category-name {
  width: 70px;
  font-size: 14px;
  font-weight: 500;
}
.demand-input {
  width: 150px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}
.unit {
  font-size: 12px;
  color: #a0aec0;
}
.btn-modal {
  padding: 8px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
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
.empty-hint {
  padding: 20px;
  text-align: center;
  color: #a0aec0;
}
.section-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 12px;
}
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 200px;
  overflow-y: auto;
}
</style>