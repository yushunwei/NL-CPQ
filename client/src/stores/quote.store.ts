import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api/client';

export interface QuoteItem {
  id: number;
  optionGroupId: number;
  optionGroup: { name: string };
  optionValueId: number;
  optionValue: { label: string };
  priceDelta: number;
}

export interface Quote {
  id: number;
  quoteNumber: string;
  productId: number;
  product: { name: string; sku: string };
  customerName: string;
  numberOfUnits: number;
  status: string;
  subtotal: number;
  discountTotal: number;
  total: number;
  currency: string;
  quotationDate: string;
  validUntil: string;
  notes: string | null;
  createdBy: { name: string; email: string };
  items: QuoteItem[];
  discounts: { name: string; type: string; value: number }[];
  createdAt: string;
}

export const useQuoteStore = defineStore('quote', () => {
  const quotes = ref<Quote[]>([]);
  const currentQuote = ref<Quote | null>(null);
  const total = ref(0);

  async function fetchMyQuotes(page = 1, status?: string) {
    const { data } = await api.get('/portal/quotes', { params: { page, status } });
    quotes.value = data.items;
    total.value = data.total;
    return data;
  }

  async function fetchQuote(id: number) {
    const { data } = await api.get(`/portal/quotes/${id}`);
    currentQuote.value = data;
    return data as Quote;
  }

  async function createQuote(payload: {
    productId: number;
    customerName: string;
    numberOfUnits?: number;
    optionValueIds: number[];
    discountType?: string;
    discountValue?: number;
    notes?: string;
  }) {
    const { data } = await api.post('/portal/quotes', payload);
    return data as Quote;
  }

  async function updateQuote(id: number, payload: any) {
    const { data } = await api.put(`/portal/quotes/${id}`, payload);
    currentQuote.value = data;
    return data;
  }

  async function copyQuote(id: number) {
    const { data } = await api.post(`/portal/quotes/${id}/copy`);
    return data as Quote;
  }

  function getPdfUrl(id: number) {
    const token = localStorage.getItem('token');
    return `/api/portal/quotes/${id}/pdf?token=${token}`;
  }

  return { quotes, currentQuote, total, fetchMyQuotes, fetchQuote, createQuote, updateQuote, copyQuote, getPdfUrl };
});
