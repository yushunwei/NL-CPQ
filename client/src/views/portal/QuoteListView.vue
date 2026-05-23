<template>
  <div>
    <div class="page-header">
      <h2>我的报价</h2>
      <el-button type="primary" @click="$router.push('/portal/products')">新建报价</el-button>
    </div>

    <el-form inline style="margin-bottom:16px">
      <el-form-item label="状态筛选">
        <el-select v-model="filterStatus" clearable placeholder="全部" @change="loadQuotes">
          <el-option label="草稿" value="DRAFT" />
          <el-option label="已发送" value="SENT" />
          <el-option label="已接受" value="ACCEPTED" />
          <el-option label="已拒绝" value="REJECTED" />
          <el-option label="已过期" value="EXPIRED" />
        </el-select>
      </el-form-item>
    </el-form>

    <el-table :data="quoteStore.quotes" stripe v-loading="loading" @row-click="(row: any) => $router.push(`/portal/quotes/${row.id}`)" style="cursor:pointer">
      <el-table-column prop="quoteNumber" label="报价号" width="180" />
      <el-table-column prop="product.name" label="产品" />
      <el-table-column prop="customerName" label="客户" />
      <el-table-column label="总价">
        <template #default="{ row }">
          {{ Number(row.total).toLocaleString() }} {{ row.currency }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="日期" width="120">
        <template #default="{ row }">
          {{ new Date(row.quotationDate).toLocaleDateString('zh-CN') }}
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :total="quoteStore.total"
      :page-size="20"
      layout="prev, pager, next"
      @current-change="loadQuotes"
      style="margin-top:16px;justify-content:center"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuoteStore } from '@/stores/quote.store';

const quoteStore = useQuoteStore();
const loading = ref(false);
const page = ref(1);
const filterStatus = ref('');

onMounted(() => loadQuotes());

async function loadQuotes() {
  loading.value = true;
  try { await quoteStore.fetchMyQuotes(page.value, filterStatus.value || undefined); }
  finally { loading.value = false; }
}

function statusType(s: string) {
  const map: Record<string, string> = { DRAFT: 'info', SENT: 'warning', ACCEPTED: 'success', REJECTED: 'danger', EXPIRED: 'info' };
  return map[s] || 'info';
}

function statusLabel(s: string) {
  const map: Record<string, string> = { DRAFT: '草稿', SENT: '已发送', ACCEPTED: '已接受', REJECTED: '已拒绝', EXPIRED: '已过期' };
  return map[s] || s;
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
</style>
