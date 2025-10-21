<script setup lang="ts">
import Button from '@/components/ui/Button.vue';
import Dialog from '@/components/ui/Dialog.vue';
import Flex from '@/components/ui/Flex.vue';
import { useToast } from '@/hooks/useToast';
import type { Member } from '@/types/entities';
import { useMutation } from '@tanstack/vue-query';
import to from 'await-to-js';
import { useApiClient } from '../../../hooks/useApiClient';
import { useGroupContext } from '../hooks/useGroupContext';
import { useGroupQueryControl } from '../hooks/useGroupQueryControl';
import type { MemberFormData } from './MemberForm.vue';
import MemberForm from './MemberForm.vue';

const props = defineProps<{ member: Member }>();
const open = defineModel('open', { default: false });

const client = useApiClient();
const { group } = useGroupContext();

const { mutateAsync: updateMutateAsync, isPending: isUpdating } = useMutation({
	mutationFn: client.updateMember,
});

const toast = useToast();
const { refetchGroup } = useGroupQueryControl();

const handleUpdate = async (form: MemberFormData) => {
	const [error] = await to(
		updateMutateAsync({ groupId: group.value.id, newValue: { ...form, id: props.member.id } }),
	);

	if (error) {
		return toast.errorWithRetry(error.message || 'Không thể cập nhật thành viên', () =>
			handleUpdate(form),
		);
	}

	open.value = false;
	refetchGroup();
};
</script>

<template>
	<Dialog v-model:open="open" header="Chỉnh sửa thành viên" hide-close-button>
		<MemberForm :initial-values="member as MemberFormData" @submit="handleUpdate">
			<template #action-btn>
				<Flex class="gap-2" items-fluid>
					<Button variant="soft" color="grey" @click="open = false">Đóng</Button>
					<Button type="submit" :loading="isUpdating">Cập nhật</Button>
				</Flex>
			</template>
		</MemberForm>
	</Dialog>
</template>
