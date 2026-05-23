import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api/client';

export interface OptionValue {
  id: number;
  label: string;
  priceDelta: number;
  isDefault: boolean;
}

export interface OptionGroup {
  id: number;
  name: string;
  description: string | null;
  isRequired: boolean;
  isMultiSelect: boolean;
  optionValues: OptionValue[];
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  basePrice: number;
  currency: string;
  category: { id: number; name: string };
  standardSpecs: { id: number; description: string }[];
  optionGroups: OptionGroup[];
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([]);
  const currentProduct = ref<Product | null>(null);

  async function fetchProducts() {
    const { data } = await api.get('/portal/products');
    products.value = data;
  }

  async function fetchProductConfig(id: number) {
    const { data } = await api.get(`/portal/products/${id}`);
    currentProduct.value = data;
    return data as Product;
  }

  return { products, currentProduct, fetchProducts, fetchProductConfig };
});
