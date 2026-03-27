<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>价格管理系统</h2>
        <p>在这里登录您的账号</p>
      </div>
      <form @submit.prevent="handleLogin">
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
      <div v-if="loginError" class="error-msg">{{ loginError }}</div>
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

const testUsers = {
  '111': { username: '111', password: '123456', role: 'admin', token: 'test-token-111' },
  'user1': { username: 'user1', password: '123456', role: 'user', token: 'test-token-user1' }
}

function handleLogin() {
  loginLoading.value = true
  loginError.value = ''
  
  setTimeout(() => {
    const user = testUsers[loginForm.value.username]
    
    if (user && user.password === loginForm.value.password) {
      authStore.setUser(user)
      router.push('/')
    } else {
      loginError.value = '账号或密码错误'
    }
    loginLoading.value = false
  }, 500)
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
</style>