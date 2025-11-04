<script lang="ts">
export const AVT_UPLOADED_PREFIX = '_ezbiu_upload_';
</script>

<script setup lang="ts">
import Button from '@/components/ui/Button.vue';
import Dialog from '@/components/ui/Dialog.vue';
import { getImgUrl } from '@/utils/get-asset';
import { defineAsyncComponent, ref } from 'vue';
const AvatarUpload = defineAsyncComponent(() => import('./AvatarUpload.vue'));

const emit = defineEmits<{ change: [avt: string] }>();
const uploadedBase64Avt = ref<string>();

type Tab = {
	title: string;
	folder: string;
	noAvtSet: number;
	icon?: string;
	key?: string;
};

const tabs: Tab[] = [
	{ title: 'Capybara', folder: 'capybara', noAvtSet: 30 },
	{ title: 'Couple', folder: 'couple', noAvtSet: 18 },
	{ title: 'Meme', folder: 'meme', noAvtSet: 42 },
	{ title: '3D', folder: '3d', noAvtSet: 30 },
	{ title: 'Animals', folder: 'animal', noAvtSet: 24 },
	{ key: 'upload', title: 'Upload', icon: 'msi-upload-rounded', folder: 'upload', noAvtSet: 0 },
];

const currentTab = ref(tabs[0]);

const handleConfirmUpload = () => {
	if (uploadedBase64Avt.value) {
		emit('change', `${AVT_UPLOADED_PREFIX}${uploadedBase64Avt.value}`);
		uploadedBase64Avt.value = '';
	}
};
</script>

<template>
	<Dialog header="Chọn ảnh đại diện" class="!w-120">
		<div role="tablist" class="tabs tabs-lifted tabs-bordered pb-2 max-w-120 overflow-x-auto">
			<a
				v-for="tab in tabs"
				:key="tab.title"
				role="tab"
				class="tab"
				:class="{ 'tab-active': tab.folder === currentTab.folder }"
				@click="currentTab = tabs.find((t) => t.folder === tab.folder)!">
				<template v-if="!tab.icon">
					{{ tab.title }}
				</template>
				<span v-else class="icon size-5 text-gray-700" :class="tab.icon"></span>
			</a>
		</div>

		<div class="mt-4" v-if="currentTab.key === 'upload'">
			<Suspense>
				<AvatarUpload v-model="uploadedBase64Avt" />
				<template #fallback>
					<div class="skeleton h-[140px] w-full"></div>
				</template>
			</Suspense>
		</div>
		<div v-else class="grid grid-cols-6 gap-4 mt-4">
			<div
				class="avatar"
				v-for="i in currentTab.noAvtSet"
				:key="i"
				@click="$emit('change', `${currentTab.folder}/${i}.png`)">
				<div class="!size-full cursor-pointer hover:opacity-70">
					<img :src="getImgUrl(`avatar/${currentTab.folder}/${i}.png`)" />
				</div>
			</div>
		</div>

		<template #action v-if="uploadedBase64Avt">
			<Button @click="handleConfirmUpload">Xác nhận</Button>
		</template>
	</Dialog>
</template>
