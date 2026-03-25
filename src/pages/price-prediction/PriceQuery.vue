<template>
  <div class="price-query">
    <div class="card-header">比价查询</div>
    <div class="card-body">
      <div class="query-form">
        <div class="form-row">
          <div class="form-item">
            <label>选择仓库</label>
            <div class="multi-select" :class="{ open: warehouseOpen }">
              <div class="ms-trigger" @click.stop="toggleDropdown('warehouse')" ref="warehouseTrigger">
                <span v-if="queryParams.warehouseIds.length" class="ms-tags">
                  <span v-for="id in queryParams.warehouseIds" :key="id" class="ms-tag">
                    {{ warehouses.find(w => w.id === id)?.name }}
                    <i @click.stop="toggleId(queryParams.warehouseIds, id)">×</i>
                  </span>
                </span>
                <span v-else class="ms-placeholder">请选择仓库</span>
                <span class="ms-arrow">▾</span>
              </div>
              <Teleport to="body">
                <div v-if="warehouseOpen" class="ms-dropdown-portal" :style="dropdownStyle.warehouse" @click.stop>
                  <label v-for="w in warehouses" :key="w.id" class="ms-option">
                    <input type="checkbox" :value="w.id" v-model="queryParams.warehouseIds" />
                    {{ w.name }}
                  </label>
                  <div v-if="!warehouses.length" class="ms-empty">暂无数据</div>
                </div>
              </Teleport>
            </div>
          </div>
          <div class="form-item">
            <label>选择冶炼厂</label>
            <div class="multi-select" :class="{ open: smelterOpen }">
              <div class="ms-trigger" @click.stop="toggleDropdown('smelter')" ref="smelterTrigger">
                <span v-if="queryParams.smelterIds.length" class="ms-tags">
                  <span v-for="id in queryParams.smelterIds" :key="id" class="ms-tag">
                    {{ smelters.find(s => s.id === id)?.name }}
                    <i @click.stop="toggleId(queryParams.smelterIds, id)">×</i>
                  </span>
                </span>
                <span v-else class="ms-placeholder">请选择冶炼厂</span>
                <span class="ms-arrow">▾</span>
              </div>
              <Teleport to="body">
                <div v-if="smelterOpen" class="ms-dropdown-portal" :style="dropdownStyle.smelter" @click.stop>
                  <label v-for="s in smelters" :key="s.id" class="ms-option">
                    <input type="checkbox" :value="s.id" v-model="queryParams.smelterIds" />
                    {{ s.name }}
                  </label>
                  <div v-if="!smelters.length" class="ms-empty">暂无数据</div>
                </div>
              </Teleport>
            </div>
          </div>
          <div class="form-item">
            <label>选择品类</label>
            <div class="multi-select" :class="{ open: categoryOpen }">
              <div class="ms-trigger" @click.stop="toggleDropdown('category')" ref="categoryTrigger">
                <span v-if="queryParams.categoryIds.length" class="ms-tags">
                  <span v-for="id in queryParams.categoryIds" :key="id" class="ms-tag">
                    {{ masterCategories.find(c => c.id === id)?.name }}
                    <i @click.stop="toggleId(queryParams.categoryIds, id)">×</i>
                  </span>
                </span>
                <span v-else class="ms-placeholder">请选择品类</span>
                <span class="ms-arrow">▾</span>
              </div>
              <Teleport to="body">
                <div v-if="categoryOpen" class="ms-dropdown-portal" :style="dropdownStyle.category" @click.stop>
                  <label v-for="c in masterCategories" :key="c.id" class="ms-option">
                    <input type="checkbox" :value="c.id" v-model="queryParams.categoryIds" />
                    {{ c.name }}
                  </label>
                  <div v-if="!masterCategories.length" class="ms-empty">暂无数据</div>
                </div>
              </Teleport>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-primary" :disabled="queryLoading" @click="queryComparison">{{ queryLoading ? '查询中...' : '查询' }}</button>
          <button class="btn-outline" @click="resetQuery">重置</button>
        </div>
      </div>

      <div v-if="comparisonResults.length" class="result-section">
        <div class="result-header">比价结果</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>仓库</th>
              <th>冶炼厂</th>
              <th>品类</th>
              <th>报价(元/吨)</th>
              <th>运费(元/公里)</th>
              <th>每车利润(元) <button class="sort-btn" @click="toggleProfitSort">{{ profitSort === 'desc' ? '↓' : profitSort === 'asc' ? '↑' : '↕' }}</button></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in sortedResults" :key="idx">
              <td>{{ item.warehouse }}</td>
              <td>{{ item.smelter }}</td>
              <td>{{ item.category }}</td>
              <td class="price">{{ item.price != null ? item.price : '—' }}</td>
              <td class="price">{{ item.freight }}</td>
              <td class="total">{{ item.profit != null ? item.profit : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else-if="queried" class="empty-result">未查询到数据</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, nextTick } from 'vue'

const API_BASE = '/tl'
const TONS_PER_TRUCK = 35   // 每车吨数
const DISTANCE_KM = 1       // TODO: 距离(km)，待接口支持后替换

const warehouses = ref([])
const smelters = ref([])
const masterCategories = ref([])
const queryParams = ref({ warehouseIds: [], smelterIds: [], categoryIds: [] })
const comparisonResults = ref([])
const queryLoading = ref(false)
const queried = ref(false)
const profitSort = ref(null)

const warehouseOpen = ref(false)
const smelterOpen = ref(false)
const categoryOpen = ref(false)
const warehouseTrigger = ref(null)
const smelterTrigger = ref(null)
const categoryTrigger = ref(null)
const dropdownStyle = reactive({ warehouse: {}, smelter: {}, category: {} })

function calcStyle(triggerEl) {
  const r = triggerEl.getBoundingClientRect()
  return {
    position: 'fixed',
    top: r.bottom + 4 + 'px',
    left: r.left + 'px',
    width: r.width + 'px',
    zIndex: 9999,
  }
}

function toggleDropdown(name) {
  const triggerMap = { warehouse: warehouseTrigger, smelter: smelterTrigger, category: categoryTrigger }
  const openMap = { warehouse: warehouseOpen, smelter: smelterOpen, category: categoryOpen }
  const isOpen = openMap[name].value
  // 关闭其他
  warehouseOpen.value = false
  smelterOpen.value = false
  categoryOpen.value = false
  if (!isOpen) {
    nextTick(() => {
      const el = triggerMap[name].value
      if (el) dropdownStyle[name] = calcStyle(el)
    })
    openMap[name].value = true
  }
}

// 点击外部关闭
if (typeof window !== 'undefined') {
  window.addEventListener('click', () => {
    warehouseOpen.value = false
    smelterOpen.value = false
    categoryOpen.value = false
  })
}

function toggleId(arr, id) {
  const i = arr.indexOf(id)
  if (i === -1) arr.push(id)
  else arr.splice(i, 1)
}

const sortedResults = computed(() => {
  if (!profitSort.value) return comparisonResults.value
  return [...comparisonResults.value].sort((a, b) => {
    const pa = a.profit ?? -Infinity
    const pb = b.profit ?? -Infinity
    return profitSort.value === 'desc' ? pb - pa : pa - pb
  })
})

function toggleProfitSort() {
  if (profitSort.value === null) profitSort.value = 'desc'
  else if (profitSort.value === 'desc') profitSort.value = 'asc'
  else profitSort.value = null
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

function resetQuery() {
  queryParams.value = { warehouseIds: [], smelterIds: [], categoryIds: [] }
  comparisonResults.value = []
  queried.value = false
}

async function queryComparison() {
  if (!queryParams.value.warehouseIds.length) { alert('请选择仓库'); return }
  if (!queryParams.value.smelterIds.length) { alert('请选择冶炼厂'); return }
  if (!queryParams.value.categoryIds.length) { alert('请至少选择一个品类'); return }

  queryLoading.value = true
  queried.value = true

  try {
    const res = await fetch(`${API_BASE}/get_comparison`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        '选中仓库id列表': queryParams.value.warehouseIds,
        '冶炼厂id列表': queryParams.value.smelterIds,
        '品类id列表': queryParams.value.categoryIds
      })
    })
    const data = await res.json()
    if (data.code === 200 && data.data && data.data.length) {
      comparisonResults.value = data.data.map(item => {
        const price = item['报价'] ?? null
        const freight = item['运费'] || 0
        // 每车利润 = 报价 × 每车吨数 - 运费(元/公里) × 距离
        const profit = price != null ? price * TONS_PER_TRUCK - freight * DISTANCE_KM : null
        return {
          warehouse: item['仓库'],
          smelter: item['冶炼厂'],
          category: item['品类'],
          price,
          freight,
          profit
        }
      })
    } else {
      comparisonResults.value = []
    }
  } catch (err) {
    alert('查询失败')
  } finally {
    queryLoading.value = false
  }
}

