<template>
  <div class="login-page">
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <h2>诺力CPQ选配器</h2>
          <p>Noblelift CPQ</p>
        </div>
      </template>
      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="登录" name="login">
          <el-form @submit.prevent="doLogin" label-position="top">
            <el-form-item label="邮箱">
              <el-input v-model="loginForm.email" type="email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="loginForm.password" type="password" show-password placeholder="请输入密码" />
            </el-form-item>
            <el-button type="primary" native-type="submit" :loading="loading" style="width:100%">登录</el-button>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <el-form @submit.prevent="doRegister" label-position="top">
            <el-form-item label="姓名">
              <el-input v-model="registerForm.name" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="registerForm.email" type="email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="registerForm.password" type="password" show-password placeholder="请输入密码" />
            </el-form-item>
            <el-button type="success" native-type="submit" :loading="loading" style="width:100%">注册</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <div class="login-hint">
        <p>演示账号: admin@noblelift.com / admin123 | sales@noblelift.com / sales123</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth.store';

const auth = useAuthStore();
const activeTab = ref('login');
const loading = ref(false);

const loginForm = ref({ email: 'admin@noblelift.com', password: 'admin123' });
const registerForm = ref({ email: '', password: '', name: '' });

async function doLogin() {
  loading.value = true;
  try { await auth.login(loginForm.value.email, loginForm.value.password); }
  finally { loading.value = false; }
}

async function doRegister() {
  loading.value = true;
  try { await auth.register(registerForm.value.email, registerForm.value.password, registerForm.value.name); }
  finally { loading.value = false; }
}
</script>

<style scoped>
.login-page {
  display: flex; justify-content: center; align-items: center;
  min-height: 100vh; background: linear-gradient(135deg, #409eff 0%, #304156 100%);
}
.login-card { width: 420px; }
.login-header { text-align: center; }
.login-header h2 { margin: 0; font-size: 22px; color: #303133; }
.login-header p { margin: 4px 0 0; font-size: 13px; color: #909399; }
.login-tabs { margin-top: 8px; }
.login-hint { margin-top: 16px; text-align: center; font-size: 12px; color: #c0c4cc; }
</style>
