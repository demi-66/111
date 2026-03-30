<template>
  <!-- 查询页面 -->
  <div v-if="!showResult" class="price-query">
    <div class="query-card">
      <div class="card-header">
        <h2>价格查询</h2>
        <p class="subtitle">选择仓库、冶炼厂和品类进行比价分析</p>
      </div>

      <div class="card-body">
        <div class="query-section">
          <div class="section-header">
            <span class="section-dot"></span>
            <span class="section-title">查询条件</span>
          </div>

          <div class="form-row two-cols">
            <div class="form-item">
              <label>仓库</label>
              <div class="select-box" @click="openWarehouseModal">
                <div class="selected-items">
                  <span v-if="selectedWarehouseIds.length" class="selected-tag-wrapper">
                    <span v-for="id in selectedWarehouseIds" :key="id" class="selected-tag">
                      {{ getWarehouseName(id) }}
                      <button class="tag-remove" @click.stop="removeWarehouse(id)">×</button>
                    </span>
                  </span>
                  <span v-else class="placeholder">请选择仓库</span>
                </div>
              </div>
            </div>
            <div class="form-item">
              <label>冶炼厂</label>
              <div class="select-box" @click="openSmelterModal">
                <div class="selected-items">
                  <span v-if="selectedSmelterIds.length" class="selected-tag-wrapper">
                    <span v-for="id in selectedSmelterIds" :key="id" class="selected-tag">
                      {{ getSmelterName(id) }}
                      <button class="tag-remove" @click.stop="removeSmelter(id)">×</button>
                    </span>
                  </span>
                  <span v-else class="placeholder">请选择冶炼厂</span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-row two-cols">
            <div class="form-item">
              <label>品类</label>
              <div class="select-box" @click="openCategoryModal">
                <div class="selected-items">
                  <span v-if="selectedCategoryIds.length" class="selected-tag-wrapper">
                    <span v-for="id in selectedCategoryIds" :key="id" class="selected-tag category-tag">
                      {{ getCategoryName(id) }}
                    </span>
                  </span>
                  <span v-else class="placeholder">请选择品类</span>
                </div>
              </div>
            </div>
            <div class="form-item">
              <label>价格类型</label>
              <div class="price-type-wrapper">
                <select v-model="selectedPriceType" class="price-type-select">
                  <option :value="null">普通价（不含税）</option>
                  <option value="1pct">含1%增值税</option>
                  <option value="3pct">含3%增值税</option>
                  <option value="13pct">含13%增值税</option>
                  <option value="normal_invoice">普通发票价</option>
                  <option value="reverse_invoice">反向发票价</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-primary" :disabled="queryLoading" @click="queryComparison">
              <span class="btn-icon"></span>
              {{ queryLoading ? '查询中...' : '查询' }}
            </button>
            <button class="btn-outline" @click="resetQuery">
              <span class="btn-icon"></span>
              重置
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗：选择仓库 -->
    <teleport to="body">
      <div v-if="warehouseModalVisible" class="modal-overlay" @click.self="closeWarehouseModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3>选择仓库</h3>
            <button class="close" @click="closeWarehouseModal">×</button>
          </div>
          <div class="modal-body">
            <input v-model="warehouseSearch" type="text" placeholder="搜索仓库..." class="search-input" />
            <div class="checkbox-group">
              <label v-for="w in filteredWarehouses" :key="w.id" class="checkbox-item">
                <input type="checkbox" :value="w.id" v-model="tempSelectedWarehouseIds" />
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

    <!-- 弹窗：选择冶炼厂 -->
    <teleport to="body">
      <div v-if="smelterModalVisible" class="modal-overlay" @click.self="closeSmelterModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3>选择冶炼厂</h3>
            <button class="close" @click="closeSmelterModal">×</button>
          </div>
          <div class="modal-body">
            <input v-model="smelterSearch" type="text" placeholder="搜索冶炼厂..." class="search-input" />
            <div class="checkbox-group">
              <label v-for="s in filteredSmelters" :key="s.id" class="checkbox-item">
                <input type="checkbox" :value="s.id" v-model="tempSelectedSmelterIds" />
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

    <!-- 弹窗：选择品类 -->
    <teleport to="body">
      <div v-if="categoryModalVisible" class="modal-overlay" @click.self="closeCategoryModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3>选择品类</h3>
            <button class="close" @click="closeCategoryModal">×</button>
          </div>
          <div class="modal-body">
            <input v-model="categorySearch" type="text" placeholder="搜索品类..." class="search-input" />
            <div class="checkbox-group">
              <label v-for="c in filteredCategories" :key="c.id" class="checkbox-item">
                <input type="checkbox" :value="c.id" v-model="tempSelectedCategoryIds" />
                {{ c.name }}
              </label>
              <div v-if="!filteredCategories.length" class="empty-hint">暂无数据</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-modal" @click="closeCategoryModal">取消</button>
            <button class="btn-modal btn-primary-modal" @click="confirmCategorySelection">确定</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>

  <!-- 结果页面 -->
  <div v-else class="result-page">
    <div class="result-card">
      <div class="result-header">
        <h2>价格查询</h2>
      </div>
      <div class="result-body">
        <div class="result-content">
          <div class="result-label">查询结果（共 {{ resultRows.length }} 条）</div>
          <div class="table-scroll">
            <table class="result-table">
              <thead>
                <tr>
                  <th>仓库</th>
                  <th>冶炼厂</th>
                  <th>品类</th>
                  <th>价格类型</th>
                  <th>运费(元/吨)</th>
                  <th>报价(元/吨)</th>
                  <th>报价来源</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in resultRows" :key="i" :class="{ unavailable: row['报价来源'] === 'unavailable' }">
                  <td>{{ row['仓库'] }}</td>
                  <td>{{ row['冶炼厂'] }}</td>
                  <td>{{ row['品类'] }}</td>
                  <td>{{ row['price_type'] }}</td>
                  <td>{{ row['运费'] ?? '—' }}</td>
                  <td>{{ row['报价'] != null ? row['报价'] : '—' }}</td>
                  <td>
                    <span class="source-badge" :class="row['报价来源']">{{ row['报价来源'] }}</span>
                  </td>
                </tr>
                <tr v-if="!resultRows.length">
                  <td colspan="7" class="empty-hint">暂无数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <button class="btn-back" @click="backToQuery">返回查询</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const API_BASE = '/tl'

