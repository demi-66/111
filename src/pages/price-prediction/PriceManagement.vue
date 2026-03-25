<template>
  <div class="price-management">
    <div class="card-header">
      <span>价格录入</span>
      <button class="btn-mapping" @click="openMappingModal">品类映射表</button>
    </div>
    <div class="card-body">

      <!-- 图片上传区域 -->
      <div class="form-row">
        <div class="form-label required">价格表图片</div>
        <div class="form-control">
          <div class="upload-controls">
            <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/bmp,image/webp" multiple class="hidden-input" @change="onFilesSelected" />
            <button class="btn-outline" @click="fileInput?.click()">📷 添加图片</button>
            <span v-if="selectedFiles.length" class="file-name">已选 {{ selectedFiles.length }} 张</span>
            <button class="btn-primary" :disabled="!selectedFiles.length || recognizeLoading" @click="recognizePriceTable">
              <span v-if="recognizeLoading" class="spinner-sm"></span>识别
            </button>
            <button v-if="selectedFiles.length" class="btn-outline" @click="clearFiles">清除全部</button>
            <span v-if="recognizeError" class="error-msg">{{ recognizeError }}</span>
          </div>
          <!-- 图片预览列表 -->
          <div v-if="previewUrls.length" class="image-preview-list">
            <div v-for="(url, i) in previewUrls" :key="url" class="preview-item">
              <img :src="url" :alt="selectedFiles[i]?.name" />
              <span class="preview-name">{{ selectedFiles[i]?.name }}</span>
              <button class="btn-remove-img" @click="removeFile(i)">×</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 识别结果：每个冶炼厂一个确认卡片 -->
      <div v-if="recognizedDetails.length" class="section">
        <div class="section-header">
          <span>识别结果确认（共 {{ recognizedDetails.length }} 家冶炼厂）</span>
          <button class="btn-primary" :disabled="saveLoading" @click="saveAllData">
            <span v-if="saveLoading" class="spinner-sm"></span>全部提交
          </button>
        </div>
        <div v-if="saveError" class="error-msg" style="margin-bottom:8px">{{ saveError }}</div>
        <div v-if="saveSuccess" class="success-msg" style="margin-bottom:8px">{{ saveSuccess }}</div>
        <div v-for="(detail, di) in recognizedDetails" :key="di" class="smelter-card">
          <div class="smelter-card-header">
            <div class="smelter-info">
              <span class="smelter-label">冶炼厂：</span>
              <input v-model="detail.factory_name" type="text" class="inline-input" placeholder="冶炼厂名称" />
              <span class="smelter-label">来源图片：</span>
              <span class="smelter-source">{{ detail.image }}</span>
            </div>
            <div class="smelter-card-actions">
              <div class="date-row">
                <label>报价日期</label>
                <input v-model="detail.date" type="date" />
              </div>
              <button class="btn-outline btn-sm" :disabled="detail.submitting" @click="submitSingle(di)">
                <span v-if="detail.submitting" class="spinner-sm spinner-dark"></span>提交此条
              </button>
            </div>
          </div>
          <div v-if="detail.submitError" class="error-msg" style="padding:4px 16px">{{ detail.submitError }}</div>
        <div v-if="detail.submitSuccess" class="success-msg" style="padding:4px 16px">{{ detail.submitSuccess }}</div>
          <table class="data-table">
            <thead>
              <tr><th>品类名</th><th>价格(元/吨)</th><th>操作</th></tr>
            </thead>
            <tbody>
              <tr v-for="(item, ii) in detail.items" :key="ii">
                <td><input v-model="item['品类名']" type="text" /></td>
                <td><input v-model.number="item['价格']" type="number" step="0.01" /></td>
                <td><button class="btn-del" @click="detail.items.splice(ii, 1)">删除</button></td>
              </tr>
            </tbody>
          </table>
          <button class="btn-add row-add-btn" @click="detail.items.push({ '品类名': '', '价格': '' })">+ 新增品种</button>
        </div>
      </div>

      <!-- 运费设置 -->
      <div class="section">
        <div class="section-header">
          <span>运费设置</span>
          <div style="display:flex;gap:8px">
            <button class="btn-add" @click="addFreightItem">+ 新增运费</button>
            <button class="btn-add" @click="openAddWarehouseModal">+ 新增仓库</button>
            <button class="btn-primary btn-sm" :disabled="freightLoading" @click="submitFreight">
              <span v-if="freightLoading" class="spinner-sm"></span>提交运费
            </button>
          </div>
        </div>
        <div v-if="freightError" class="error-msg" style="margin-bottom:8px">{{ freightError }}</div>
        <div v-if="freightSuccess" class="success-msg" style="margin-bottom:8px">{{ freightSuccess }}</div>
        <table class="data-table">
          <thead>
            <tr><th>仓库</th><th>冶炼厂</th><th>运费(元/吨)</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in freightItems" :key="i">
              <td>
                <select v-model="item.warehouseId">
                  <option value="">请选择仓库</option>
                  <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
                </select>
              </td>
              <td>
                <select v-model="item.smelterId">
                  <option value="">请选择冶炼厂</option>
                  <option v-for="s in smelters" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
              </td>
              <td><input v-model.number="item.freight" type="number" step="0.01" placeholder="运费" /></td>
              <td><button class="btn-del" @click="freightItems.splice(i, 1)">删除</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="actions" style="margin-top:24px">
        <button class="btn-outline" @click="resetAll">重置全部</button>
      </div>

    </div>
  </div>

  <!-- 新增仓库弹窗 -->
  <div v-if="addWarehouseModalOpen" class="modal-mask" @click.self="addWarehouseModalOpen = false">
    <div class="modal-box modal-box-sm">
      <div class="modal-header">
        <span>新增仓库</span>
        <button class="modal-close" @click="addWarehouseModalOpen = false">×</button>
      </div>
      <div class="modal-body">
        <div class="form-item" style="gap:12px">
          <label>仓库名</label>
          <input v-model="newWarehouseName" type="text" placeholder="请输入仓库名称" style="flex:1;padding:6px 10px;border:1px solid #d9d9d9;border-radius:6px;font-size:14px" @keyup.enter="submitAddWarehouse" />
        </div>
        <div v-if="addWarehouseMsg" :class="addWarehouseIsNew ? 'success-msg' : 'info-msg'" style="margin-top:10px">{{ addWarehouseMsg }}</div>
      </div>
      <div class="modal-footer">
        <button class="btn-outline" @click="addWarehouseModalOpen = false">关闭</button>
        <button class="btn-primary" :disabled="addWarehouseLoading || !newWarehouseName.trim()" @click="submitAddWarehouse">
          <span v-if="addWarehouseLoading" class="spinner-sm"></span>确认
        </button>
      </div>
    </div>
  </div>

  <!-- 品类映射表弹窗 -->
  <div v-if="mappingModalOpen" class="modal-mask" @click.self="closeMappingModal">
    <div class="modal-box">
      <div class="modal-header">
        <span>品类映射表</span>
        <button class="modal-close" @click="closeMappingModal">×</button>
      </div>
      <div class="modal-body">
        <div v-if="mappingLoading" class="modal-loading">加载中...</div>
        <div v-else>
          <div v-for="(row, ri) in mappingRows" :key="ri" class="mapping-row">
            <span class="mapping-id">ID {{ row.品类id }}</span>
            <div class="mapping-tags">
              <div v-for="(name, ni) in row.品类名称" :key="ni" class="tag-item">
                <span v-if="ni === 0" class="tag-main-label">主</span>
                <input v-model="row.品类名称[ni]" type="text" class="tag-input" />
                <button class="tag-del" @click="row.品类名称.splice(ni, 1)" :disabled="row.品类名称.length <= 1">×</button>
              </div>
              <button class="tag-add" @click="row.品类名称.push('')">+ 别名</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <span v-if="mappingError" class="error-msg">{{ mappingError }}</span>
        <span v-if="mappingSuccess" class="success-msg">保存成功</span>
        <button class="btn-outline" @click="closeMappingModal">取消</button>
        <button class="btn-primary" :disabled="mappingSaving" @click="saveMappingTable">
          <span v-if="mappingSaving" class="spinner-sm"></span>保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = '/tl'

