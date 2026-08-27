<script setup lang="ts">

import { ref, computed } from 'vue'

import { useRouter, RouterLink } from 'vue-router'

import { useAuthStore } from '../stores/auth.store'

import { useToastStore } from '../stores/toast.store'

import { useFavoritesStore } from '../stores/favorites.store'

import { ApiError, NetworkError } from '../api/apiClient'

import AuthCard from '../components/ui/AuthCard.vue'

import BaseInput from '../components/ui/BaseInput.vue'

import PasswordInput from '../components/ui/PasswordInput.vue'

const router = useRouter()

const auth = useAuthStore()

const toast = useToastStore()

const favorites = useFavoritesStore()

const nombre = ref('')

const email = ref('')

const password = ref('')

const confirmacion = ref('')

const enviando = ref(false)

const errores = ref<Record<string, string>>({})

const errorGeneral = ref<string | null>(null)

// Aviso en vivo mientras el usuario escribe la confirmacion,

// sin esperar a que envie el formulario.

const coincide = computed(

  () => confirmacion.value.length === 0 || confirmacion.value === password.value,

)

function validar(): boolean {

  errores.value = {}

  if (nombre.value.trim().length < 3) {

    errores.value.name = 'El nombre debe tener al menos 3 caracteres'

  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {

    errores.value.email = 'Ingrese un correo con formato válido'

  }

  if (password.value.length < 8) {

    errores.value.password = 'La contraseña debe tener al menos 8 caracteres'

  }

  if (confirmacion.value.length === 0) {

    errores.value.confirmacion = 'La confirmación de contraseña es obligatoria'

  } else if (confirmacion.value !== password.value) {

    errores.value.confirmacion = 'Las contraseñas no coinciden'

  }

  return Object.keys(errores.value).length === 0

}

async function enviar(): Promise<void> {

  if (enviando.value) return

  errorGeneral.value = null

  if (!validar()) return

  enviando.value = true

  try {

    // El store encadena registro, activacion e inicio de sesion.

    await auth.register(nombre.value.trim(), email.value.trim(), password.value)

    await favorites.syncFromApi()

    toast.success(`Cuenta creada. Bienvenido, ${auth.user?.name ?? ''}`)

    void router.push('/')

  } catch (e) {

    if (e instanceof ApiError) {

      if (Object.keys(e.fieldErrors).length > 0) {

        errores.value = e.fieldErrors

      } else if (e.status === 409) {

        // El 409 del registro va inline en el campo del correo,

        // como pide el enunciado.

        errores.value.email = 'El correo ya está registrado'

      } else {

        errorGeneral.value = e.message

      }

    } else if (e instanceof NetworkError) {

      errorGeneral.value = e.message

    } else {

      errorGeneral.value = 'Ocurrió un error inesperado. Intentá de nuevo.'

    }

  } finally {

    enviando.value = false

  }

}

</script>

<template>

  <AuthCard title="Crear cuenta" subtitle="Sumate para debatir con argumentos de las dos caras.">

    <form class="form" @submit.prevent="enviar">

      <BaseInput

        id="reg-name"

        v-model="nombre"

        label="Nombre completo"

        autocomplete="name"

        placeholder="Nombre y apellido"

        hint="Mínimo 3 caracteres"

        :error="errores.name"

        :disabled="enviando"

      />

      <BaseInput

        id="reg-email"

        v-model="email"

        label="Correo electrónico"

        type="email"

        autocomplete="email"

        placeholder="tucorreo@ejemplo.com"

        :error="errores.email"

        :disabled="enviando"

      />

      <PasswordInput

        id="reg-pass"

        v-model="password"

        label="Contraseña"

        autocomplete="new-password"

        show-strength

        :error="errores.password"

        :disabled="enviando"

      />

      <PasswordInput

        id="reg-confirm"

        v-model="confirmacion"

        label="Confirmar contraseña"

        autocomplete="new-password"

        :error="errores.confirmacion ?? (!coincide ? 'Las contraseñas no coinciden' : null)"

        :disabled="enviando"

      />

      <p v-if="errorGeneral" class="form__general" role="alert">{{ errorGeneral }}</p>

      <button type="submit" class="form__submit" :disabled="enviando">

        {{ enviando ? 'Creando cuenta…' : 'Crear cuenta' }}

      </button>

    </form>

    <p class="form__foot">

      ¿Ya tiene cuenta?

      <RouterLink to="/login">Ingresá acá</RouterLink>

    </p>

  </AuthCard>

</template>

<style scoped>

.form { display: flex; flex-direction: column; gap: 1rem; }

.form__general {

  background: color-mix(in srgb, var(--color-error) 12%, transparent);

  border: 1px solid var(--color-error);

  color: var(--color-error);

  border-radius: 6px;

  padding: 0.6rem 0.8rem;

  font-size: 0.85rem;

  margin: 0;

}

.form__submit {

  padding: 0.7rem;

  background: var(--color-primary);

  color: var(--color-primary-contrast);

  border: none;

  border-radius: 6px;

  font-size: 0.95rem;

  cursor: pointer;

}

.form__submit:disabled { opacity: 0.6; cursor: not-allowed; }

.form__foot { text-align: center; font-size: 0.88rem; color: var(--color-text-muted); margin-top: 1.2rem; }

.form__foot a { color: var(--color-primary); }

</style>