// 页面状态
const showResult = ref(false)
const resultRows = ref([])

// 数据
const warehouses = ref([])
const smelters = ref([])
const masterCategories = ref([])

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

// 品类
const categoryModalVisible = ref(false)
const categorySearch = ref('')
const tempSelectedCategoryIds = ref([])
const selectedCategoryIds = ref([])

// 查询状态
const queryLoading = ref(false)

// 价格类型
const selectedPriceType = ref(null)

// 过滤
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

const filteredCategories = computed(() => {
  if (!categorySearch.value) return masterCategories.value
  return masterCategories.value.filter(c => 
    c.name.toLowerCase().includes(categorySearch.value.toLowerCase())
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
  const c = masterCategories.value.find(c => c.id === id)
  return c ? c.name : ''
}

function removeWarehouse(id) {
  selectedWarehouseIds.value = selectedWarehouseIds.value.filter(i => i !== id)
}
function removeSmelter(id) {
  selectedSmelterIds.value = selectedSmelterIds.value.filter(i => i !== id)
}

// 仓库弹窗
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

// 冶炼厂弹窗
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

// 品类弹窗
function openCategoryModal() {
  tempSelectedCategoryIds.value = [...selectedCategoryIds.value]
  categorySearch.value = ''
  categoryModalVisible.value = true
}
function closeCategoryModal() {
  categoryModalVisible.value = false
}
function confirmCategorySelection() {
  selectedCategoryIds.value = [...tempSelectedCategoryIds.value]
  closeCategoryModal()
}

function resetQuery() {
  selectedWarehouseIds.value = []
  selectedSmelterIds.value = []
  selectedCategoryIds.value = []
  selectedPriceType.value = null
}

function backToQuery() {
  showResult.value = false
  resultSuggestion.value = ''
}

async function queryComparison() {
  if (!selectedWarehouseIds.value.length) {
    alert('请选择仓库')
    return
  }
  if (!selectedSmelterIds.value.length) {
    alert('请选择冶炼厂')
    return
  }
  if (!selectedCategoryIds.value.length) {
    alert('请至少选择一个品类')
    return
  }

  queryLoading.value = true

  try {
    const res = await fetch(`${API_BASE}/get_comparison`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        '选中仓库id列表': selectedWarehouseIds.value,
        '冶炼厂id列表': selectedSmelterIds.value,
        '品类id列表': selectedCategoryIds.value,
        'price_type': selectedPriceType.value
      })
    })
    const data = await res.json()
    if (data.code === 200 && data.data) {
      resultRows.value = data.data
      showResult.value = true
    } else {
      alert(data.msg || '查询失败')
    }
  } catch (err) {
    alert('查询失败，请稍后重试')
  } finally {
    queryLoading.value = false
  }
}

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
async function loadMasterCategories() {
  try {
    const res = await fetch(`${API_BASE}/get_categories`)
    const data = await res.json()
    if (data.code === 200) {
      masterCategories.value = data.data.map(c => ({ id: c['品类id'], name: c['品类名'] }))
    }
  } catch (err) {
    console.error('获取品类总表失败', err)
  }
}