const fileInput = ref(null)
const selectedFiles = ref([])
const previewUrls = ref([])
const recognizeLoading = ref(false)
const recognizeError = ref('')
const saveLoading = ref(false)
const saveError = ref('')
const saveSuccess = ref('')

// 识别结果
const recognizedDetails = ref([])  // detail: { factory_name, image, date, items: [{品类名, 价格}], submitting, submitError, submitSuccess }

// 下拉数据
const warehouses = ref([])
const smelters = ref([])

// 运费
const freightItems = ref([])
const freightLoading = ref(false)
const freightError = ref('')
const freightSuccess = ref('')

function addFreightItem() {
  freightItems.value.push({ warehouseId: '', smelterId: '', freight: '' })
}

function resetAll() {
  clearFiles()
  recognizedDetails.value = []
  freightItems.value = []
  freightError.value = ''
  freightSuccess.value = ''
  saveError.value = ''
  saveSuccess.value = ''
}

function onFilesSelected(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  // 追加，不替换
  files.forEach(f => {
    selectedFiles.value.push(f)
    previewUrls.value.push(URL.createObjectURL(f))
  })
  recognizeError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

function removeFile(i) {
  URL.revokeObjectURL(previewUrls.value[i])
  selectedFiles.value.splice(i, 1)
  previewUrls.value.splice(i, 1)
}

function clearFiles() {
  clearPreviewUrls()
  selectedFiles.value = []
  recognizeError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

function clearPreviewUrls() {
  previewUrls.value.forEach(u => URL.revokeObjectURL(u))
  previewUrls.value = []
}

async function recognizePriceTable() {
  if (!selectedFiles.value.length) { recognizeError.value = '请先选择图片'; return }
  recognizeLoading.value = true
  recognizeError.value = ''
  try {
    const fd = new FormData()
    selectedFiles.value.forEach(f => fd.append('file', f))
    const res = await fetch(`${API_BASE}/upload_price_table`, { method: 'POST', body: fd })
    const text = await res.text()
    if (!text) throw new Error(`服务器无响应（HTTP ${res.status}）`)
    let data
    try { data = JSON.parse(text) } catch { throw new Error(`响应格式错误：${text.slice(0, 100)}`) }
    if (data.code === 200) {
      recognizedDetails.value = (data.data.details || []).map(d => ({
        factory_name: d.factory_name,
        image: d.image,
        date: d.date || '',
        items: (d.items || []).map(item => ({
          '品类名': item['品类名'],
          '价格': item['价格']
        })),
        submitting: false,
        submitError: '',
        submitSuccess: ''
      }))
    } else {
      throw new Error(data.msg || '识别失败')
    }
  } catch (err) {
    recognizeError.value = err.message
  } finally {
    recognizeLoading.value = false
  }
}

function buildItems(details) {
  const allItems = []
  for (const detail of details) {
    for (const item of detail.items) {
      allItems.push({
        '冶炼厂名': detail.factory_name,
        '冶炼厂id': null,
        '品类名': item['品类名'],
        '品类id': null,
        '价格': Number(item['价格'])
      })
    }
  }
  return allItems
}

function validateDetail(detail) {
  if (!detail.date) return `冶炼厂"${detail.factory_name}"缺少报价日期`
  for (const item of detail.items) {
    if (item['价格'] === '' || item['价格'] === null || item['价格'] === undefined) return `冶炼厂"${detail.factory_name}"有品种缺少价格`
  }
  return null
}

async function postConfirm(details) {
  const priceDate = details[0]?.date || ''
  const res = await fetch(`${API_BASE}/confirm_price_table`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ '报价日期': priceDate, '数据': buildItems(details) })
  })
  const text = await res.text()
  if (!text) throw new Error(`服务器无响应（HTTP ${res.status}）`)
  let result
  try { result = JSON.parse(text) } catch { throw new Error(`响应格式错误：${text.slice(0, 100)}`) }
  if (result.code !== 200) throw new Error(result.msg || '写入失败')
  return result
}

