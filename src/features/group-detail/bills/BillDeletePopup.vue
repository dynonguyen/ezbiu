<script setup lang="ts">
import Button from '@/components/ui/Button.vue';
import Dialog from '@/components/ui/Dialog.vue';
import Typography from '@/components/ui/Typography.vue';
import { useToast } from '@/hooks/useToast';
import type { BillId } from '@/types/entities';
import { useMutation } from '@tanstack/vue-query';
import to from 'await-to-js';
import { useApiClient } from '../../../hooks/useApiClient';
import { useBillsContext } from '../hooks/useBillsContext';
import { useGroupContext } from '../hooks/useGroupContext';
import { useGroupQueryControl } from '../hooks/useGroupQueryControl';

const client = useApiClient();
const { group } = useGroupContext();
const bills = useBillsContext();
const toast = useToast();
const { refetchBills } = useGroupQueryControl();

const { isPending: isDeleting, mutateAsync: deleteMutateAsync } = useMutation({
	mutationFn: client.deleteBill,
});

const deleteId = defineModel<BillId | null>({ default: null });

const handleDeleteBill = async () => {
	if (!deleteId.value) return;

	const [error] = await to(deleteMutateAsync({ groupId: group.value.id, billId: deleteId.value }));

	if (error) {
		void client.createErrorLog({ error: error?.message });
		return toast.errorWithRetry('Xoá bill thất bại', () => handleDeleteBill());
	}

	deleteId.value = null;
	refetchBills();
};
</script>

<template>
	<Dialog header="Xoá hoá đơn" :open="Boolean(deleteId)" @close="deleteId = null">
		<Typography variant="smRegular" class="text-center">
			Bạn có chắc chắn muốn xoá hoá đơn
			<b>"{{ bills.find((b) => b.id === deleteId)?.name }}"</b>
			không? Thao tác không thể hoàn tác.
		</Typography>

		<template #action>
			<Button color="danger" @click="handleDeleteBill" :loading="isDeleting">Xoá</Button>
		</template>
	</Dialog>
</template>
