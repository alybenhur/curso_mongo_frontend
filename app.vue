<template>
  <div>
    <!-- Layout de autenticacion (login / register) -->
    <LayoutAuthLayout v-if="isAuthLayout">
      <NuxtPage />
    </LayoutAuthLayout>

    <!-- Layout principal (dashboard, curriculum, playground...) -->
    <LayoutDefaultLayout v-else-if="isDefaultLayout">
      <NuxtPage />
    </LayoutDefaultLayout>

    <!-- Sin layout (paginas especiales como diagnostic o 404) -->
    <NuxtPage v-else />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const isAuthLayout    = computed(() => route.meta.layout === 'auth')
const isDefaultLayout = computed(() =>
  route.meta.layout === 'default' || route.meta.layout === undefined
)
</script>

<style>
@import '~/assets/css/main.css';
</style>