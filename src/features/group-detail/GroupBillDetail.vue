<script setup lang="ts">
import CurrencyText from '@/components/CurrencyText.vue';
import Loading from '@/components/Loading.vue';
import Button from '@/components/ui/Button.vue';
import Dialog from '@/components/ui/Dialog.vue';
import Flex from '@/components/ui/Flex.vue';
import Typography from '@/components/ui/Typography.vue';
import { CONTEXT_KEY, QUERY_KEY } from '@/constants/key';
import { PAYMENT_TRACKING_LABEL_MAPPING } from '@/constants/mapping';
import { PATH } from '@/constants/path';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useQuery } from '@tanstack/vue-query';
import { computed, nextTick, onUnmounted, provide, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useApiClient } from '../../hooks/useApiClient';
import PaymentTrackingHelper from '../new-group/PaymentTrackingHelper.vue';
import BalanceList from './balances/BalanceList.vue';
import BillList from './bills/BillList.vue';
import NewBillPopup from './bills/NewBillPopup.vue';
import GroupMenu from './GroupMenu.vue';
import { useGroupContext } from './hooks/useGroupContext';
import MemberList from './members/MemberList.vue';

type BillTabValue = 'bills' | 'balances';

const { group } = useGroupContext();
const router = useRouter();

const client = useApiClient();
const {
	data: bills,
	isPending,
	error,
} = useQuery({
	queryKey: [QUERY_KEY.BILL_LIST, group.value.id],
	queryFn: () => client.fetchBills(group.value.id),
});

const openNewBill = ref(false);
const showPaymentModeTooltip = ref(false);

watch(error, () => {
	if (error.value) throw error.value;
});

const billTab = computed(() => (router.currentRoute.value.query.tab as BillTabValue) ?? 'bills');
const total = computed(() => bills.value?.reduce((acc, bill) => acc + bill.amount, 0) || 0);
const billTabs = computed<Array<[BillTabValue, string]>>(() => [
	['bills', `Hoá đơn (${bills.value?.length || 0})`],
	['balances', 'Số dư'],
]);
const loading = computed(() => isPending.value || error.value);
let observer: IntersectionObserver | null = null;

const handleToggleStatistic = () => {
	const stickyStatistic = document.getElementById('sticky-statistic');

	if (!stickyStatistic) return;

	if (stickyStatistic.classList.contains('first-render')) {
		return stickyStatistic.classList.remove('first-render');
	}

	if (stickyStatistic.classList.contains('hidden')) {
		stickyStatistic.classList.remove('hidden');
	} else {
		stickyStatistic.classList.add('hidden');
	}
};

const handleTabChange = (tab: BillTabValue) => {
	router.replace({ query: { tab } });
};

const setupObserver = () => {
	const target = document.getElementById('observer-target');

	if (target) {
		observer && observer.disconnect();
		observer = new IntersectionObserver(handleToggleStatistic, { threshold: 1 });

		observer.observe(target);
	}
};

watch(loading, () => {
	if (!loading.value) {
		nextTick(setupObserver);
	} else {
		observer?.disconnect();
	}
});

onUnmounted(() => observer?.disconnect());
usePageTitle(group.value.name);

provide(CONTEXT_KEY.BILLS, bills);

const summary = computed<Array<[string, string | number, action?: () => void]>>(() => {
	const ptm = PAYMENT_TRACKING_LABEL_MAPPING[group.value.paymentTrackingMode];
	return [
		['icon msi-group-rounded', group.value.members?.length || 0],
		['icon msi-receipt-long-rounded', bills.value?.length || 0],
		[ptm.icon, '', () => (showPaymentModeTooltip.value = true)],
	];
});
</script>

