<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="logo-area">
        <h2>价格管理系统</h2>
      </div>
      <nav class="nav-menu">
        <div class="nav-group">
          <div class="group-title">价格管理</div>
          <ul>
            <li :class="{ active: currentPage === 'management' }" @click="currentPage = 'management'">
              <span class="menu-icon"></span>价格表上传
            </li>
          </ul>
        </div>
        <div class="nav-group">
          <div class="group-title">价格查询</div>
          <ul>
            <li :class="{ active: currentPage === 'query' }" @click="currentPage = 'query'">
              <span class="menu-icon"></span>价格查询
            </li>
          </ul>
        </div>
      </nav>
    </aside>
    <main class="main-content">
      <PriceManagement v-if="currentPage === 'management'" />
      <PriceQuery v-else-if="currentPage === 'query'" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PriceManagement from './pages/price-prediction/PriceManagement.vue'
import PriceQuery from './pages/price-prediction/PriceQuery.vue'

const currentPage = ref('management')
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
}
.logo-area {
  padding: 24px 20px;
  border-bottom: 1px solid #e8e8e8;
}
.logo-area h2 {
  font-size: 18px;
  font-weight: 600;
  color: #2e7d32;
}
.nav-menu {
  padding: 20px 0;
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
  padding: 12px 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
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