<script setup lang="ts">
import { provide } from 'vue';
import { type IApiClient } from './apis/api-client';
import { supabaseApiClient } from './apis/supabase';
import Toastify from './components/Toastify.vue';
import { CONTEXT_KEY } from './constants/key';

provide<IApiClient>(CONTEXT_KEY.API_CLIENT, supabaseApiClient);
</script>

<template>
	<RouterView />
	<Toastify />
</template>