<template>
	<Flex v-if="loading" center class="h-dvh">
		<Loading />
	</Flex>
	<Flex v-else stack class="bg-indigo-50 min-h-dvh overflow-auto" id="group-detail">
		<!-- Header -->
		<Flex class="px-4 py-2 gap-2 justify-between">
			<RouterLink :to="PATH.HOME">
				<Button
					variant="soft"
					color="grey"
					shape="circle"
					size="sm"
					class="bg-base-300 border-base-300 shrink-0"
					start-icon="icon msi-home-rounded"></Button>
			</RouterLink>

			<Flex stack class="grow gap-1" center>
				<Typography
					variant="mdSemiBold"
					class="text-black line-clamp-1 break-all"
					:title="group.name">
					{{ group.name }}
				</Typography>
				<Flex class="gap-3">
					<Flex
						v-for="(item, index) in summary"
						:key="index"
						class="gap-1 text-slate-500"
						@click="item[2]">
						<span :class="item[0]"></span>
						<Typography variant="xsRegular">{{ item[1] }}</Typography>
					</Flex>
					<Dialog v-model:open="showPaymentModeTooltip" header="Chế độ theo dõi thanh toán">
						<PaymentTrackingHelper />
					</Dialog>
				</Flex>
			</Flex>

			<GroupMenu />
		</Flex>

		<!-- Group statistic -->
		<Flex stack class="p-4" id="statistic">
			<Flex stack class="p-4 gap-2 bg-gray-800">
				<Typography variant="smRegular" class="text-white">Tổng chi tiêu nhóm:</Typography>
				<Flex class="gap-1 text-white !items-end">
					<CurrencyText
						:amount="total"
						amount-class="font-black text-[40px] leading-[43px]"
						:fixed="0"
						unit-class="text-2xl" />
				</Flex>
			</Flex>

			<Flex class="w-full h-4 justify-between bg-gray-800">
				<span :class="$style['half-circle']" class="rotate-90 relative right-1"></span>
				<div class="h-1 border-t border-dashed text-gray-100 w-full relative top-[1px]"></div>
				<span :class="$style['half-circle']" class="-rotate-90 relative left-1"></span>
			</Flex>

			<Flex stack class="p-4 gap-2 bg-gray-800 rounded-b-2xl shadow-lg">
				<Button start-icon="icon msi-add-rounded" @click="openNewBill = true">Thêm hoá đơn</Button>
			</Flex>

			<div id="observer-target" class="invisible"></div>
		</Flex>

		<!-- Sticky statistic -->
		<Flex
			id="sticky-statistic"
			class="hidden gap-2 justify-between fixed top-0 left-1/2 -translate-x-1/2 p-4 bg-gray-800 rounded-b-2xl w-full z-10 first-render max-w-screen-sm"
			center>
			<CurrencyText
				:amount="total"
				amount-class="text-2xl font-semibold text-white"
				unit-class="text-2xl text-white"
				:fixed="0" />
			<Button start-icon="icon msi-add-rounded" size="sm" @click="openNewBill = true">
				Thêm hoá đơn
			</Button>
		</Flex>

		<!-- Members -->
		<MemberList />

		<!-- Bills & Balances -->
		<Flex stack class="p-4 gap-3.5 bg-white rounded-t-2xl grow h-full">
			<div role="tablist" class="tabs tabs-boxed grid-cols-2">
				<a
					v-for="[value, label] in billTabs"
					:key="value"
					role="tab"
					class="tab"
					:class="{ 'tab-active': billTab === value }"
					@click="handleTabChange(value)">
					{{ label }}
				</a>
			</div>

			<div class="grow">
				<BillList v-if="billTab === 'bills'" />
				<BalanceList v-if="billTab === 'balances'" />
			</div>
		</Flex>
	</Flex>

	<!-- New bill -->
	<NewBillPopup v-if="openNewBill" v-model:open="openNewBill" />
</template>

<style module>
.half-circle {
	width: 12px;
	height: 6px;
	border-top-left-radius: 100px;
	border-top-right-radius: 100px;
	@apply bg-indigo-50;
}
</style>
