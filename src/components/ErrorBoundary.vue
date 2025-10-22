<script setup lang="ts">
import { getAssetUrl } from '@/utils/get-asset';
import { onErrorCaptured, ref } from 'vue';
import { useApiClient } from '../hooks/useApiClient';
import Button from './ui/Button.vue';
import Flex from './ui/Flex.vue';
import Typography from './ui/Typography.vue';

const client = useApiClient();
const error = ref<Error | null>(null);

onErrorCaptured((err) => {
	error.value = err;
	console.error('ErrorBoundary:', error);
	void client.createErrorLog({ error: err.message });
	return false;
});

const handleReload = () => {
	error.value = null;
	window.location.reload();
};
</script>

<template>
	<slot v-if="Boolean(error)" name="fallback">
		<Flex stack class="max-w-md mx-auto my-12 gap-6">
			<img :src="getAssetUrl('img/server-error.svg')" />
			<Flex stack class="gap-4">
				<Flex stack>
					<Typography variant="displayMedium" class="text-center">Đã có lỗi xảy ra!</Typography>
					<Typography variant="smRegular" class="text-center text-gray-500">
						Reload trang để thử lại.
					</Typography>
				</Flex>

				<Flex center class="w-full">
					<Button start-icon="icon msi-refresh-rounded" size="sm" @click="handleReload">
						Reload
					</Button>
				</Flex>
			</Flex>
		</Flex>
	</slot>
	<slot v-else></slot>
</template>
