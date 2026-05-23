<template>
  <div v-if="quote">
    <div class="page-header">
      <el-button text @click="$router.push('/portal/quotes')">&lt; 返回报价列表</el-button>
      <div>
        <el-button @click="downloadPdf">下载 PDF</el-button>
        <el-button @click="printQuote">在线打印</el-button>
        <el-button type="primary" @click="$router.push(`/portal/config/${quote.productId}`)">编辑报价</el-button>
      </div>
    </div>

    <el-descriptions :column="2" border style="margin-bottom:20px">
      <el-descriptions-item label="报价号">{{ quote.quoteNumber }}</el-descriptions-item>
      <el-descriptions-item label="产品">{{ quote.product.name }} ({{ quote.product.sku }})</el-descriptions-item>
      <el-descriptions-item label="客户">{{ quote.customerName }}</el-descriptions-item>
      <el-descriptions-item label="数量">{{ quote.numberOfUnits }}</el-descriptions-item>
      <el-descriptions-item label="报价日期">{{ new Date(quote.quotationDate).toLocaleDateString('zh-CN') }}</el-descriptions-item>
      <el-descriptions-item label="有效期至">{{ quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('zh-CN') : 'N/A' }}</el-descriptions-item>
      <el-descriptions-item label="销售员">{{ quote.createdBy.name }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="statusType(quote.status)">{{ statusLabel(quote.status) }}</el-tag>
      </el-descriptions-item>
    </el-descriptions>

    <el-card>
      <template #header>配置明细</template>
      <el-table :data="quote.items" stripe>
        <el-table-column prop="optionGroup.name" label="配置组" />
        <el-table-column prop="optionValue.label" label="选择" />
        <el-table-column label="加价">
          <template #default="{ row }">
            {{ Number(row.priceDelta).toFixed(2) }} {{ quote.currency }}
          </template>
        </el-table-column>
      </el-table>

      <el-divider />
      <div style="text-align:right;font-size:16px">
        <p>小计: {{ Number(quote.subtotal).toLocaleString() }} {{ quote.currency }}</p>
        <p v-if="Number(quote.discountTotal) > 0" style="color:#f56c6c">
          折扣: -{{ Number(quote.discountTotal).toLocaleString() }} {{ quote.currency }}
        </p>
        <p style="font-size:20px;font-weight:bold;color:#409eff">
          总计: {{ Number(quote.total).toLocaleString() }} {{ quote.currency }}
        </p>
      </div>
    </el-card>

    <!-- Quote history -->
    <el-card v-if="quote.history?.length" style="margin-top:20px">
      <template #header>版本历史</template>
      <el-timeline>
        <el-timeline-item
          v-for="h in quote.history"
          :key="h.id"
          :timestamp="new Date(h.createdAt).toLocaleString('zh-CN')"
        >
          {{ h.changeNote || `版本 ${h.version}` }}
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuoteStore } from '@/stores/quote.store';

const route = useRoute();
const quoteStore = useQuoteStore();
const quote = ref<any>(null);

onMounted(async () => {
  const id = Number(route.params.id);
  quote.value = await quoteStore.fetchQuote(id);
});

function downloadPdf() {
  window.open(quoteStore.getPdfUrl(quote.value.id), '_blank');
}

function printQuote() {
  window.print();
}

function statusType(s: string) {
  const map: Record<string, string> = { DRAFT: '', SENT: 'warning', ACCEPTED: 'success', REJECTED: 'danger', EXPIRED: 'info' };
  return map[s] || '';
}

function statusLabel(s: string) {
  const map: Record<string, string> = { DRAFT: '草稿', SENT: '已发送', ACCEPTED: '已接受', REJECTED: '已拒绝', EXPIRED: '已过期' };
  return map[s] || s;
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
@media print {
  .page-header { display: none; }
  .el-button { display: none; }
}
</style>
