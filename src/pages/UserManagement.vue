<template>
  <div class="user-management">
    <div class="card-header">
      <span>用户管理</span>
      <button class="btn-primary" @click="openAddModal">+ 新增用户</button>
    </div>
    <div class="card-body">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>角色</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in userList" :key="user.id">
              <td>{{ user.username }}</td>
              <td class="role-cell">
                <span :class="user.role === 'admin' ? 'role-admin' : 'role-user'">
                  {{ user.role === 'admin' ? '管理员' : '普通用户' }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td class="action-cell">
                <button class="btn-link" @click="openEditModal(user)">编辑</button>
                <button class="btn-link-danger" @click="deleteUser(user)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 新增/编辑用户弹窗 -->
    <teleport to="body">
      <div v-if="userModalVisible" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3>{{ isEdit ? '编辑用户' : '新增用户' }}</h3>
            <button class="close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>用户名</label>
              <input v-model="userForm.username" type="text" placeholder="请输入用户名" class="short-input" />
            </div>
            <div class="form-group">
              <label>密码</label>
              <input v-model="userForm.password" type="password" placeholder="请输入密码" class="short-input" />
              <div v-if="isEdit" class="hint-text">留空则不修改密码</div>
            </div>
            <div class="form-group">
              <label>角色</label>
              <select v-model="userForm.role" class="short-select">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = '/tl'

const userList = ref([
  { id: 1, username: '111', role: 'admin', created_at: '2026-03-26' },
  { id: 2, username: 'user1', role: 'user', created_at: '2026-03-26' }
])
const userModalVisible = ref(false)
const isEdit = ref(false)
const userForm = ref({ id: null, username: '', password: '', role: 'user' })
const saveLoading = ref(false)

function formatDate(d) {
  return d ? d.slice(0, 10) : '—'
}

async function loadUsers() {
  // TODO: 需要后端提供用户列表接口
  // 接口: GET /tl/get_users
  // 返回: { code: 200, data: [{ id, username, role, created_at }] }
  
  // 暂时使用模拟数据，等后端接口好了取消注释下面的真实接口代码
  // try {
  //   const res = await fetch(`${API_BASE}/get_users`)
  //   const data = await res.json()
  //   if (data.code === 200) {
  //     userList.value = data.data
  //   }
  // } catch (err) {
  //   console.error('获取用户列表失败', err)
  // }
}

function openAddModal() {
  isEdit.value = false
  userForm.value = { id: null, username: '', password: '', role: 'user' }
  userModalVisible.value = true
}

function openEditModal(user) {
  isEdit.value = true
  userForm.value = { ...user, password: '' }
  userModalVisible.value = true
}

function closeModal() {
  userModalVisible.value = false
}

async function saveUser() {
  if (!userForm.value.username) {
    alert('请输入用户名')
    return
  }
  
  saveLoading.value = true
  try {
    if (isEdit.value) {
      // TODO: 更新用户接口
      // 接口: PUT /tl/update_user
      // 参数: { id, username, password, role }
      
      // 模拟更新
      const index = userList.value.findIndex(u => u.id === userForm.value.id)
      if (index !== -1) {
        userList.value[index] = {
          ...userList.value[index],
          username: userForm.value.username,
          role: userForm.value.role
        }
      }
      alert('更新成功')
      
      // 真实接口代码（等后端好了取消注释）
      // const res = await fetch(`${API_BASE}/update_user`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(userForm.value)
      // })
      // const data = await res.json()
      // if (data.code === 200) {
      //   alert('更新成功')
      //   loadUsers()
      // } else {
      //   throw new Error(data.msg)
      // }
    } else {
      // TODO: 新增用户接口
      // 接口: POST /tl/add_user
      // 参数: { username, password, role }
      
      // 模拟新增
      const newUser = {
        id: Date.now(),
        username: userForm.value.username,
        role: userForm.value.role,
        created_at: new Date().toISOString().slice(0, 10)
      }
      userList.value.push(newUser)
      alert('添加成功')
      
      // 真实接口代码（等后端好了取消注释）
      // const res = await fetch(`${API_BASE}/add_user`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     username: userForm.value.username,
      //     password: userForm.value.password,
      //     role: userForm.value.role
      //   })
      // })
      // const data = await res.json()
      // if (data.code === 200) {
      //   alert('添加成功')
      //   loadUsers()
      // } else {
      //   throw new Error(data.msg)
      // }
    }
    closeModal()
  } catch (err) {
    alert(err.message)
  } finally {
    saveLoading.value = false
  }
}

async function deleteUser(user) {
  if (!confirm(`确定删除用户 ${user.username} 吗？`)) return
  
  try {
    // TODO: 删除用户接口
    // 接口: DELETE /tl/delete_user/{id}
    
    // 模拟删除
    userList.value = userList.value.filter(u => u.id !== user.id)
    alert('删除成功')
    
    // 真实接口代码（等后端好了取消注释）
    // const res = await fetch(`${API_BASE}/delete_user/${user.id}`, {
    //   method: 'DELETE'
    // })
    // const data = await res.json()
    // if (data.code === 200) {
    //   alert('删除成功')
    //   loadUsers()
    // } else {
    //   throw new Error(data.msg)
    // }
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
}
.card-body {
  padding: 20px;
}
.table-wrapper {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}
.data-table th {
  background: #fafafa;
  font-weight: 500;
}
.role-admin {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}
.role-user {
  background: #f5f5f5;
  color: #666;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}
.role-cell {
  width: 100px;
}
.action-cell {
  width: 100px;
}
.btn-primary {
  background: #2e7d32;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
}
.btn-link {
  background: none;
  border: none;
  color: #2e7d32;
  cursor: pointer;
  padding: 0 8px;
}
.btn-link-danger {
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  padding: 0 8px;
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
  max-width: 400px;
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
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
}
.short-input {
  width: 260px;
  padding: 8px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}
.short-select {
  width: 260px;
  padding: 8px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
}
.hint-text {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>