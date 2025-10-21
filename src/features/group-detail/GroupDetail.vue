<script setup lang="ts">
import Feedback from '@/components/Feedback.vue';
import Loading from '@/components/Loading.vue';
import Button from '@/components/ui/Button.vue';
import Flex from '@/components/ui/Flex.vue';
import { CONTEXT_KEY, QUERY_KEY, REALTIME_EVENT } from '@/constants/key';
import { PATH } from '@/constants/path';
import { useLocalDBStore } from '@/stores/local-db';
import { getImgUrl } from '@/utils/get-asset';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { IRealtimeClient } from '../../apis/realtime-client';
import { newRealtimeClient } from '../../apis/supabase';
import { useApiClient } from '../../hooks/useApiClient';
import GroupBillDetail from './GroupBillDetail.vue';

const route = useRoute();
const groupId = computed(() => route.params.id as string);
const localDBStore = useLocalDBStore();
const realtimeClient = ref<IRealtimeClient | null>(null);
const queryClient = useQueryClient();

const client = useApiClient();
const {
	data: group,
	isPending,
	isError,
} = useQuery({
	queryKey: [QUERY_KEY.GROUP, groupId],
	queryFn: () => client.fetchGroup(groupId.value),
});

provide(CONTEXT_KEY.GROUP, group);
provide(CONTEXT_KEY.REALTIME_CLIENT, realtimeClient);

watch(group, () => {
	if (group.value) {
		localDBStore.joinGroup(groupId.value);
		localDBStore.updateLastOpenedGroup(groupId.value);
	}
});

const realtimeEventListener = () => {
	realtimeClient.value?.channel
		?.on('broadcast', { event: REALTIME_EVENT.GROUP_UPDATED }, () => {
			queryClient.invalidateQueries({ queryKey: [QUERY_KEY.GROUP, groupId.value] });
		})
		.on('broadcast', { event: REALTIME_EVENT.BILL_UPDATED }, () => {
			queryClient.invalidateQueries({ queryKey: [QUERY_KEY.BILL_LIST, groupId.value] });
		})
		.subscribe();
};

onMounted(() => {
	document.getElementById('app-layout')?.classList.remove('h-dvh');

	realtimeClient.value = newRealtimeClient(groupId.value);
	realtimeEventListener();
});

onUnmounted(() => {
	document.getElementById('app-layout')?.classList.add('h-dvh');
	realtimeClient.value?.channel?.unsubscribe();
});
</script>

<template>
	<Flex v-if="isPending" center class="h-dvh px-4">
		<Loading />
	</Flex>
	<Feedback
		v-else-if="isError || !group"
		:img="getImgUrl('no-groups.svg')"
		title="Nhóm không tồn tại hoặc đã xảy ra lỗi."
		class="h-dvh px-4">
		<template #action>
			<Button
				class="w-fit"
				start-icon="icon msi-home-outline-rounded"
				size="sm"
				@click="$router.push(PATH.HOME)">
				Về trang chủ
			</Button>
		</template>
	</Feedback>
	<GroupBillDetail v-else />
</template>
