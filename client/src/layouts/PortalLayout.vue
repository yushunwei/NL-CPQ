<template>
  <el-container class="portal-layout">
    <el-header class="portal-header">
      <div class="header-left">
        <span class="logo">诺力CPQ选配器</span>
        <small>Noblelift CPQ</small>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-dropdown">
            <el-avatar :size="32" icon="UserFilled" />
            {{ auth.user?.name }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="quotes">我的报价</el-dropdown-item>
              <el-dropdown-item v-if="auth.user?.role === 'ADMIN'" command="admin">管理后台</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-main class="portal-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

function handleCommand(cmd: string) {
  if (cmd === 'logout') auth.logout();
  else if (cmd === 'admin') router.push('/admin/dashboard');
  else if (cmd === 'quotes') router.push('/portal/quotes');
}
</script>

<style scoped>
.portal-layout { height: 100vh; overflow: hidden; }
.portal-header {
  display: flex; justify-content: space-between; align-items: center;
  background: #409eff; color: #fff; padding: 0 24px; height: 56px;
}
.header-left .logo { font-size: 18px; font-weight: bold; }
.header-left small { margin-left: 8px; opacity: 0.8; font-size: 12px; }
.user-dropdown { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.portal-main { padding: 24px; background: #f5f7fa; }
</style>
