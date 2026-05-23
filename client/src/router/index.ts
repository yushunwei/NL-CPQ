import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/portal',
      component: () => import('@/layouts/PortalLayout.vue'),
      children: [
        {
          path: 'products',
          name: 'PortalProducts',
          component: () => import('@/views/portal/ProductListView.vue'),
        },
        {
          path: 'config/:id',
          name: 'PortalConfig',
          component: () => import('@/views/portal/ProductConfigView.vue'),
        },
        {
          path: 'quotes',
          name: 'PortalQuotes',
          component: () => import('@/views/portal/QuoteListView.vue'),
        },
        {
          path: 'quotes/:id',
          name: 'PortalQuoteDetail',
          component: () => import('@/views/portal/QuoteDetailView.vue'),
        },
      ],
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { admin: true },
      children: [
        {
          path: 'dashboard',
          name: 'AdminDashboard',
          component: () => import('@/views/admin/DashboardView.vue'),
        },
        {
          path: 'products',
          name: 'AdminProducts',
          component: () => import('@/views/admin/ProductManageView.vue'),
        },
        {
          path: 'products/:id/options',
          name: 'AdminOptions',
          component: () => import('@/views/admin/OptionManageView.vue'),
        },
        {
          path: 'quotes',
          name: 'AdminQuotes',
          component: () => import('@/views/admin/QuoteManageView.vue'),
        },
        {
          path: 'users',
          name: 'AdminUsers',
          component: () => import('@/views/admin/UserManageView.vue'),
        },
      ],
    },
    { path: '/', redirect: '/portal/products' },
    { path: '/:pathMatch(.*)*', redirect: '/portal/products' },
  ],
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (to.meta.public) {
    if (token && to.name === 'Login') {
      return next(user?.role === 'ADMIN' ? '/admin/dashboard' : '/portal/products');
    }
    return next();
  }

  if (!token) return next('/login');

  if (to.meta.admin && user?.role !== 'ADMIN') {
    return next('/portal/products');
  }

  next();
});

export default router;
