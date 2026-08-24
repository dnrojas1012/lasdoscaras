import { createRouter, createWebHistory } from 'vue-router'

import type { RouteRecordRaw } from 'vue-router'

import { applyGuards } from './guards'


// Importación diferida: el archivo se descarga solo cuando el usuario

// entra a esa ruta, no al arrancar la aplicación. Hace que la app

// cargue más rápido la primera vez.

const Placeholder = () => import('../views/PlaceholderView.vue')

// 'meta' es información extra que se le cuelga a cada ruta.
// En la ola 3, los guards la van a leer para decidir si dejan pasar.

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'board', component: () => import('../views/BoardView.vue') },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue'), meta: { guestOnly: true } },
  { path: '/categories/:id', name: 'category', component: Placeholder },
  { path: '/views/new', name: 'view-new', component: Placeholder, meta: { requiresAuth: true } },
  { path: '/views/:id', name: 'view-detail', component: () => import('../views/ViewDetailView.vue') },
  { path: '/views/:id/edit', name: 'view-edit', component: Placeholder, meta: { requiresAuth: true } },
  { path: '/profile', name: 'profile', component: Placeholder, meta: { requiresAuth: true } },
  { path: '/search', name: 'search', component: Placeholder },
  { path: '/authors/:id', name: 'author', component: Placeholder },
  { path: '/admin/users', name: 'admin-users', component: Placeholder, meta: { requiresAuth: true, requiresRole: 'SUPERADMIN' } },
  { path: '/admin/categories', name: 'admin-categories', component: Placeholder, meta: { requiresAuth: true, requiresRole: 'SUPERADMIN' } },
  { path: '/admin/moderation', name: 'admin-moderation', component: Placeholder, meta: { requiresAuth: true, requiresRole: 'SUPERADMIN' } },
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

