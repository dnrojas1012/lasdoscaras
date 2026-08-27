<script setup lang="ts">

import { ref, onMounted } from 'vue'

import { useRoute, useRouter, RouterLink } from 'vue-router'

import { useAuthStore } from '../stores/auth.store'

import { useToastStore } from '../stores/toast.store'

import { useFavoritesStore } from '../stores/favorites.store'

import { ApiError, NetworkError } from '../api/apiClient'

import AuthCard from '../components/ui/AuthCard.vue'

import BaseInput from '../components/ui/BaseInput.vue'

import PasswordInput from '../components/ui/PasswordInput.vue'

const route = useRoute()

const router = useRouter()

const auth = useAuthStore()

const toast = useToastStore()

const favorites = useFavoritesStore()

const email = ref('')

const password = ref('')

const enviando = ref(false)

// Errores por campo y error general, separados.

const errores = ref<Record<string, string>>({})

const errorGeneral = ref<string | null>(null)

onMounted(() => {

  // Si el guard redirigio aca por sesion expirada, se avisa.

  if (route.query.expired === '1') {

    toast.warning('Su sesión ha expirado. Ingrese de nuevo.')

  }

})

function validar(): boolean {

  errores.value = {}

  if (email.value.trim().length === 0) {

    errores.value.email = 'El correo es obligatorio'

  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {

    errores.value.email = 'Ingrese un correo con formato válido'

  }

  if (password.value.length === 0) {

    errores.value.password = 'La contraseña es obligatoria'

  }

  return Object.keys(errores.value).length === 0

}

async function enviar(): Promise<void> {

  // Proteccion contra doble envio, exigida por la rubrica.

  if (enviando.value) return

  errorGeneral.value = null

  if (!validar()) return

  enviando.value = true

  try {

    await auth.login(email.value.trim(), password.value)

    // Se cargan los favoritos ANTES de navegar, para que el icono

    // se vea correcto desde el primer renderizado del tablero.

    await favorites.syncFromApi()

    toast.success(`Bienvenido, ${auth.user?.name ?? ''}`)

    // El guard guardo a donde iba el usuario antes de ser redirigido.

    const destino = (route.query.redirect as string) ?? '/'

    void router.push(destino)

  } catch (e) {

    if (e instanceof ApiError) {

      // Si el API devolvio errores por campo, se muestran inline.

      if (Object.keys(e.fieldErrors).length > 0) {

        errores.value = e.fieldErrors

      } else {

        errorGeneral.value = e.message

      }

    } else if (e instanceof NetworkError) {

      errorGeneral.value = e.message

    } else {

      errorGeneral.value = 'Ocurrió un error inesperado. Intentá de nuevo.'

    }

  } finally {

    // finally se ejecuta pase lo que pase. Sin esto, un error

    // dejaria el boton bloqueado para siempre.

    enviando.value = false

  }

}

</script>

<template>

  <AuthCard title="Iniciar sesión" subtitle="Ingrese para reaccionar, comentar y publicar.">

    <!-- @submit.prevent evita que el navegador recargue la pagina.

         Usar <form> permite enviar con la tecla Enter. -->

    <form class="form" @submit.prevent="enviar">

      <BaseInput

        id="login-email"

        v-model="email"

        label="Correo electrónico"

        type="email"

        autocomplete="email"

        placeholder="tucorreo@ejemplo.com"

        :error="errores.email"

        :disabled="enviando"

      />

      <PasswordInput

        id="login-pass"

        v-model="password"

        label="Contraseña"

        autocomplete="current-password"

        :error="errores.password"

        :disabled="enviando"

      />

      <p v-if="errorGeneral" class="form__general" role="alert">{{ errorGeneral }}</p>

      <button type="submit" class="form__submit" :disabled="enviando">

        {{ enviando ? 'Ingresando…' : 'Ingresar' }}

      </button>

    </form>

    <p class="form__foot">

      ¿No tiene cuenta?

      <RouterLink to="/register">Registrate acá</RouterLink>

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
