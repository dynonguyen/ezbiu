<script setup lang="ts">
import Button from '@/components/ui/Button.vue';
import Dialog from '@/components/ui/Dialog.vue';
import Flex from '@/components/ui/Flex.vue';
import Typography from '@/components/ui/Typography.vue';
import { useToast } from '@/hooks/useToast';
import type { BillId, Member, MemberId } from '@/types/entities';
import { toVND } from '@/utils/helpers';
import { useMutation } from '@tanstack/vue-query';
import to from 'await-to-js';
import { computed, ref } from 'vue';
import { useApiClient } from '../../../../hooks/useApiClient';
import BillItem from '../../bills/BillItem.vue';
import { isMemberPaid } from '../../helpers/utils';
import { useBillsContext } from '../../hooks/useBillsContext';
import { useGroupContext } from '../../hooks/useGroupContext';
import { useGroupQueryControl } from '../../hooks/useGroupQueryControl';
import BankQR from '../BankQR.vue';

const memberId = defineModel<string>('memberId', { default: '' });

const client = useApiClient();
const bills = useBillsContext();
const toast = useToast();
const { isPending: updating, mutateAsync } = useMutation({ mutationFn: client.markBillsAsPaid });
const { refetchBills } = useGroupQueryControl();
const { group } = useGroupContext();

const selected = ref<Set<BillId>>(new Set());
const showDetail = ref(false);
const confirmMarkPaid = ref(false);

const memberBills = computed(() => {
	return bills.value
		.filter(
			(b) =>
				b.createdBy !== memberId.value &&
				b.members[memberId.value] > 0 &&
				!isMemberPaid(b, memberId.value),
		)
		.map((b) => ({ ...b, amount: -b.members[memberId.value] }))
		.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
});

const totalPaid = computed(() => {
	return Array.from(selected.value).reduce((sum, billId) => {
		const bill = memberBills.value.find((b) => b.id === billId);
		return sum + -(bill?.amount || 0);
	}, 0);
});

const recipients = computed(() => {
	const recipientMap: Record<MemberId, { member: Member; amount: number }> = {};

	Array.from(selected.value).forEach((billId) => {
		const bill = memberBills.value.find((b) => b.id === billId);
		if (bill) {
			if (!recipientMap[bill.createdBy]) {
				recipientMap[bill.createdBy] = {
					member: group.value.members.find((m) => m.id === bill.createdBy)!,
					amount: 0,
				};
			}
			recipientMap[bill.createdBy].amount += -bill.amount;
		}
	});

	return Object.values(recipientMap);
});

const toggleBillSelection = (billId: BillId) => {
	if (selected.value.has(billId)) {
		selected.value.delete(billId);
	} else {
		selected.value.add(billId);
	}
};

const toggleAllBillsSelection = () => {
	if (memberBills.value.length === selected.value.size) {
		selected.value.clear();
	} else {
		memberBills.value.forEach((bill) => selected.value.add(bill.id));
	}
};

const handleClose = () => {
	memberId.value = '';
	selected.value.clear();
};

const handleMarkAsPaid = async () => {
	const [error] = await to(
		mutateAsync({
			groupId: group.value.id,
			billIds: Array.from(selected.value),
			memberId: memberId.value,
		}),
	);

	if (error) {
		void client.createErrorLog({ error: error?.message });
		return toast.errorWithRetry('Cập nhật thất bại', () => handleMarkAsPaid());
	}

	refetchBills();
	handleClose();
};
</script>

<template>
	<Dialog
		:open="Boolean(memberId)"
		@close="handleClose"
		header="Thanh toán dư nợ"
		:pt="{ body: { class: selected.size ? '!pb-0' : 'pb-4' } }">
		<Flex stack class="gap-2 h-full">
			<Flex class="pl-2 pr-4 py-2 justify-between">
				<Flex as="label" class="cursor-pointer gap-2">
					<input
						type="checkbox"
						class="checkbox checkbox-sm checkbox-primary"
						@click="toggleAllBillsSelection"
						:checked="memberBills.length === selected.size" />
					<Typography variant="smMedium">Chọn tất cả</Typography>
				</Flex>
			</Flex>

			<Flex stack class="gap-2 grow">
				<BillItem
					v-for="bill in memberBills"
					:key="bill.id"
					:bill="bill"
					:pt="{ currencyText: { showSign: true, class: 'text-red-500' } }"
					class="pl-2"
					@view-detail="toggleBillSelection(bill.id)">
					<template #start-action>
						<input
							type="checkbox"
							:checked="selected.has(bill.id)"
							class="checkbox checkbox-sm checkbox-primary mt-0.5" />
					</template>
				</BillItem>
			</Flex>

			<Flex
				v-if="selected.size"
				stack
				class="shrink-0 gap-1 sticky bottom-0 bg-white py-4 !items-start">
				<Typography variant="smRegular">
					Bạn cần trả:
					<b>{{ toVND(totalPaid) }}</b>
					cho
					<b>{{ recipients.length }}</b>
					người.
				</Typography>
				<Typography
					variant="smMedium"
					class="underline text-blue-600 cursor-pointer"
					@click="showDetail = true">
					Thông tin chuyển khoản
				</Typography>
			</Flex>
		</Flex>

		<template #action>
			<Button :disabled="!selected.size" @click="confirmMarkPaid = true">Đánh dấu đã trả</Button>
		</template>
	</Dialog>

	<Dialog v-model:open="showDetail" header="Thông tin chuyển khoản">
		<Flex stack class="gap-2 w-full">
			<Flex
				v-for="(recipient, index) in recipients"
				:key="recipient.member.id"
				class="gap-3 py-3 !items-start"
				:class="{ 'border-t border-dashed border-gray-300': index > 0 }">
				<Flex stack class="gap-2 grow" :class="$style['custom-bank-info']">
					<Typography v-if="!recipient.member.bankInfo" variant="smRegular">
						Số tiền cần chuyển cho
						<b>{{ recipient.member.name }}</b>
						là
						<b>{{ toVND(recipient.amount) }}</b>
					</Typography>

					<BankQR
						:amount="recipient.amount"
						:member="recipient.member"
						:bank-info="recipient.member.bankInfo" />
				</Flex>
			</Flex>
		</Flex>
	</Dialog>

	<Dialog v-model:open="confirmMarkPaid" header="Xác nhận đã thanh toán">
		<Typography variant="smRegular" class="text-center">
			Bạn có chắc chắn đã thanh toán số tiền đủ
			<b>{{ toVND(totalPaid) }}</b>
			cho
			<b>{{ recipients.length }}</b>
			người chưa? Thao tác không thể hoàn tác.
		</Typography>

		<template #action>
			<Button @click="handleMarkAsPaid" :loading="updating">Xác nhận</Button>
		</template>
	</Dialog>
</template>

<style module>
.custom-bank-info :global(.bank-info-detail) {
	border: none;
	padding: 0px;
}
</style>
