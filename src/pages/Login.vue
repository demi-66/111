<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>价格管理系统</h2>
        <p>{{ isRegister ? '注册新账号' : '在这里登录您的账号' }}</p>
      </div>

      <!-- 登录表单 -->
      <form v-if="!isRegister" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>账号</label>
          <input v-model="loginForm.username" type="text" placeholder="请输入账号" required />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="loginForm.password" type="password" placeholder="请输入密码" required />
        </div>
        <button type="submit" class="btn-login" :disabled="loginLoading">
          {{ loginLoading ? '登录中...' : '登录' }}
        </button>
      </form>

      <!-- 注册表单 -->
      <form v-else @submit.prevent="handleRegister">
        <div class="form-group">
          <label>账号 <span class="required">*</span></label>
          <input v-model="registerForm.username" type="text" placeholder="请输入账号" required />
        </div>
        <div class="form-group">
          <label>姓名 <span class="required">*</span></label>
          <input v-model="registerForm.realName" type="text" placeholder="请输入姓名" required />
        </div>
        <div class="form-group">
          <label>密码 <span class="required">*</span></label>
          <input v-model="registerForm.password" type="password" placeholder="请输入密码" required />
        </div>
        <div class="form-group">
          <label>确认密码 <span class="required">*</span></label>
          <input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" required />
        </div>
        <div class="form-group">
          <label>手机</label>
          <input v-model="registerForm.phone" type="text" placeholder="请输入手机号（可选）" />
        </div>
        <button type="submit" class="btn-login" :disabled="registerLoading">
          {{ registerLoading ? '注册中...' : '注册' }}
        </button>
      </form>

      <div v-if="loginError" class="error-msg">{{ loginError }}</div>
      <div v-if="registerError" class="error-msg">{{ registerError }}</div>
      <div v-if="registerSuccess" class="success-msg">注册成功！请登录</div>
      <div v-if="usingFallback" class="fallback-msg">⚠️ 离线模式：后端未连接，使用本地测试账号登录</div>

      <div class="switch-row">
        <span v-if="!isRegister">没有账号？</span>
        <span v-else>已有账号？</span>
        <button class="btn-switch" type="button" @click="switchMode">
          {{ isRegister ? '去登录' : '立即注册' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginForm = ref({
  username: '',
  password: ''
})
const loginLoading = ref(false)
const loginError = ref('')
const usingFallback = ref(false)

const isRegister = ref(false)
const registerForm = ref({ username: '', realName: '', password: '', confirmPassword: '', phone: '' })
const registerLoading = ref(false)
const registerError = ref('')
const registerSuccess = ref(false)

function switchMode() {
  isRegister.value = !isRegister.value
  loginError.value = ''
  registerError.value = ''
  registerSuccess.value = false
}

async function handleRegister() {
  registerError.value = ''
  registerSuccess.value = false
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    registerError.value = '两次输入的密码不一致'
    return
  }
  registerLoading.value = true
  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: registerForm.value.username,
        real_name: registerForm.value.realName,
        password: registerForm.value.password,
        phone: registerForm.value.phone
      })
    })
    const text = await res.text()
    if (!text) throw new Error(`服务器无响应（HTTP ${res.status}）`)
    let data
    try { data = JSON.parse(text) } catch { throw new Error(`响应格式错误：${text.slice(0, 100)}`) }
    if (data.code === 200) {
      registerSuccess.value = true
      registerForm.value = { username: '', realName: '', password: '', confirmPassword: '', phone: '' }
      setTimeout(() => { isRegister.value = false; registerSuccess.value = false }, 1500)
    } else {
      const detail = data.detail
      registerError.value = data.msg || (Array.isArray(detail) ? detail.map(e => e.msg).join('；') : detail) || '注册失败'
    }
  } catch (err) {
    registerError.value = `后端不可用，注册功能暂时无法使用`
  } finally {
    registerLoading.value = false
  }
}

const FALLBACK_USERS = {
  '111': { id: 1, username: '111', realName: '管理员', role: 'admin', phone: '', email: '', token: 'test-token-111' },
  'user1': { id: 2, username: 'user1', realName: '普通用户', role: 'user', phone: '', email: '', token: 'test-token-user1' }
}

async function handleLogin() {
  loginLoading.value = true
  loginError.value = ''
  usingFallback.value = false
  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: loginForm.value.username, password: loginForm.value.password })
    })
    const text = await res.text()
    if (!text) throw new Error(`服务器无响应（HTTP ${res.status}）`)
    let data
    try { data = JSON.parse(text) } catch { throw new Error(`响应格式错误：${text.slice(0, 100)}`) }
    if (data.code === 200) {
      const u = data.user
      authStore.setUser({ id: u.id, username: u.username, realName: u.real_name, role: u.role, phone: u.phone, email: u.email, token: data.token })
      router.push('/')
    } else {
      loginError.value = data.msg || data.detail || '登录失败'
    }
  } catch (err) {
    // 后端不可用，降级到本地测试账号
    const fallback = FALLBACK_USERS[loginForm.value.username]
    if (fallback && loginForm.value.password === '123456') {
      usingFallback.value = true
      authStore.setUser(fallback)
      router.push('/')
    } else {
      loginError.value = `后端不可用，已切换离线模式（测试账号：111 / 123456）`
    }
  } finally {
    loginLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-header h2 {
  color: #2e7d32;
  font-size: 24px;
  margin-bottom: 8px;
}
.login-header p {
  color: #666;
  font-size: 14px;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}
.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
}
.form-group input:focus {
  outline: none;
  border-color: #2e7d32;
}
.btn-login {
  width: 100%;
  background: #2e7d32;
  border: none;
  padding: 12px;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}
.btn-login:hover {
  background: #1b5e20;
}
.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error-msg {
  margin-top: 16px;
  color: #ff4d4f;
  font-size: 13px;
  text-align: center;
}
.fallback-msg {
  margin-top: 12px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 6px;
  padding: 8px 12px;
  color: #ad6800;
  font-size: 12px;
  text-align: center;
}
.success-msg {
  margin-top: 16px;
  color: #52c41a;
  font-size: 13px;
  text-align: center;
}
.required {
  color: #ff4d4f;
}
.switch-row {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: #666;
}
.btn-switch {
  background: none;
  border: none;
  color: #2e7d32;
  font-size: 13px;
  cursor: pointer;
  padding: 0 4px;
  text-decoration: underline;
}
</style>