<template>
  <div class="price-management">
    <div class="card-header">价格录入</div>
    <div class="card-body">
      <!-- 图片上传区域 -->
      <div class="form-row">
        <div class="form-label required">价格表图片</div>
        <div class="form-control">
          <div class="upload-controls">
            <input ref="fileInput" type="file" accept="image/*" class="hidden-input" @change="onFileSelected" />
            <button class="btn-outline" @click="fileInput?.click()">📷 选择图片</button>
            <span v-if="selectedFile" class="file-name">{{ selectedFile.name }}</span>
            <button class="btn-primary" :disabled="!selectedFile || recognizeLoading" @click="recognizePriceTable">
              <span v-if="recognizeLoading" class="spinner-sm"></span>识别
            </button>
            <span v-if="recognizeError" class="error-msg">{{ recognizeError }}</span>
            <span v-if="recognizeSuccess" class="success-msg">识别成功</span>
          </div>
          <div v-if="imagePreviewUrl" class="image-preview">
            <img :src="imagePreviewUrl" alt="预览" />
            <button class="btn-remove-img" @click="clearImage">删除</button>
          </div>
        </div>
      </div>

      <!-- 冶炼厂信息 -->
      <div class="info-row">
        <div class="info-item">
          <label class="required">冶炼厂名称</label>
          <input v-model="form.smelterName" type="text" placeholder="请输入冶炼厂名称" />
        </div>
        <div class="info-item">
          <label>价格日期</label>
          <input v-model="form.priceDate" type="date" />
        </div>
        <div class="info-item">
          <label>备注</label>
          <input v-model="form.remark" type="text" placeholder="备注（可选）" />
        </div>
      </div>

      <!-- 品种价格 -->
      <div class="section">
        <div class="section-header">
          <span>品种价格</span>
          <button class="btn-add" @click="addPriceItem">+ 新增品种</button>
        </div>
        <table class="data-table">
          <thead>
            <th>品种</th><th>价格(元/吨)</th><th>操作</th> </thead>
          <tbody>
            <tr v-for="(item, i) in priceItems" :key="i">
              <td><input v-model="item.category" type="text" placeholder="品种名称（如：紫铜）" /></td>
              <td><input v-model.number="item.price" type="number" step="0.01" placeholder="单价" /></td>
              <td><button class="btn-del" @click="removePriceItem(i)">删除</button></td>
            </tr>
          </tbody>
        </table>
        <div class="hint-text">提示：识别出的品种名称会自动映射到总品类</div>
      </div>

      <!-- 运费设置 -->
      <div class="section">
        <div class="section-header">
          <span>运费设置（可选）</span>
          <button class="btn-add" @click="addFreightItem">+ 新增运费</button>
        </div>
        <table class="data-table">
          <thead>
            <th>仓库</th><th>冶炼厂</th><th>运费(元/吨)</th><th>操作</th> </thead>
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
              <td><button class="btn-del" @click="removeFreightItem(i)">删除</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="actions">
        <button class="btn-primary" :disabled="saveLoading" @click="saveAllData">
          <span v-if="saveLoading" class="spinner-sm"></span>保存到数据库
        </button>
        <button class="btn-outline" @click="resetAll">重置</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = '/tl'

const fileInput = ref(null)
const selectedFile = ref(null)
const imagePreviewUrl = ref('')
const recognizeLoading = ref(false)
const recognizeError = ref('')
const recognizeSuccess = ref(false)
const saveLoading = ref(false)

const form = ref({ smelterName: '', priceDate: '', remark: '' })
const priceItems = ref([{ category: '', price: '' }])
const freightItems = ref([{ warehouseId: '', smelterId: '', freight: '' }])

const warehouses = ref([])
const smelters = ref([])

function addPriceItem() { priceItems.value.push({ category: '', price: '' }) }
function removePriceItem(i) { priceItems.value.splice(i, 1); if (!priceItems.value.length) priceItems.value.push({ category: '', price: '' }) }
function addFreightItem() { freightItems.value.push({ warehouseId: '', smelterId: '', freight: '' }) }
function removeFreightItem(i) { freightItems.value.splice(i, 1) }

function resetAll() {
  form.value = { smelterName: '', priceDate: '', remark: '' }
  priceItems.value = [{ category: '', price: '' }]
  freightItems.value = [{ warehouseId: '', smelterId: '', freight: '' }]
  clearImage()
  recognizeSuccess.value = false
}

function onFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  selectedFile.value = file
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
  imagePreviewUrl.value = URL.createObjectURL(file)
  recognizeError.value = ''
  recognizeSuccess.value = false
}

function clearImage() {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
  selectedFile.value = null
  imagePreviewUrl.value = ''
  recognizeError.value = ''
  recognizeSuccess.value = false
  if (fileInput.value) fileInput.value.value = ''
}

async function recognizePriceTable() {
  if (!selectedFile.value) { recognizeError.value = '请先选择图片'; return }
  recognizeLoading.value = true
  try {
    const fd = new FormData()
    fd.append('file', selectedFile.value)
    const res = await fetch(`${API_BASE}/upload_price_table`, { method: 'POST', body: fd })
    const data = await res.json()
    if (data.code === 200) {
      const result = data.data || {}
      if (result.smelter_name) form.value.smelterName = result.smelter_name
      if (result.price_date) form.value.priceDate = result.price_date
      if (result.prices?.length) {
        priceItems.value = result.prices.map(p => ({ category: p.category || p.品种 || '', price: p.price || p.单价 || '' }))
      }
      recognizeSuccess.value = true
      alert('识别成功，请确认并保存')
    } else {
      throw new Error(data.msg || '识别失败')
    }
  } catch (err) {
    recognizeError.value = err.message
  } finally {
    recognizeLoading.value = false
  }
}

async function saveAllData() {
  if (!form.value.smelterName) { alert('请填写冶炼厂名称'); return }
  const validPrices = priceItems.value.filter(p => p.category && p.price)
  if (!validPrices.length) { alert('请至少填写一个品种和价格'); return }
  const validFreights = freightItems.value.filter(f => f.warehouseId && f.smelterId && f.freight)

  saveLoading.value = true
  try {
    for (const f of validFreights) {
      const warehouse = warehouses.value.find(w => w.id === f.warehouseId)
      const smelter = smelters.value.find(s => s.id === f.smelterId)
      await fetch(`${API_BASE}/upload_freight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ '仓库': warehouse?.name, '冶炼厂': smelter?.name, '运费': Number(f.freight) })
      })
    }
    
    const fd = new FormData()
    if (selectedFile.value) fd.append('file', selectedFile.value)
    const res = await fetch(`${API_BASE}/upload_price_table`, { method: 'POST', body: fd })
    const data = await res.json()
    if (data.code === 200) {
      alert('保存成功')
      resetAll()
    } else {
      throw new Error(data.msg || '保存失败')
    }
  } catch (err) {
    alert(err.message)
  } finally {
    saveLoading.value = false
  }
}

async function loadWarehouses() {
  try {
    const res = await fetch(`${API_BASE}/get_warehouses`)
    const data = await res.json()
    if (data.code === 200) {
      warehouses.value = data.data.map(w => ({ id: w['仓库id'], name: w['仓库名'] }))
    }
  } catch (err) { console.error('获取仓库失败', err) }
}

async function loadSmelters() {
  try {
    const res = await fetch(`${API_BASE}/get_smelters`)
    const data = await res.json()
    if (data.code === 200) {
      smelters.value = data.data.map(s => ({ id: s['冶炼厂id'], name: s['冶炼厂'] }))
    }
  } catch (err) { console.error('获取冶炼厂失败', err) }
}

onMounted(() => {
  loadWarehouses()
  loadSmelters()
})
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
  width: 100px;
  font-size: 14px;
  font-weight: 500;
  padding-top: 8px;
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
.image-preview {
  margin-top: 12px;
  display: flex;
  gap: 12px;
  align-items: center;
}
.image-preview img {
  max-height: 80px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}
.btn-remove-img {
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
}
.info-row {
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}
.info-item {
  flex: 1;
  min-width: 180px;
}
.info-item label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}
.info-item input {
  width: 100%;
  padding: 8px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
}
.info-item input:focus {
  outline: none;
  border-color: #2e7d32;
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
.btn-add {
  background: none;
  border: 1px solid #2e7d32;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  color: #2e7d32;
}
.btn-add:hover {
  background: #e8f5e9;
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
.data-table input,
.data-table select {
  width: 100%;
  padding: 6px 8px;
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
.hint-text {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
.actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e8e8e8;
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
  margin-right: 4px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>