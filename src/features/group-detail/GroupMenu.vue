<script setup lang="ts">
import InviteLink from '@/components/InviteLink.vue';
import Button from '@/components/ui/Button.vue';
import Dialog from '@/components/ui/Dialog.vue';
import Flex from '@/components/ui/Flex.vue';
import Typography from '@/components/ui/Typography.vue';
import { PATH } from '@/constants/path';
import { useToast } from '@/hooks/useToast';
import { useLocalDBStore } from '@/stores/local-db';
import type { Group } from '@/types/entities';
import { useMutation } from '@tanstack/vue-query';
import { onClickOutside } from '@vueuse/core';
import to from 'await-to-js';
import { ref, useId, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import { useApiClient } from '../../hooks/useApiClient';
import GroupForm from '../new-group/GroupForm.vue';
import { useBillsContext } from './hooks/useBillsContext';
import { useGroupContext } from './hooks/useGroupContext';
import { useGroupQueryControl } from './hooks/useGroupQueryControl';

const client = useApiClient();
const { group } = useGroupContext();
const bills = useBillsContext();
const toast = useToast();
const actionId = useId();
const router = useRouter();
const localDBStore = useLocalDBStore();
const outsideClickTarget = useTemplateRef('menu-target');

const { isPending: isUpdating, mutateAsync: updateMutateAsync } = useMutation({
	mutationFn: client.updateGroup,
});
const { isPending: isDeleting, mutateAsync: deleteMutateAsync } = useMutation({
	mutationFn: client.deleteGroup,
});
const { refetchGroup } = useGroupQueryControl();

const open = ref(false);
const openShareGroup = ref(false);
const openEditGroupName = ref(false);
const confirmDelete = ref(false);

const handleClose = () => {
	open.value = false;
};

const exportGroup = () => {
	import('./helpers/group-backup').then(({ exportGroupToExcel }) => {
		exportGroupToExcel(group.value, bills.value);
	});
};

const handleEditGroup = async (form: Partial<Group>) => {
	const [error] = await to(updateMutateAsync({ updated: form, id: group.value.id }));

	if (error) {
		void client.createErrorLog({ error: error?.message });
		return toast.errorWithRetry('Chỉnh sửa thất bại', () => handleEditGroup(form));
	}

	openEditGroupName.value = false;

	refetchGroup();
};

const handleDeleteGroup = async () => {
	const [error] = await to(deleteMutateAsync(group.value.id));
	localDBStore.unhideRecentGroup(group.value.id);

	if (error) {
		void client.createErrorLog({ error: error?.message });
		return toast.errorWithRetry('Xoá nhóm thất bại', () => handleDeleteGroup());
	}

	localDBStore.removeFromGroup(group.value.id);
	confirmDelete.value = false;
	refetchGroup();

	router.push(PATH.HOME);
};

onClickOutside(outsideClickTarget, handleClose);

const items = ref<
	Array<{ label: string; icon: string; action(): void; hasDivider?: boolean; itemClass?: string }>
>([
	{
		label: 'Cập nhật nhóm',
		icon: 'icon msi-edit-rounded size-5',
		hasDivider: true,
		action: () => (openEditGroupName.value = true),
	},
	{
		label: 'Chia sẻ nhóm',
		icon: 'icon msi-share size-5',
		action: () => (openShareGroup.value = true),
	},
	{
		label: 'Xuất ra file excel',
		icon: 'icon msi-file-save-rounded size-5',
		action: exportGroup,
	},
	{
		label: 'Xoá nhóm',
		icon: 'icon msi-delete size-5',
		itemClass: '[&>*]:!text-red-500',
		action: () => (confirmDelete.value = true),
	},
]);
</script>

<template>
	<details class="dropdown dropdown-bottom dropdown-end" :open="open">
		<summary>
			<Button
				variant="soft"
				color="grey"
				shape="circle"
				size="sm"
				class="bg-base-300 border-base-300 shrink-0"
				start-icon="icon msi-more-vert"
				:id="actionId"
				@click="open = !open" />
		</summary>

		<ul
			class="dropdown-content menu bg-gray-50 rounded-box z-[1] w-52 shadow-lg mt-4 p-0 overflow-hidden"
			ref="menu-target">
			<template v-for="(item, index) in items" :key="index">
				<Flex
					class="p-4 justify-between hover:bg-gray-100 cursor-pointer"
					:class="[
						item.itemClass,
						{ 'border-b border-gray-200': !item.hasDivider && index !== items.length - 1 },
					]"
					@click="
						() => {
							handleClose();
							item.action();
						}
					">
					<Typography variant="smRegular" class="text-black">{{ item.label }}</Typography>
					<span :class="item.icon" class="size-5 text-slate-600"></span>
				</Flex>
				<div v-if="item.hasDivider" class="h-2 bg-gray-200"></div>
			</template>
		</ul>
	</details>

	<Dialog v-model:open="openEditGroupName" header="Sửa tên nhóm" hide-close-button>
		<GroupForm
			v-if="openEditGroupName"
			:initial-values="{ name: group.name, paymentTrackingMode: group.paymentTrackingMode }"
			@submit="handleEditGroup">
			<template #form-action>
				<Flex class="gap-2" items-fluid>
					<Button variant="soft" color="grey" @click="openEditGroupName = false">Đóng</Button>
					<Button type="submit" :loading="isUpdating">Cập nhật</Button>
				</Flex>
			</template>
		</GroupForm>
	</Dialog>

	<Dialog v-model:open="openShareGroup" header="Mời tham gia nhóm">
		<InviteLink v-if="openShareGroup" :id="group.id" />
	</Dialog>

	<Dialog v-model:open="confirmDelete" header="Xoá nhóm">
		<Typography variant="smRegular" class="text-center">
			Bạn có chắc chắn muốn xoá nhóm không? Thao tác không thể hoàn tác.
		</Typography>

		<template #action>
			<Button color="danger" @click="handleDeleteGroup" :loading="isDeleting">Xoá</Button>
		</template>
	</Dialog>
</template>
