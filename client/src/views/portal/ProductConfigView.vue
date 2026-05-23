<template>
  <div v-if="product">
    <!-- Product header -->
    <div class="config-header">
      <el-button text @click="$router.push('/portal/products')">&lt; 返回产品列表</el-button>
      <h2>{{ product.name }} ({{ product.sku }})</h2>
      <p class="spec-text" v-for="spec in product.standardSpecs" :key="spec.id">{{ spec.description }}</p>
    </div>

    <el-row :gutter="24">
      <!-- Left: Configuration panel -->
      <el-col :span="16">
        <el-card v-for="group in product.optionGroups" :key="group.id" class="option-group-card"
          :class="{ 'is-required': group.isRequired }">
          <template #header>
            <div class="group-header">
              <span>{{ group.name }}</span>
              <el-tag v-if="group.isRequired" type="danger" size="small">必选</el-tag>
              <el-tag v-if="group.isMultiSelect" size="small" type="info">多选</el-tag>
            </div>
          </template>
          <p v-if="group.description" class="group-desc">{{ group.description }}</p>

          <!-- Single select (Radio) -->
          <el-radio-group
            v-if="!group.isMultiSelect"
            v-model="selections[group.id]"
            @change="onSelectionChange(group.id)"
          >
            <el-radio
              v-for="ov in group.optionValues"
              :key="ov.id"
              :value="ov.id"
              class="option-item"
            >
              {{ ov.label }}
              <span v-if="Number(ov.priceDelta) > 0" class="price-add">
                +{{ Number(ov.priceDelta).toFixed(0) }} {{ product.currency }}
              </span>
            </el-radio>
          </el-radio-group>

          <!-- Multi select (Checkbox) -->
          <el-checkbox-group
            v-else
            v-model="multiSelections[group.id]"
            @change="onMultiChange(group.id)"
          >
            <el-checkbox
              v-for="ov in group.optionValues"
              :key="ov.id"
              :value="ov.id"
              :label="ov.id"
              class="option-item"
            >
              {{ ov.label }}
              <span v-if="Number(ov.priceDelta) > 0" class="price-add">
                +{{ Number(ov.priceDelta).toFixed(0) }} {{ product.currency }}
              </span>
            </el-checkbox>
          </el-checkbox-group>
        </el-card>
      </el-col>

      <!-- Right: Price panel -->
      <el-col :span="8" class="price-col">
        <div class="price-panel">
          <el-card class="price-card">
            <template #header>
              <span style="font-size:18px;font-weight:bold">SALES PRICE</span>
            </template>

            <div class="price-total">
              {{ calcTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) }} {{ product.currency }}
            </div>

            <!-- Dealer discount -->
            <el-form label-position="top" style="margin-top:16px">
              <el-form-item label="Dealer Discount">
                <el-input-group>
                  <el-input-number v-model="discountValue" :min="0" :max="100" @change="updatePrice" />
                  <template #append>
                    <el-select v-model="discountType" style="width:100px" @change="updatePrice">
                      <el-option label="%" value="PERCENTAGE" />
                      <el-option label="EUR" value="FIXED" />
                    </el-select>
                  </template>
                </el-input-group>
              </el-form-item>
            </el-form>

            <el-divider />

            <!-- Price breakdown -->
            <div class="price-breakdown">
              <div class="price-line">
                <span>Assembled {{ product.sku }}</span>
                <strong>{{ Number(product.basePrice).toLocaleString() }} {{ product.currency }}</strong>
              </div>
              <div v-for="item in selectedItems" :key="item.id" class="price-line">
                <span>+ {{ item.label }}</span>
                <span>{{ Number(item.priceDelta).toFixed(0) }} {{ product.currency }}</span>
              </div>
              <el-divider style="margin:8px 0" />
              <div class="price-line" style="font-weight:bold">
                <span>Subtotal</span>
                <span>{{ subtotal.toFixed(2) }} {{ product.currency }}</span>
              </div>
              <div v-if="calcDiscount > 0" class="price-line" style="color:#f56c6c">
                <span>Discount</span>
                <span>-{{ calcDiscount.toFixed(2) }} {{ product.currency }}</span>
              </div>
              <div class="price-line total-line">
                <span>TOTAL</span>
                <span>{{ calcTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) }} {{ product.currency }}</span>
              </div>
            </div>
          </el-card>

          <!-- Customer info + Save -->
          <el-card style="margin-top:16px">
            <el-form label-position="top">
              <el-form-item label="客户名称" required>
                <el-input v-model="customerName" placeholder="请输入客户名称" />
              </el-form-item>
              <el-form-item label="数量">
                <el-input-number v-model="numberOfUnits" :min="1" @change="updatePrice" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="notes" type="textarea" :rows="2" />
              </el-form-item>
              <el-button type="primary" size="large" style="width:100%" @click="saveQuote" :loading="saving">
                SAVE
              </el-button>
            </el-form>
          </el-card>
        </div>
      </el-col>
    </el-row>

    <!-- Quotation metadata -->
    <div class="quote-meta" v-if="savedQuote">
      <el-descriptions :column="3" size="small" border>
        <el-descriptions-item label="报价号">{{ savedQuote.quoteNumber }}</el-descriptions-item>
        <el-descriptions-item label="报价日期">{{ new Date(savedQuote.quotationDate).toLocaleDateString('zh-CN') }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag>{{ savedQuote.status }}</el-tag></el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProductStore } from '@/stores/product.store';
