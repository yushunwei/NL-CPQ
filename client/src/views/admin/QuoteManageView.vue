<template>
  <div>
    <h2 style="margin-bottom:20px">报价管理</h2>

    <el-form inline style="margin-bottom:16px">
      <el-form-item label="状态">
        <el-select v-model="filterStatus" clearable placeholder="全部" @change="loadQuotes">
          <el-option label="草稿" value="DRAFT" />
          <el-option label="已发送" value="SENT" />
          <el-option label="已接受" value="ACCEPTED" />
          <el-option label="已拒绝" value="REJECTED" />
          <el-option label="已过期" value="EXPIRED" />
        </el-select>
      </el-form-item>
      <el-form-item label="客户名">
        <el-input v-model="filterCustomer" clearable placeholder="搜索客户" @change="loadQuotes" />
      </el-form-item>
    </el-form>

    <el-table :data="quotes" stripe v-loading="loading">
      <el-table-column prop="quoteNumber" label="报价号" width="180" />
      <el-table-column prop="product.name" label="产品" />
      <el-table-column prop="customerName" label="客户" />
      <el-table-column label="总价" width="150">
        <template #default="{ row }">
          {{ Number(row.total).toLocaleString() }} {{ row.currency }}
        </template>
      </el-table-column>
      <el-table-column prop="createdBy.name" label="销售员" width="100" />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-select :model-value="row.status" @change="(v: string) => updateStatus(row.id, v)" size="small">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已发送" value="SENT" />
            <el-option label="已接受" value="ACCEPTED" />
            <el-option label="已拒绝" value="REJECTED" />
            <el-option label="已过期" value="EXPIRED" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="日期" width="120">
        <template #default="{ row }">
          {{ new Date(row.quotationDate).toLocaleDateString('zh-CN') }}
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page" :total="total" :page-size="20"
      layout="prev, pager, next" @current-change="loadQuotes" style="margin-top:16px;justify-content:center"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/client';
import { ElMessage } from 'element-plus';

const quotes = ref([]);
const loading = ref(false);
const page = ref(1);
const total = ref(0);
const filterStatus = ref('');
const filterCustomer = ref('');

onMounted(loadQuotes);

async function loadQuotes() {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/quotes', {
      params: {
        page: page.value,
        status: filterStatus.value || undefined,
        customerName: filterCustomer.value || undefined,
      },
    });
    quotes.value = data.items;
    total.value = data.total;
  } finally { loading.value = false; }
}

async function updateStatus(id: number, status: string) {
  await api.put(`/admin/quotes/${id}/status`, { status });
  ElMessage.success('状态已更新');
  loadQuotes();
}
</script>
