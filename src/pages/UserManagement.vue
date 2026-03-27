<template>
  <div class="user-management">
    <div class="card-header">
      <span>账号管理</span>
      <button class="btn-primary" @click="openAddModal">+ 新增用户</button>
    </div>
    <div class="card-body">
      <div class="filter-bar">
        <input v-model="filters.keyword" type="text" placeholder="账号/姓名/手机" />
        <select v-model="filters.role">
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="user">普通用户</option>
        </select>
        <button class="btn-primary" @click="loadUsers">查询</button>
        <button class="btn-outline" @click="resetFilters">重置</button>
      </div>

      <div class="table-wrapper">
        <div v-if="listLoading" class="loading">加载中...</div>
        <table v-else class="data-table">
          <thead>
        
              <th>ID</th>
              <th>账号</th>
              <th>姓名</th>
              <th>角色</th>
              <th>手机</th>
              <th>邮箱</th>
              <th>操作</th>
            </thead>
          <tbody>
            <tr v-for="user in userList" :key="user.id">
              <td class="id-cell">{{ user.id }}</td>
              <td class="username-cell">{{ user.username }}</td>
              <td class="name-cell">{{ user.realName || '—' }}</td>
              <td class="role-cell">
                <span :class="user.role === 'admin' ? 'role-admin' : 'role-user'">
                  {{ user.role === 'admin' ? '管理员' : '普通用户' }}
                </span>
              </td>
              <td class="phone-cell">{{ user.phone || '—' }}</td>
              <td class="email-cell">{{ user.email || '—' }}</td>
              <td class="action-cell">
                <button class="btn-link" @click="openRoleModal(user)">权限/角色</button>
                <button class="btn-link" @click="openPasswordModal(user)">修改密码</button>
                <button class="btn-link-danger" @click="deleteUser(user)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="total > 0" class="pagination">
        <span>共 {{ total }} 条</span>
        <div>
          <button :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
          <span>{{ page }} / {{ totalPages }}</span>
          <button :disabled="page >= totalPages" @click="goPage(page + 1)">下一页</button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <teleport to="body">
      <div v-if="modalVisible" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3>{{ isEdit ? '编辑用户' : '新增用户' }}</h3>
            <button class="close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-item">
              <label class="required">账号</label>
              <input v-model="form.username" type="text" placeholder="请输入账号" />
            </div>
            <div class="form-item">
              <label class="required">姓名</label>
              <input v-model="form.realName" type="text" placeholder="请输入姓名" />
            </div>
            <div class="form-item">
              <label class="required">密码</label>
              <input v-model="form.password" type="password" placeholder="请输入密码" />
              <div v-if="isEdit" class="hint-text">留空则不修改密码</div>
            </div>
            <div class="form-item">
              <label>确认密码</label>
              <input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" />
            </div>
            <div class="form-item">
              <label>手机</label>
              <input v-model="form.phone" type="text" placeholder="请输入手机号" />
            </div>
            <div class="form-item">
              <label>邮箱</label>
              <input v-model="form.email" type="email" placeholder="请输入邮箱" />
            </div>
            <div class="form-item">
              <label>角色</label>
              <select v-model="form.role">
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-modal" @click="closeModal">取消</button>
            <button class="btn-modal btn-primary-modal" :disabled="saveLoading" @click="saveUser">
              {{ saveLoading ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 修改密码弹窗 -->
    <teleport to="body">
      <div v-if="passwordModalVisible" class="modal-overlay" @click.self="closePasswordModal">
        <div class="modal-container modal-small">
          <div class="modal-header">
            <h3>修改密码 - {{ currentUser?.username }}</h3>
            <button class="close" @click="closePasswordModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-item">
              <label class="required">管理员密钥</label>
              <input v-model="passwordForm.adminKey" type="password" placeholder="请输入管理员密钥" />
            </div>
            <div class="form-item">
              <label class="required">新密码</label>
              <input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
            </div>
            <div class="form-item">
              <label class="required">确认密码</label>
              <input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-modal" @click="closePasswordModal">取消</button>
            <button class="btn-modal btn-primary-modal" :disabled="passwordLoading" @click="updatePassword">
              {{ passwordLoading ? '保存中...' : '确定' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 权限/角色弹窗 -->
    <teleport to="body">
      <div v-if="roleModalVisible" class="modal-overlay" @click.self="closeRoleModal">
        <div class="modal-container modal-small">
          <div class="modal-header">
            <h3>设置角色 - {{ currentUser?.username }}</h3>
            <button class="close" @click="closeRoleModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-item">
              <label class="required">角色</label>
              <select v-model="roleForm.role">
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-modal" @click="closeRoleModal">取消</button>
            <button class="btn-modal btn-primary-modal" :disabled="roleLoading" @click="updateRole">
              {{ roleLoading ? '保存中...' : '确定' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const API_BASE = '/auth'
const authStore = useAuthStore()

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authStore.token}` }
}

function mapUser(u) {
  return { id: u.id, username: u.username, realName: u.real_name, role: u.role, phone: u.phone, email: u.email }
}

const userList = ref([])
const listLoading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const filters = ref({ keyword: '', role: '' })

const modalVisible = ref(false)
const isEdit = ref(false)
const form = ref({ id: null, username: '', realName: '', password: '', confirmPassword: '', phone: '', email: '', role: 'user' })
const saveLoading = ref(false)

const passwordModalVisible = ref(false)
const currentUser = ref(null)
const passwordForm = ref({ adminKey: '', newPassword: '', confirmPassword: '' })
const passwordLoading = ref(false)

const roleModalVisible = ref(false)
const roleForm = ref({ role: 'user' })
const roleLoading = ref(false)

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options)
  const text = await res.text()
  if (!text) throw new Error(`服务器无响应（HTTP ${res.status}）`)
  let data
  try { data = JSON.parse(text) } catch { throw new Error(`响应格式错误：${text.slice(0, 100)}`) }
  if (data.code !== 200) throw new Error(data.msg || data.detail || '操作失败')
  return data
}

async function loadUsers() {
  listLoading.value = true
  try {
    const params = new URLSearchParams({ page: page.value, page_size: pageSize.value })
    if (filters.value.keyword) params.set('keyword', filters.value.keyword)
    if (filters.value.role) params.set('role', filters.value.role)
    const data = await apiFetch(`${API_BASE}/users?${params}`, { headers: authHeaders() })
    userList.value = data.data.list.map(mapUser)
    total.value = data.data.total
  } catch (err) {
    console.error('获取用户列表失败', err)
  } finally {
    listLoading.value = false
  }
}

function resetFilters() {
  filters.value = { keyword: '', role: '' }
  page.value = 1
  loadUsers()
}

function goPage(p) {
  page.value = p
  loadUsers()
}

function openAddModal() {
  isEdit.value = false
  form.value = { id: null, username: '', realName: '', password: '', confirmPassword: '', phone: '', email: '', role: 'user' }
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
}

async function saveUser() {
  if (!form.value.username) { alert('请输入账号'); return }
  if (!form.value.realName) { alert('请输入姓名'); return }
  if (!isEdit.value && !form.value.password) { alert('请输入密码'); return }
  if (form.value.password !== form.value.confirmPassword) { alert('两次输入的密码不一致'); return }
  saveLoading.value = true
  try {
    await apiFetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        username: form.value.username,
        real_name: form.value.realName,
        password: form.value.password,
        role: form.value.role,
        phone: form.value.phone,
        email: form.value.email
      })
    })
    alert('添加成功')
    closeModal()
    loadUsers()
  } catch (err) {
    alert(err.message)
  } finally {
    saveLoading.value = false
  }
}

function openPasswordModal(user) {
  currentUser.value = user
  passwordForm.value = { adminKey: '', newPassword: '', confirmPassword: '' }
  passwordModalVisible.value = true
}

function closePasswordModal() {
  passwordModalVisible.value = false
}

async function updatePassword() {
  if (!passwordForm.value.adminKey) { alert('请输入管理员密钥'); return }
  if (!passwordForm.value.newPassword) { alert('请输入新密码'); return }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) { alert('两次输入的密码不一致'); return }
  passwordLoading.value = true
  try {
    await apiFetch(`${API_BASE}/change_password`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        id: currentUser.value.id,
        admin_key: passwordForm.value.adminKey,
        new_password: passwordForm.value.newPassword
      })
    })
    alert('密码修改成功')
    closePasswordModal()
  } catch (err) {
    alert(err.message)
  } finally {
    passwordLoading.value = false
  }
}

function openRoleModal(user) {
  currentUser.value = user
  roleForm.value = { role: user.role }
  roleModalVisible.value = true
}

function closeRoleModal() {
  roleModalVisible.value = false
}

async function updateRole() {
  roleLoading.value = true
  try {
    await apiFetch(`${API_BASE}/update_role`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ id: currentUser.value.id, role: roleForm.value.role })
    })
    alert('角色修改成功')
    closeRoleModal()
    loadUsers()
  } catch (err) {
    alert(err.message)
  } finally {
    roleLoading.value = false
  }
}

async function deleteUser(user) {
  if (!confirm(`确定删除用户 ${user.username} 吗？`)) return
  try {
    await apiFetch(`${API_BASE}/delete_user`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ id: user.id })
    })
    alert('删除成功')
    loadUsers()
  } catch (err) {
    alert(err.message)
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
}
.card-body {
  padding: 20px;
}
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.filter-bar input, .filter-bar select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  min-width: 160px;
}
.table-wrapper {
  overflow-x: auto;
  min-height: 300px;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.data-table th, .data-table td {
  padding: 14px 12px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}
.data-table th {
  background: #fafafa;
  font-weight: 600;
  font-size: 14px;
}
.data-table td {
  font-size: 13px;
}
.id-cell, .username-cell, .name-cell, .phone-cell, .email-cell {
  font-size: 13px;
}
.role-admin {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  display: inline-block;
}
.role-user {
  background: #f5f5f5;
  color: #666;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  display: inline-block;
}
.action-cell {
  white-space: nowrap;
}
.action-cell button {
  margin-right: 8px;
}
.btn-primary {
  background: #2e7d32;
  border: none;
  padding: 6px 18px;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
}
.btn-outline {
  background: #fff;
  border: 1px solid #d9d9d9;
  padding: 5px 17px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.btn-link {
  background: none;
  border: none;
  color: #2e7d32;
  cursor: pointer;
  padding: 0 6px;
  font-size: 12px;
}
.btn-link-danger {
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  padding: 0 6px;
  font-size: 12px;
}
.pagination {
  padding: 16px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  border-top: 1px solid #e8e8e8;
  margin-top: 16px;
}
.pagination button {
  background: none;
  border: 1px solid #d9d9d9;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin: 0 8px;
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
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}
.modal-container.modal-small {
  max-width: 420px;
}
.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
}
.modal-header .close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}
.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.btn-modal {
  padding: 8px 20px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.btn-primary-modal {
  background: #2e7d32;
  border-color: #2e7d32;
  color: #fff;
}
.form-item {
  margin-bottom: 20px;
}
.form-item label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #333;
}
.form-item label.required::after {
  content: ' *';
  color: #ff4d4f;
}
.form-item input, .form-item select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}
.hint-text {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>