async function submitSingle(di) {
  const detail = recognizedDetails.value[di]
  const err = validateDetail(detail)
  if (err) { detail.submitError = err; return }
  detail.submitError = ''
  detail.submitSuccess = ''
  detail.submitting = true
  try {
    const result = await postConfirm([detail])
    detail.submitSuccess = result.msg || '写入成功'
  } catch (e) {
    detail.submitError = e.message
  } finally {
    detail.submitting = false
  }
}

async function saveAllData() {
  for (const detail of recognizedDetails.value) {
    const err = validateDetail(detail)
    if (err) { saveError.value = err; return }
  }
  saveLoading.value = true
  saveError.value = ''
  saveSuccess.value = ''
  try {
    const result = await postConfirm(recognizedDetails.value)
    saveSuccess.value = result.msg || '写入成功'
  } catch (e) {
    saveError.value = e.message
  } finally {
    saveLoading.value = false
  }
}

async function submitFreight() {
  const valid = freightItems.value.filter(f => f.warehouseId && f.smelterId && f.freight !== '')
  if (!valid.length) { freightError.value = '请填写至少一条运费记录'; return }
  freightError.value = ''
  freightSuccess.value = ''
  freightLoading.value = true
  try {
    const payload = valid.map(f => ({
      '仓库': warehouses.value.find(w => w.id === f.warehouseId)?.name || '',
      '冶炼厂': smelters.value.find(s => s.id === f.smelterId)?.name || '',
      '运费': Number(f.freight)
    }))
    const res = await fetch(`${API_BASE}/upload_freight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const text = await res.text()
    if (!text) throw new Error(`服务器无响应（HTTP ${res.status}）`)
    let data
    try { data = JSON.parse(text) } catch { throw new Error(`响应格式错误：${text.slice(0, 100)}`) }
    if (data.code !== 200) throw new Error(data.msg || '运费上传失败')
    freightSuccess.value = data.msg || '运费提交成功'
  } catch (e) {
    freightError.value = e.message
  } finally {
    freightLoading.value = false
  }
}

async function loadWarehouses() {
  try {
    const res = await fetch(`${API_BASE}/get_warehouses`)
    const data = await res.json()
    if (data.code === 200) warehouses.value = data.data.map(w => ({ id: w['仓库id'], name: w['仓库名'] }))
  } catch (err) { console.error('获取仓库失败', err) }
}

async function loadSmelters() {
  try {
    const res = await fetch(`${API_BASE}/get_smelters`)
    const data = await res.json()
    if (data.code === 200) smelters.value = data.data.map(s => ({ id: s['冶炼厂id'], name: s['冶炼厂'] }))
  } catch (err) { console.error('获取冶炼厂失败', err) }
}

onMounted(() => {
  loadWarehouses()
  loadSmelters()
})

// ---- 新增仓库 ----
const addWarehouseModalOpen = ref(false)
const newWarehouseName = ref('')
const addWarehouseLoading = ref(false)
const addWarehouseMsg = ref('')
const addWarehouseIsNew = ref(false)

function openAddWarehouseModal() {
  newWarehouseName.value = ''
  addWarehouseMsg.value = ''
  addWarehouseIsNew.value = false
  addWarehouseModalOpen.value = true
}

async function submitAddWarehouse() {
  if (!newWarehouseName.value.trim()) return
  addWarehouseLoading.value = true
  addWarehouseMsg.value = ''
  try {
    const res = await fetch(`${API_BASE}/add_warehouse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ '仓库名': newWarehouseName.value.trim() })
    })
    const data = await res.json()
    if (data.code === 200) {
      addWarehouseMsg.value = data.msg
      addWarehouseIsNew.value = data['新建']
      // 刷新仓库列表
      loadWarehouses()
    } else {
      throw new Error(data.msg || '操作失败')
    }
  } catch (err) {
    addWarehouseMsg.value = err.message
    addWarehouseIsNew.value = false
  } finally {
    addWarehouseLoading.value = false
  }
}

