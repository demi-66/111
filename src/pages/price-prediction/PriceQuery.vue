<template>
  <div class="price-query">
    <div class="card-header">比价查询</div>
    <div class="card-body">
      <div class="query-form">
        <div class="form-row">
          <div class="form-item">
            <label>选择仓库</label>
            <select v-model="queryParams.warehouseId">
              <option value="">请选择仓库</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div class="form-item">
            <label>选择冶炼厂</label>
            <select v-model="queryParams.smelterId" @change="onSmelterChange">
              <option value="">请选择冶炼厂</option>
              <option v-for="s in smelters" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="form-item">
            <label>选择品类（可多选）</label>
            <div class="checkbox-group">
              <label v-for="c in masterCategories" :key="c.id" class="checkbox-label">
                <input type="checkbox" :value="c.id" v-model="queryParams.categoryIds" />
                {{ c.name }}
              </label>
              <div v-if="!masterCategories.length" class="empty-hint">暂无品类数据</div>
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
           
              <th>仓库</th>
              <th>冶炼厂</th>
              <th>品类</th>
              <th>价格(元/吨)</th>
              <th>运费(元/吨)</th>
              <th>总成本(元/吨)</th>
            </thead>
          <tbody>
            <tr v-for="(item, idx) in comparisonResults" :key="idx">
              <td>{{ item.warehouse }}</td>
              <td>{{ item.smelter }}</td>
              <td>{{ item.category }}</td>
              <td class="price">{{ item.price }}</td>
              <td class="price">{{ item.freight }}</td>
              <td class="total">{{ item.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else-if="queried" class="empty-result">未查询到数据</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = '/tl'

const warehouses = ref([])
const smelters = ref([])
const masterCategories = ref([])
const queryParams = ref({ warehouseId: '', smelterId: '', categoryIds: [] })
const comparisonResults = ref([])
const queryLoading = ref(false)
const queried = ref(false)

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

function onSmelterChange() {
  queryParams.value.categoryIds = []
  comparisonResults.value = []
  queried.value = false
}

function resetQuery() {
  queryParams.value = { warehouseId: '', smelterId: '', categoryIds: [] }
  comparisonResults.value = []
  queried.value = false
}

async function queryComparison() {
  if (!queryParams.value.warehouseId) {
    alert('请选择仓库')
    return
  }
  if (!queryParams.value.smelterId) {
    alert('请选择冶炼厂')
    return
  }
  if (queryParams.value.categoryIds.length === 0) {
    alert('请至少选择一个品类')
    return
  }

  queryLoading.value = true
  queried.value = true

  try {
    const res = await fetch(`${API_BASE}/get_comparison`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        '选中仓库id列表': [queryParams.value.warehouseId],
        '冶炼厂id列表': [queryParams.value.smelterId],
        '品类id列表': queryParams.value.categoryIds
      })
    })
    const data = await res.json()
    if (data.code === 200 && data.data && data.data.length) {
      comparisonResults.value = data.data.map(item => ({
        warehouse: item.仓库,
        smelter: item.冶炼厂,
        category: item.品类,
        price: item.价格 || 0,
        freight: item.运费列表 || 0,
        total: (item.价格 || 0) + (item.运费列表 || 0)
      }))
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
.form-item select {
  width: 100%;
  padding: 8px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
}
.checkbox-group {
  padding: 8px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  min-height: 44px;
  background: #fff;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}
.checkbox-label input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.empty-hint {
  color: #999;
  font-size: 13px;
}
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