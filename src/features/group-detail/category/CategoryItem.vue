<script setup lang="ts">
import Button from '@/components/ui/Button.vue';
import Dialog from '@/components/ui/Dialog.vue';
import Flex from '@/components/ui/Flex.vue';
import Typography from '@/components/ui/Typography.vue';
import { useToast } from '@/hooks/useToast';
import type { Category } from '@/types/entities';
import { useMutation } from '@tanstack/vue-query';
import to from 'await-to-js';
import { ref } from 'vue';
import { useApiClient } from '../../../hooks/useApiClient';
import { useGroupContext } from '../hooks/useGroupContext';
import { useGroupQueryControl } from '../hooks/useGroupQueryControl';
import type { CategoryFormData } from './CategoryForm.vue';
import CategoryForm from './CategoryForm.vue';

const client = useApiClient();
const props = withDefaults(
	defineProps<{ category: Category; billCount?: number; editable?: boolean }>(),
	{ editable: false },
);
const emit = defineEmits<{ click: [] }>();

const { group } = useGroupContext();
const { isPending: isUpdating, mutateAsync: updateGroupAsync } = useMutation({
	mutationFn: client.updateGroup,
});
const { isPending: isDeleting, mutateAsync: deleteCategoryAsync } = useMutation({
	mutationFn: client.deleteCategory,
});
const { refetchGroup, refetchBills } = useGroupQueryControl();
const toast = useToast();

const openEdit = ref(false);

const handleDeleteCategory = async () => {
	if (isDeleting.value) return;

	const [err] = await to(
		deleteCategoryAsync({ groupId: group.value.id, categoryId: props.category.id }),
	);

	if (err) {
		toast.errorWithRetry('Xoá danh mục thất bại', handleDeleteCategory);
		return;
	}

	openEdit.value = false;
	refetchGroup();
	refetchBills();
};

const handleCategoryChange = async (form: CategoryFormData) => {
	const category = props.category;
	const newCategories =
		group.value.categories?.map((c) => (c.id === category.id ? { ...c, ...form } : c)) || [];

	const [err] = await to(
		updateGroupAsync({ id: group.value.id, updated: { categories: newCategories } }),
	);

	if (err) {
		toast.errorWithRetry('Cập nhật danh mục thất bại', () => handleCategoryChange(form));
		return;
	}

	openEdit.value = false;
	refetchGroup();
};

const handleClick = () => {
	if (props.editable) {
		openEdit.value = true;
	}
	emit('click');
};
</script>

<template>
	<Flex
		:key="category.id"
		class="gap-1 px-2 py-1 rounded-lg !items-start cursor-pointer hover:opacity-90 transition-opacity"
		:style="{ backgroundColor: category.color }"
		@click="handleClick">
		<Typography variant="smRegular" class="break-all">
			{{ category.label }}
		</Typography>
		<Typography variant="smRegular" v-if="billCount">({{ billCount }})</Typography>
		<slot name="end"></slot>
	</Flex>

	<!-- Edit form -->
	<Dialog v-if="editable" v-model:open="openEdit" header="Chỉnh sửa danh mục">
		<Flex stack class="py-2 gap-3">
			<CategoryForm
				:initial-values="{ label: category.label, color: category.color }"
				:is-submitting="isUpdating"
				submit-label="Cập nhật"
				@submit="handleCategoryChange">
				<template #action>
					<Button color="danger" size="sm" @click="handleDeleteCategory">Xoá</Button>
				</template>
			</CategoryForm>

			<Typography v-if="billCount" variant="smRegular" class="text-slate-600">
				Đang có
				<b>{{ billCount }}</b>
				hoá đơn sử dụng danh mục này.
			</Typography>
		</Flex>
	</Dialog>
</template>
