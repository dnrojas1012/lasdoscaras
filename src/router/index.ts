import { createRouter, createWebHistory } from 'vue-router'

import type { RouteRecordRaw } from 'vue-router'

import { applyGuards } from './guards'


// 'meta' es información extra que se le cuelga a cada ruta.

const routes: RouteRecordRaw[] = [
  
  { path: '/', name: 'board', component: () => import('../views/BoardView.vue') },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue'), meta: { guestOnly: true } },
  
  
  { path: '/categories/:id', name: 'category', component: () => import('../views/CategoryView.vue') },

  { path: '/views/new', name: 'view-new', component: () => import('../views/ViewFormView.vue'), meta: { requiresAuth: true } },
  { path: '/views/:id', name: 'view-detail', component: () => import('../views/ViewDetailView.vue') },
  { path: '/views/:id/edit', name: 'view-edit', component: () => import('../views/ViewFormView.vue'), meta: { requiresAuth: true } },
  { path: '/profile', name: 'profile', component: () => import('../views/ProfileView.vue'), meta: { requiresAuth: true } },
  { path: '/search', name: 'search', component: () => import('../views/SearchView.vue') },
  { path: '/authors/:id', name: 'author', component: () => import('../views/AuthorView.vue') },
    { path: '/admin/users', name: 'admin-users', component: () => import('../views/AdminUsersView.vue'), meta: { requiresAuth: true, requiresRole: 'SUPERADMIN' } },
    { path: '/admin/categories', name: 'admin-categories', component: () => import('../views/AdminCategoriesView.vue'), meta: { requiresAuth: true, requiresRole: 'SUPERADMIN' } },
    { path: '/admin/moderation', name: 'admin-moderation', component: () => import('../views/AdminModerationView.vue'), meta: { requiresAuth: true, requiresRole: 'SUPERADMIN' } },
  { path: '/403', name: 'forbidden', component: () => import('../views/ForbiddenView.vue') },
  // Esta última atrapa cualquier dirección que no coincida con las anteriores.
  // Por eso va al final: el router evalúa de arriba abajo.
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },

]

const router = createRouter({

  history: createWebHistory(),

  routes,

})


applyGuards(router)

export default router

