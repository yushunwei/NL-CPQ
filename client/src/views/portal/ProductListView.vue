<template>
  <div>
    <h2 style="margin-bottom:20px">产品列表</h2>
    <el-row :gutter="20">
      <el-col v-for="p in productStore.products" :key="p.id" :span="8" style="margin-bottom:20px">
        <el-card shadow="hover" class="product-card" @click="$router.push(`/portal/config/${p.id}`)">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong>{{ p.name }}</strong>
              <el-tag>{{ p.sku }}</el-tag>
            </div>
          </template>
          <p>{{ p.description }}</p>
          <p style="color:#409eff;font-weight:bold;margin-top:8px">
            基础价: {{ Number(p.basePrice).toLocaleString() }} {{ p.currency }}
          </p>
          <p style="color:#909399;font-size:12px;margin-top:4px">分类: {{ p.category?.name }}</p>
          <div class="card-action">
            <el-button type="danger" size="small" @click.stop="$router.push(`/portal/config/${p.id}`)">
              选配报价
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-empty v-if="productStore.products.length === 0" description="暂无产品" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useProductStore } from '@/stores/product.store';

const productStore = useProductStore();

onMounted(() => {
  productStore.fetchProducts();
});
</script>

<style scoped>
.product-card { cursor: pointer; }
.card-action { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
