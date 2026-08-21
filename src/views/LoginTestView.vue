<script setup lang="ts">

import { ref } from 'vue'

import { useAuthStore } from '../stores/auth.store'

import { useToastStore } from '../stores/toast.store'

import { ApiError, NetworkError } from '../api/apiClient'

const auth = useAuthStore()

const toast = useToastStore()

const email = ref('admin@lasdoscaras.com')

const password = ref('Admin12345')

const cargando = ref(false)

async function onSubmit(): Promise<void> {

  // Protección contra doble envío: exigida por la rúbrica.

  if (cargando.value) return

  cargando.value = true

  try {

    await auth.login(email.value, password.value)

    toast.success(`Bienvenido, ${auth.user?.name ?? ''}`)

  } catch (error) {

    // instanceof permite distinguir qué tipo de error ocurrió

    // y darle al usuario un mensaje adecuado a cada caso.

    if (error instanceof ApiError) {

      toast.error(error.message)

    } else if (error instanceof NetworkError) {

      toast.error(error.message)

    } else {

      toast.error('Ocurrió un error inesperado.')

    }

  } finally {

    // finally se ejecuta pase lo que pase, con éxito o con error.

    // Sin esto, un error dejaría el botón deshabilitado para siempre.

    cargando.value = false

  }

}

</script>

<template>

  <section style="padding: 2rem; max-width: 24rem;">

    <h1>Prueba de login</h1>

    <div v-if="auth.isAuthenticated">

      <p>Sesión iniciada como <strong>{{ auth.user?.name }}</strong></p>

      <p>Rol: {{ auth.user?.role }}</p>

      <p>¿Es superadmin?: {{ auth.isSuperadmin ? 'Sí' : 'No' }}</p>

      <button @click="auth.logout()">Cerrar sesión</button>

    </div>

    <div v-else>

      <label for="email">Correo</label>

      <input id="email" v-model="email" type="email" style="width: 100%" />

      <label for="password">Contraseña</label>

      <input id="password" v-model="password" type="password" style="width: 100%" />

      <button :disabled="cargando" style="margin-top: 1rem" @click="onSubmit">

        {{ cargando ? 'Ingresando...' : 'Iniciar sesión' }}

      </button>

    </div>

  </section>

</template>