// ---- 品类映射表弹窗 ----
const mappingModalOpen = ref(false)
const mappingLoading = ref(false)
const mappingSaving = ref(false)
const mappingError = ref('')
const mappingSuccess = ref(false)
const mappingRows = ref([])  // [{ 品类id, 品类名称: [主名, ...别名] }]

async function openMappingModal() {
  mappingModalOpen.value = true
  mappingError.value = ''
  mappingSuccess.value = false
  mappingLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/get_category_mapping`)
    const data = await res.json()
    if (data.code === 200) {
      mappingRows.value = data.data.map(row => ({
        品类id: row['品类id'],
        品类名称: [...row['品类名称']]
      }))
    } else {
      throw new Error(data.msg || '加载失败')
    }
  } catch (err) {
    mappingError.value = err.message
  } finally {
    mappingLoading.value = false
  }
}

function closeMappingModal() {
  mappingModalOpen.value = false
}

async function saveMappingTable() {
  mappingError.value = ''
  mappingSuccess.value = false
  // 过滤掉空名称
  const payload = mappingRows.value
    .filter(row => row.品类名称.some(n => n.trim()))
    .map(row => ({
      '品类id': row.品类id,
      '品类名称': row.品类名称.filter(n => n.trim())
    }))
  mappingSaving.value = true
  try {
    const res = await fetch(`${API_BASE}/update_category_mapping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (data.code === 200) {
      mappingSuccess.value = true
      // 刷新品类下拉
    } else {
      throw new Error(data.msg || '保存失败')
    }
  } catch (err) {
    mappingError.value = err.message
  } finally {
    mappingSaving.value = false
  }
}
</script>

