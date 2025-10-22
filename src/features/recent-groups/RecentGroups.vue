<script setup lang="ts">
import Button from '@/components/ui/Button.vue';
import Flex from '@/components/ui/Flex.vue';
import Typography from '@/components/ui/Typography.vue';
import { LS_KEY, QUERY_KEY } from '@/constants/key';
import { useApiClient } from '@/hooks/useApiClient';
import { useLocalDBStore } from '@/stores/local-db';
import type { Group } from '@/types/entities';
import { getImgUrl } from '@/utils/get-asset';
import { useQuery } from '@tanstack/vue-query';
import { match } from 'ts-pattern';
import { computed, ref, toRaw, watch } from 'vue';
import RecentGroupItem from './RecentGroupItem.vue';
import Sorting, { sortOptions } from './Sorting.vue';

const client = useApiClient();
const localStoreDB = useLocalDBStore();
const showHidden = ref(Boolean(localStorage.getItem(LS_KEY.SHOW_HIDDEN_GROUPS)));

const groupIds = computed(() => localStoreDB.joinedGroups.map((group) => group.groupId));
const queryKey = computed(() => [QUERY_KEY.GROUP, groupIds]);
const hasHiddenGroups = computed(() => localStoreDB.hiddenGroups.length > 0);

const { isPending, data, isError } = useQuery({
	queryKey,
	queryFn: () => client.fetchGroups(groupIds.value),
});

const sortOpt = ref(
	(() => {
		const savedSortKey = localStorage.getItem(LS_KEY.RECENT_GROUP_SORT_KEY);
		if (!savedSortKey) return sortOptions[0];
		return sortOptions.find((opt) => opt.key === savedSortKey) || sortOptions[0];
	})(),
);

// Remove not found groups from local store
watch(
	() => data.value?.notFoundIds,
	(notFoundIds) => {
		notFoundIds?.length && localStoreDB.removeFromGroups(notFoundIds);
	},
);

const sortGroups = (groups: Group[]) => {
	const { by, order } = sortOpt.value;

	const compareFn = match([by, order])
		.returnType<((a: Group, b: Group) => number) | null>()
		.with(
			['createdAt', 'desc'],
			() => (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		)
		.with(
			['createdAt', 'asc'],
			() => (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
		)
		.with(['name', 'asc'], () => (a, b) => a.name.localeCompare(b.name))
		.with(['name', 'desc'], () => (a, b) => b.name.localeCompare(a.name))
		.with(
			['updatedAt', 'desc'],
			() => (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
		)
		.with(['lastOpened', 'desc'], () => {
			const lastOpened = toRaw(localStoreDB.lastOpenedGroups);
			if (!Object.keys(lastOpened).length) return null;

			return (a, b) => {
				return (lastOpened[b.id] || 0) - (lastOpened[a.id] || 0);
			};
		})
		.otherwise(() => null);

	return compareFn ? [...groups].sort(compareFn) : groups;
};

const toggleShowHidden = () => {
	showHidden.value = !showHidden.value;
	showHidden.value
		? localStorage.setItem(LS_KEY.SHOW_HIDDEN_GROUPS, '1')
		: localStorage.removeItem(LS_KEY.SHOW_HIDDEN_GROUPS);
};

const groups = computed<Group[]>(() => {
	const pinned: Group[] = [];
	const unpinned: Group[] = [];
	const filtered =
		(hasHiddenGroups.value && showHidden.value) || !hasHiddenGroups.value
			? data.value?.groups
			: data.value?.groups.filter((g) => !localStoreDB.hiddenGroups.includes(g.id));

	filtered?.forEach((g) => {
		localStoreDB.pinnedGroups.includes(g.id) ? pinned.push(g) : unpinned.push(g);
	});

	return [
		...(sortOpt.value ? sortGroups(pinned) : pinned),
		...(sortOpt.value ? sortGroups(unpinned) : unpinned),
	];
});
</script>

<template>
	<Flex stack class="gap-4 h-full py-4 grow overflow-hidden">
		<Flex class="justify-between px-4 gap-1">
			<Typography variant="lgSemiBold" class="text-black">Nhóm của bạn</Typography>
			<Flex class="gap-2 shrink-0">
				<Button
					v-if="hasHiddenGroups"
					variant="outlined"
					shape="rounded"
					color="neutral"
					size="sm"
					class="shrink-0 border-gray-400 gap-1"
					@click="toggleShowHidden">
					<span
						class="icon"
						:class="showHidden ? 'msi-visibility-off-rounded' : 'msi-visibility-rounded'"></span>
					({{ localStoreDB.hiddenGroups.length }})
				</Button>
				<Sorting v-model="sortOpt" />
			</Flex>
		</Flex>

		<Flex v-if="isPending" stack class="gap-4 px-4">
			<div v-for="i in 4" :key="i" class="skeleton h-24 w-full rounded-2xl"></div>
		</Flex>
		<Typography v-else-if="isError" variant="smMedium" class="text-red-400 text-center">
			Đã có lỗi xảy ra, vui lòng thử lại sau
		</Typography>
		<img
			v-else-if="!groups.length"
			:src="getImgUrl('no-groups.svg')"
			class="size-[300px] mx-auto" />
		<Flex v-else stack class="gap-4 px-4 pb-4 overflow-auto">
			<RecentGroupItem v-for="group in groups" :key="group.id" :group="group" />
		</Flex>
	</Flex>
</template>
