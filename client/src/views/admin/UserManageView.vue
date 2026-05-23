<template>
  <div>
    <h2 style="margin-bottom:20px">用户管理</h2>

    <el-table :data="users" stripe v-loading="loading">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column label="角色" width="120">
        <template #default="{ row }">
          <el-select :model-value="row.role" @change="(v: string) => updateUser(row.id, { role: v })" size="small">
            <el-option label="管理员" value="ADMIN" />
            <el-option label="销售员" value="SALES" />
            <el-option label="主管" value="MANAGER" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-switch :model-value="row.isActive" @change="(v: boolean) => updateUser(row.id, { isActive: v })" />
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="180">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString('zh-CN') }}
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page" :total="total" :page-size="20"
      layout="prev, pager, next" @current-change="loadUsers" style="margin-top:16px;justify-content:center"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/client';
import { ElMessage } from 'element-plus';

const users = ref([]);
const loading = ref(false);
const page = ref(1);
const total = ref(0);

onMounted(loadUsers);

async function loadUsers() {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/users', { params: { page: page.value } });
    users.value = data.items;
    total.value = data.total;
  } finally { loading.value = false; }
}

async function updateUser(id: string, payload: any) {
  await api.put(`/admin/users/${id}`, payload);
  ElMessage.success('用户已更新');
  loadUsers();
}
</script>