<style scoped>
.price-management {
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
.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}
.form-label {
  width: 130px;
  font-size: 14px;
  font-weight: 500;
  padding-top: 8px;
  flex-shrink: 0;
}
.form-label.required::after {
  content: ' *';
  color: #ff4d4f;
}
.form-control {
  flex: 1;
}
.upload-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.file-name {
  font-size: 13px;
  color: #666;
}
.error-msg {
  color: #ff4d4f;
  font-size: 12px;
}
.success-msg {
  color: #52c41a;
  font-size: 12px;
}
.image-preview-list {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;
}
.btn-remove-img {
  background: rgba(0,0,0,0.55);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.btn-remove-img:hover {
  background: #ff4d4f;
}
.preview-item img {
  max-height: 72px;
  max-width: 120px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  object-fit: cover;
}
.preview-name {
  font-size: 11px;
  color: #999;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.unmatched-warning {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #ad6800;
  line-height: 1.8;
}
.section {
  margin-top: 32px;
  border-top: 1px solid #e8e8e8;
  padding-top: 24px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 600;
}
.smelter-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}
.smelter-card-header {
  background: #f5f5f5;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.smelter-card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}
.spinner-dark {
  border-color: rgba(0,0,0,.15);
  border-top-color: #333;
}
.smelter-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
}
.smelter-label {
  color: #666;
}
.smelter-name {
  font-weight: 600;
}
.inline-input {
  padding: 3px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  min-width: 180px;
}
.inline-input.unmatched {
  border-color: #ff4d4f;
  color: #ff4d4f;
}
.smelter-source {
  color: #999;
  font-size: 12px;
}
.date-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.date-row label {
  color: #666;
}
.date-row input {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
}
.row-add-btn {
  margin: 8px 12px 12px;
}
.submit-row {
  margin-bottom: 20px;
}
.form-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.form-item label {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}
.form-item label.required::after {
  content: ' *';
  color: #ff4d4f;
}
.form-item select {
  padding: 8px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  min-width: 180px;
}
.btn-add {
  background: none;
  border: 1px solid #2e7d32;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  color: #2e7d32;
  font-size: 13px;
}
.btn-add:hover {
  background: #e8f5e9;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  border-top: 1px solid #e8e8e8;
}
.data-table th,
.data-table td {
  padding: 10px 16px;
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
.data-table input,
.data-table select {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
}
.data-table input:focus,
.data-table select:focus {
  outline: none;
  border-color: #2e7d32;
}
.btn-del {
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}
.btn-del:hover {
  background: #fff2f0;
}
.actions {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}
.btn-primary {
  background: #2e7d32;
  border: none;
  padding: 8px 28px;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
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
.hidden-input {
  display: none;
}
.spinner-sm {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.btn-mapping {
  background: none;
  border: 1px solid #1565c0;
  color: #1565c0;
  padding: 4px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}
.btn-mapping:hover {
  background: #e3f2fd;
}
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: #fff;
  border-radius: 10px;
  width: 600px;
  max-width: 95vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
}
.modal-box-sm {
  width: 360px;
}
.info-msg {
  color: #1565c0;
  font-size: 12px;
}
.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 600;
  font-size: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  line-height: 1;
  padding: 0 4px;
}
.modal-close:hover { color: #333; }
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}
.modal-loading {
  text-align: center;
  color: #999;
  padding: 32px 0;
}
.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
}
.mapping-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}
.mapping-id {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  padding-top: 6px;
  min-width: 48px;
}
.mapping-tags {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.tag-item {
  display: flex;
  align-items: center;
  gap: 3px;
}
.tag-main-label {
  font-size: 11px;
  background: #2e7d32;
  color: #fff;
  border-radius: 3px;
  padding: 1px 4px;
}
.tag-input {
  padding: 3px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  width: 90px;
}
.tag-del {
  background: none;
  border: none;
  color: #bbb;
  cursor: pointer;
  font-size: 15px;
  padding: 0 2px;
  line-height: 1;
}
.tag-del:hover:not(:disabled) { color: #ff4d4f; }
.tag-del:disabled { cursor: not-allowed; opacity: 0.4; }
.tag-add {
  background: none;
  border: 1px dashed #aaa;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  padding: 3px 10px;
}
.tag-add:hover { border-color: #2e7d32; color: #2e7d32; }
</style>