import { useQuoteStore } from '@/stores/quote.store';
import { ElMessage } from 'element-plus';
import type { OptionGroup } from '@/stores/product.store';

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const quoteStore = useQuoteStore();

const product = ref<any>(null);
const selections = reactive<Record<number, number | null>>({});
const multiSelections = reactive<Record<number, number[]>>({});
const customerName = ref('');
const numberOfUnits = ref(1);
const discountValue = ref(0);
const discountType = ref('PERCENTAGE');
const notes = ref('');
const saving = ref(false);
const savedQuote = ref<any>(null);

onMounted(async () => {
  const id = Number(route.params.id);
  product.value = await productStore.fetchProductConfig(id);

  // Initialize selections with defaults
  for (const group of product.value.optionGroups) {
    if (group.isMultiSelect) {
      multiSelections[group.id] = group.optionValues.filter((v: any) => v.isDefault).map((v: any) => v.id);
    } else {
      const defaultVal = group.optionValues.find((v: any) => v.isDefault);
      selections[group.id] = defaultVal ? defaultVal.id : null;
    }
  }

});

function getSelectedOptionValueIds(): number[] {
  const ids: number[] = [];
  for (const group of product.value.optionGroups) {
    if (group.isMultiSelect) {
      ids.push(...(multiSelections[group.id] || []));
    } else {
      if (selections[group.id]) ids.push(selections[group.id]!);
    }
  }
  return ids;
}

const selectedItems = computed(() => {
  if (!product.value) return [];
  const items: { id: number; label: string; priceDelta: number }[] = [];
  for (const group of product.value.optionGroups) {
    if (group.isMultiSelect) {
      const ids = multiSelections[group.id] || [];
      for (const ov of group.optionValues) {
        if (ids.includes(ov.id)) items.push({ id: ov.id, label: `${group.name}: ${ov.label}`, priceDelta: Number(ov.priceDelta) });
      }
    } else {
      const id = selections[group.id];
      if (id) {
        const ov = group.optionValues.find((v: any) => v.id === id);
        if (ov) items.push({ id: ov.id, label: `${group.name}: ${ov.label}`, priceDelta: Number(ov.priceDelta) });
      }
    }
  }
  return items;
});

const subtotal = computed(() => {
  const base = Number(product.value?.basePrice || 0);
  const optionsSum = selectedItems.value.reduce((s, i) => s + i.priceDelta, 0);
  return (base + optionsSum) * numberOfUnits.value;
});

const calcDiscount = computed(() => {
  if (discountValue.value <= 0) return 0;
  if (discountType.value === 'PERCENTAGE') {
    return subtotal.value * discountValue.value / 100;
  }
  return discountValue.value;
});

const calcTotal = computed(() => subtotal.value - calcDiscount.value);

function onSelectionChange(_groupId: number) { updatePrice(); }
function onMultiChange(_groupId: number) { updatePrice(); }
function updatePrice() { /* reactive computed updates automatically */ }

async function saveQuote() {
  if (!customerName.value) return ElMessage.warning('请输入客户名称');
  saving.value = true;
  try {
    const payload = {
      productId: product.value.id,
      customerName: customerName.value,
      numberOfUnits: numberOfUnits.value,
      optionValueIds: getSelectedOptionValueIds(),
      discountType: discountValue.value > 0 ? discountType.value : undefined,
      discountValue: discountValue.value > 0 ? discountValue.value : undefined,
      notes: notes.value || undefined,
    };
    savedQuote.value = await quoteStore.createQuote(payload);
    ElMessage.success('报价已保存');
    router.push(`/portal/quotes/${savedQuote.value.id}`);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.config-header { margin-bottom: 20px; }
.config-header h2 { margin: 8px 0 4px; }
.spec-text { color: #909399; font-size: 13px; line-height: 1.6; }

.option-group-card { margin-bottom: 16px; }
.option-group-card.is-required { border-left: 3px solid #f56c6c; }
.group-header { display: flex; align-items: center; gap: 8px; }
.group-desc { color: #909399; font-size: 13px; margin-bottom: 8px; }

.option-item { display: flex; align-items: center; margin: 4px 0; width: 100%; }
.price-add { color: #67c23a; margin-left: 8px; font-size: 13px; }

.price-panel { position: sticky; top: 0; }
.price-total { font-size: 28px; font-weight: bold; color: #409eff; text-align: center; padding: 8px 0; }

.price-breakdown { font-size: 13px; }
.price-line { display: flex; justify-content: space-between; padding: 4px 0; }
.total-line { font-size: 16px; font-weight: bold; color: #409eff; margin-top: 4px; padding-top: 8px; border-top: 2px solid #409eff; }

.quote-meta { margin-top: 24px; }
</style>
