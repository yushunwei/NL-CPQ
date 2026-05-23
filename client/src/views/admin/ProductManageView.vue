<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h2>产品管理</h2>
      <el-button type="primary" @click="openDialog()">新增产品</el-button>
    </div>

    <el-input v-model="search" placeholder="搜索 SKU 或名称" style="width:300px;margin-bottom:16px" @change="loadProducts" />

    <el-table :data="products" stripe v-loading="loading">
      <el-table-column prop="sku" label="SKU" width="120" />
      <el-table-column prop="name" label="名称" />
      <el-table-column label="基础价格" width="150">
        <template #default="{ row }">
          {{ Number(row.basePrice).toLocaleString() }} {{ row.currency }}
        </template>
      </el-table-column>
      <el-table-column prop="category.name" label="分类" width="120" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" @click="$router.push(`/admin/products/${row.id}/options`)">配置项</el-button>
          <el-button size="small" type="danger" @click="deleteProduct(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page" :total="total" :page-size="20"
      layout="prev, pager, next" @current-change="loadProducts" style="margin-top:16px;justify-content:center"
    />

    <el-dialog :title="editing.id ? '编辑产品' : '新增产品'" v-model="dialogVisible" width="500px" @close="resetForm">
      <el-form label-position="top">
        <el-form-item label="SKU">
          <el-input v-model="form.sku" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="基础价格">
          <el-input-number v-model="form.basePrice" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" style="width:100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProduct" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import api from '@/api/client';
import { ElMessage, ElMessageBox } from 'element-plus';

const products = ref([]);
const categories = ref<{ id: number; name: string }[]>([]);
const loading = ref(false);
const saving = ref(false);
const page = ref(1);
const total = ref(0);
const search = ref('');
const dialogVisible = ref(false);
const editing = ref<any>({});

const form = reactive({ sku: '', name: '', description: '', basePrice: 0, categoryId: 0 });

function resetForm() {
  editing.value = {};
  form.sku = ''; form.name = ''; form.description = ''; form.basePrice = 0; form.categoryId = 0;
}

function openDialog(row?: any) {
  if (row) {
    editing.value = row;
    form.sku = row.sku; form.name = row.name; form.description = row.description || '';
    form.basePrice = Number(row.basePrice); form.categoryId = row.categoryId;
  } else {
    resetForm();
  }
  dialogVisible.value = true;
}

async function loadProducts() {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/products', { params: { page: page.value, search: search.value || undefined } });
    products.value = data.items; total.value = data.total;
  } finally { loading.value = false; }
}

async function loadCategories() {
  const { data } = await api.get('/admin/products/categories');
  categories.value = data;
}

async function saveProduct() {
  saving.value = true;
  try {
    if (editing.value.id) {
      await api.put(`/admin/products/${editing.value.id}`, form);
      ElMessage.success('产品已更新');
    } else {
      await api.post('/admin/products', form);
      ElMessage.success('产品已创建');
    }
    dialogVisible.value = false;
    loadProducts();
  } finally { saving.value = false; }
}

async function deleteProduct(id: number) {
  await ElMessageBox.confirm('确定删除该产品？', '确认', { type: 'warning' });
  await api.delete(`/admin/products/${id}`);
  ElMessage.success('已删除');
  loadProducts();
}

onMounted(() => { loadProducts(); loadCategories(); });
</script>
