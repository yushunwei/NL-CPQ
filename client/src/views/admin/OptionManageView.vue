<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h2>配置项管理</h2>
      <el-button type="primary" @click="addGroup">新增配置组</el-button>
    </div>

    <el-button text @click="$router.push('/admin/products')">&lt; 返回产品列表</el-button>

    <el-empty v-if="groups.length === 0" description="暂无配置组" />

    <div v-for="group in groups" :key="group.id" style="margin-bottom:24px">
      <el-card>
        <template #header>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <strong>{{ group.name }}</strong>
              <el-tag v-if="group.isRequired" type="danger" size="small" style="margin-left:8px">必选</el-tag>
              <el-tag v-if="group.isMultiSelect" size="small" type="info" style="margin-left:4px">多选</el-tag>
              <small style="margin-left:8px;color:#909399">排序: {{ group.sortOrder }}</small>
            </div>
            <div>
              <el-button size="small" @click="addValue(group.id)">添加值</el-button>
              <el-button size="small" @click="editGroup(group)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteGroup(group.id)">删除</el-button>
            </div>
          </div>
        </template>

        <el-table :data="group.optionValues" stripe size="small">
          <el-table-column prop="label" label="标签" />
          <el-table-column label="价格增量" width="150">
            <template #default="{ row }">
              {{ Number(row.priceDelta).toFixed(2) }} EUR
            </template>
          </el-table-column>
          <el-table-column label="默认" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.isDefault" type="success" size="small">默认</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="排序" width="80" prop="sortOrder" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" @click="editValue(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteValue(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- Group Dialog -->
    <el-dialog :title="editingGroup.id ? '编辑配置组' : '新增配置组'" v-model="groupDialogVisible" width="450px">
      <el-form label-position="top">
        <el-form-item label="名称">
          <el-input v-model="groupForm.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="groupForm.description" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="groupForm.sortOrder" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="groupForm.isRequired">必选</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="groupForm.isMultiSelect">允许多选</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveGroup" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- Value Dialog -->
    <el-dialog :title="editingValue.id ? '编辑配置值' : '新增配置值'" v-model="valueDialogVisible" width="400px">
      <el-form label-position="top">
        <el-form-item label="标签">
          <el-input v-model="valueForm.label" />
        </el-form-item>
        <el-form-item label="价格增量">
          <el-input-number v-model="valueForm.priceDelta" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="valueForm.sortOrder" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="valueForm.isDefault">设为默认值</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="valueDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveValue" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api/client';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const productId = Number(route.params.id);
const groups = ref<any[]>([]);
const saving = ref(false);

const groupDialogVisible = ref(false);
const valueDialogVisible = ref(false);
const editingGroup = ref<any>({});
const editingValue = ref<any>({});
const currentGroupId = ref(0);

const groupForm = reactive({ name: '', description: '', sortOrder: 0, isRequired: false, isMultiSelect: false });
const valueForm = reactive({ label: '', priceDelta: 0, sortOrder: 0, isDefault: false });

async function loadGroups() {
  const { data } = await api.get(`/admin/products/${productId}/options`);
  groups.value = data;
}

function addGroup() { editingGroup.value = {}; Object.assign(groupForm, { name: '', description: '', sortOrder: 0, isRequired: false, isMultiSelect: false }); groupDialogVisible.value = true; }
function editGroup(g: any) { editingGroup.value = g; Object.assign(groupForm, g); groupDialogVisible.value = true; }

async function saveGroup() {
  saving.value = true;
  try {
    if (editingGroup.value.id) {
      await api.put(`/admin/products/option-groups/${editingGroup.value.id}`, groupForm);
    } else {
      await api.post(`/admin/products/${productId}/option-groups`, groupForm);
    }
    ElMessage.success('已保存');
    groupDialogVisible.value = false;
    loadGroups();
  } finally { saving.value = false; }
}

async function deleteGroup(id: number) {
  await ElMessageBox.confirm('确定删除该配置组及所有值？', '确认', { type: 'warning' });
  await api.delete(`/admin/products/option-groups/${id}`);
  ElMessage.success('已删除');
  loadGroups();
}

function addValue(groupId: number) {
  currentGroupId.value = groupId;
  editingValue.value = {};
  Object.assign(valueForm, { label: '', priceDelta: 0, sortOrder: 0, isDefault: false });
  valueDialogVisible.value = true;
}

function editValue(v: any) {
  editingValue.value = v;
  Object.assign(valueForm, { label: v.label, priceDelta: Number(v.priceDelta), sortOrder: v.sortOrder, isDefault: v.isDefault });
  valueDialogVisible.value = true;
}

async function saveValue() {
  saving.value = true;
  try {
    if (editingValue.value.id) {
      await api.put(`/admin/products/option-values/${editingValue.value.id}`, valueForm);
    } else {
      await api.post(`/admin/products/option-groups/${currentGroupId.value}/values`, valueForm);
    }
    ElMessage.success('已保存');
    valueDialogVisible.value = false;
    loadGroups();
  } finally { saving.value = false; }
}

async function deleteValue(id: number) {
  await ElMessageBox.confirm('确定删除该配置值？', '确认', { type: 'warning' });
  await api.delete(`/admin/products/option-values/${id}`);
  ElMessage.success('已删除');
  loadGroups();
}

onMounted(loadGroups);
</script>