onMounted(() => {
  loadWarehouses()
  loadSmelters()
  loadMasterCategories()
})
</script>

<style scoped>
.price-query {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
  font-weight: 600;
}
.card-body {
  padding: 24px;
}
.query-form {
  margin-bottom: 24px;
}
.form-row {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.form-item {
  flex: 1;
  min-width: 200px;
}
.form-item label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}
.multi-select {
  position: relative;
  width: 100%;
  user-select: none;
}
.ms-trigger {
  display: flex;
  align-items: center;
  min-height: 38px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  gap: 4px;
  flex-wrap: wrap;
}
.multi-select.open .ms-trigger { border-color: #2e7d32; }
.ms-placeholder { color: #aaa; font-size: 14px; flex: 1; }
.ms-arrow { margin-left: auto; color: #888; font-size: 12px; flex-shrink: 0; }
.ms-tags { display: flex; flex-wrap: wrap; gap: 4px; flex: 1; }
.ms-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
}
.ms-tag i { cursor: pointer; font-style: normal; font-weight: bold; }
.ms-tag i:hover { color: #c62828; }
.ms-dropdown-portal {
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,.12);
  max-height: 220px;
  overflow-y: auto;
  padding: 4px 0;
}
.ms-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
}
.ms-option:hover { background: #f5f5f5; }
.ms-option input { width: 15px; height: 15px; cursor: pointer; flex-shrink: 0; }
.ms-empty { padding: 10px 14px; color: #999; font-size: 13px; }
.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}
.result-section {
  margin-top: 24px;
  border-top: 1px solid #e8e8e8;
  padding-top: 20px;
}
.result-header {
  font-weight: 600;
  margin-bottom: 16px;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}
.data-table th,
.data-table td {
  padding: 12px 20px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
  border-right: 1px solid #e8e8e8;
}
.data-table th:last-child,
.data-table td:last-child {
  border-right: none;
}
.data-table tr:last-child td {
  border-bottom: none;
}
.data-table th {
  background: #fafafa;
  font-weight: 500;
}
.price {
  color: #2e7d32;
  font-weight: 500;
}
.total {
  color: #f57c00;
  font-weight: 600;
}
.sort-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  padding: 0 2px;
  color: #555;
}
.sort-btn:hover { color: #2e7d32; }
.empty-result {
  text-align: center;
  padding: 40px;
  color: #999;
}
.btn-primary {
  background: #2e7d32;
  border: none;
  padding: 8px 28px;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-outline {
  background: #fff;
  border: 1px solid #d9d9d9;
  padding: 7px 27px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-outline:hover {
  border-color: #2e7d32;
  color: #2e7d32;
}
</style>