onMounted(() => {
  loadWarehouses()
  loadSmelters()
  loadMasterCategories()
})
</script>

<style scoped>
/* 查询页面样式 */
.price-query {
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
  height: 75vh;  /* 改为75vh */
  overflow: hidden;
  margin-top: -70px;  /* 上挪30px，整体上移 */
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
}

.query-section {
  background: #f8fafc;
  border-radius: 24px;
  height: 100%;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
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

.form-row {
  margin-bottom: 16px;
  flex-shrink: 0;
}
.form-row.two-cols {
  display: flex;
  gap: 24px;
}
.form-row.two-cols .form-item {
  flex: 1;
}
.form-item label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
}

.select-box {
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
.selected-items {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 28px;
}
.selected-tag-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #e8f5e9;
  color: #2e7d32;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
}
.category-tag {
  background: #e3f2fd;
  color: #1976d2;
}
.tag-remove {
  background: none;
  border: none;
  color: #9e9e9e;
  cursor: pointer;
  font-size: 12px;
  padding: 0 2px;
}
.tag-remove:hover {
  color: #e53935;
}
.placeholder {
  color: #a0aec0;
  font-size: 13px;
}
.price-type-wrapper {
  width: 100%;
}
.price-type-select {
  width: 100%;
  padding: 8px 6px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  background: #fff;
  cursor: pointer;
  min-height: 44px;
}
.price-type-select:focus {
  outline: none;
  border-color: #2e7d32;
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
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

/* 弹窗样式 - 与采购建议页面保持一致 */
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
  max-width: 500px;
  width: 90%;
  max-height: 70vh;
  min-height: 400px;
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
  padding: 10px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 18px;
}
.checkbox-group-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 8px;
}
.checkbox-group-modal::-webkit-scrollbar {
  width: 6px;
}
.checkbox-group-modal::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 3px;
}
.checkbox-group-modal::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border-radius: 3px;
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
.empty-hint {
  padding: 20px;
  text-align: center;
  color: #a0aec0;
}

/* 结果页面样式 */
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
  max-width: 1100px;
  margin: 0 auto;
  overflow: hidden;
}
.result-header {
  padding: 28px 44px;
  background: linear-gradient(135deg, #f8f9fc 0%, #fff 100%);
  border-bottom: 1px solid #e8ecef;
}
.result-header h2 {
  font-size: 32px;
  font-weight: 600;
  color: #1a2c3e;
  margin: 0;
}
.result-body {
  padding: 36px 44px;
}
.result-content {
  background: #f8fafc;
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 28px;
}
.result-label {
  font-size: 15px;
  font-weight: 500;
  color: #2e7d32;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}
.result-text {
  font-size: 16px;
  line-height: 1.6;
  color: #2c3e50;
  white-space: pre-wrap;
}
.table-scroll {
  overflow-x: auto;
}
.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.result-table th,
.result-table td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}
.result-table th {
  background: #f0f4f8;
  font-weight: 600;
  color: #2c3e50;
}
.result-table tr.unavailable td {
  color: #aaa;
}
.source-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  background: #f0f4f8;
  color: #555;
}
.source-badge.direct {
  background: #e8f5e9;
  color: #2e7d32;
}
.source-badge.unavailable {
  background: #fff0f0;
  color: #e53935;
}
.empty-hint {
  text-align: center;
  padding: 24px;
  color: #a0aec0;
}
.btn-back {
  display: block;
  width: 160px;
  margin: 0 auto;
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
</style>