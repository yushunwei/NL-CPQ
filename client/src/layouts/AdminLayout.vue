<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="admin-sidebar">
      <div class="sidebar-logo">
        <h2>诺力CPQ</h2>
        <small>管理后台</small>
      </div>
      <el-menu
        :default-active="route.path"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>控制台</span>
        </el-menu-item>
        <el-menu-item index="/admin/products">
          <el-icon><Goods /></el-icon>
          <span>产品管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/quotes">
          <el-icon><Document /></el-icon>
          <span>报价管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/portal/products">
          <el-icon><Switch /></el-icon>
          <span>返回前台</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="admin-header">
        <span>{{ auth.user?.name }} ({{ auth.user?.role === 'ADMIN' ? '管理员' : '' }})</span>
        <el-button text @click="auth.logout()">退出</el-button>
      </el-header>
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store';
import { useRoute } from 'vue-router';

const auth = useAuthStore();
const route = useRoute();
</script>

<style scoped>
.admin-layout { height: 100vh; }
.admin-sidebar { background: #304156; overflow-y: auto; }
.sidebar-logo { padding: 20px; text-align: center; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); }
.sidebar-logo h2 { font-size: 16px; margin: 0; }
.sidebar-logo small { font-size: 11px; opacity: 0.6; }
.admin-header {
  display: flex; justify-content: flex-end; align-items: center;
  background: #fff; border-bottom: 1px solid #e6e6e6; gap: 16px; height: 52px;
}
.admin-main { background: #f0f2f5; padding: 24px; }
</style>
