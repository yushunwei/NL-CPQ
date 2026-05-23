<template>
  <div>
    <h2>控制台</h2>
    <el-row :gutter="20" style="margin-top:20px">
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="产品型号" :value="stats.products" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="报价总数" :value="stats.quotes" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="用户数" :value="stats.users" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import api from '@/api/client';

const stats = reactive({ products: 0, quotes: 0, users: 0 });

onMounted(async () => {
  const [pRes, qRes, uRes] = await Promise.all([
    api.get('/admin/products', { params: { page: 1 } }),
    api.get('/admin/quotes', { params: { page: 1 } }),
    api.get('/admin/users', { params: { page: 1 } }),
  ]);
  stats.products = pRes.data.total;
  stats.quotes = qRes.data.total;
  stats.users = uRes.data.total;
});
</script>
