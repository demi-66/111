<template>
  <div class="app-layout" v-if="authStore.isLoggedIn">
    <aside class="sidebar">
      <div class="logo-area">
        <h2>价格管理系统</h2>
        <div class="user-info">
          <div class="user-left">
            <span class="user-name">{{ authStore.user?.username }}</span>
            <span class="role-badge" :class="authStore.isAdmin ? 'admin' : 'user'">
              {{ authStore.isAdmin ? '管理员' : '普通用户' }}
            </span>
          </div>
          <button class="logout-btn" @click="handleLogout">
            <svg class="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            退出
          </button>
        </div>
      </div>
      <nav class="nav-menu">
        <div v-if="authStore.isAdmin" class="nav-group">
          <div class="group-title">价格管理</div>
          <ul>
            <li :class="{ active: currentPage === 'management' }" @click="currentPage = 'management'">
              <span class="menu-icon"></span>价格录入
            </li>
          </ul>
        </div>
        <div class="nav-group">
          <div class="group-title">价格查看</div>
          <ul>
            <li :class="{ active: currentPage === 'query' }" @click="currentPage = 'query'">
              <span class="menu-icon"></span>价格查询
            </li>
            <li :class="{ active: currentPage === 'suggestion' }" @click="currentPage = 'suggestion'">
              <span class="menu-icon"></span>采购建议
            </li>
          </ul>
        </div>
        <div v-if="authStore.isAdmin" class="nav-group">
          <div class="group-title">系统管理</div>
          <ul>
            <li :class="{ active: currentPage === 'user' }" @click="currentPage = 'user'">
              <span class="menu-icon">👥</span>用户管理
            </li>
          </ul>
        </div>
      </nav>
    </aside>
    <main class="main-content">
      <PriceManagement v-if="currentPage === 'management'" />
      <PriceQuery v-else-if="currentPage === 'query'" />
      <PurchaseSuggestion v-else-if="currentPage === 'suggestion'" />
      <UserManagement v-else-if="currentPage === 'user'" />
    </main>
  </div>
  <Login v-else />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import Login from './pages/Login.vue'
import PriceManagement from './pages/price-prediction/PriceManagement.vue'
import PriceQuery from './pages/price-prediction/PriceQuery.vue'
import PurchaseSuggestion from './pages/price-prediction/PurchaseSuggestion.vue'
import UserManagement from './pages/UserManagement.vue'

const authStore = useAuthStore()
const currentPage = ref('query')

function handleLogout() {
  authStore.logout()
}

onMounted(() => {
  authStore.checkAuth()
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f5f5;
}

.sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.logo-area {
  padding: 20px;
  border-bottom: 1px solid #e8e8e8;
}

.logo-area h2 {
  font-size: 18px;
  font-weight: 600;
  color: #2e7d32;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 8px;
}

.user-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.role-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.role-badge.admin {
  background: #e8f5e9;
  color: #2e7d32;
}

.role-badge.user {
  background: #f0f0f0;
  color: #666;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #ff4d4f;
  color: #fff;
}

.logout-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}

.nav-menu {
  flex: 1;
  padding: 16px 0;
}

.nav-group {
  margin-bottom: 24px;
}

.group-title {
  padding: 8px 20px;
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
}

.nav-menu ul {
  list-style: none;
}

.nav-menu li {
  padding: 10px 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
}

.nav-menu li:hover {
  background: #f5f5f5;
  color: #2e7d32;
}

.nav-menu li.active {
  background: #e8f5e9;
  color: #2e7d32;
  border-right: 3px solid #2e7d32;
}

.menu-icon {
  font-size: 16px;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>