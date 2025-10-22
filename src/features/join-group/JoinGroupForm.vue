<script setup lang="ts">
import Button from '@/components/ui/Button.vue';
import Flex from '@/components/ui/Flex.vue';
import FormControl from '@/components/ui/FormControl.vue';
import { PATH } from '@/constants/path';
import { useApiClient } from '@/hooks/useApiClient';
import { useToast } from '@/hooks/useToast';
import { getEnv } from '@/utils/get-env';
import { veeValidateFocusOnError } from '@/utils/helpers';
import { toTypedSchema } from '@vee-validate/zod';
import to from 'await-to-js';
import { useForm } from 'vee-validate';
import { useRouter } from 'vue-router';
import { z } from 'zod';

const emit = defineEmits<{ close: [] }>();

const client = useApiClient();
const router = useRouter();
const toast = useToast();
const schema = z.object({
	inviteLink: z.string().trim().nonempty('Bắt buộc').default(''),
});

type GroupForm = z.infer<typeof schema>;

const validationSchema = toTypedSchema(schema);

const { errors, handleSubmit, resetForm, defineField } = useForm<GroupForm>({ validationSchema });

const handleJoinGroup = handleSubmit(async ({ inviteLink }) => {
	const linkOrId = inviteLink.trim();

	const showErrorMessage = () => {
		toast.error('Link hoặc id nhóm hợp lệ');
	};

	if (!linkOrId) return showErrorMessage();

	const baseUrl = getEnv('VITE_BASE_URL');
	let groupId = linkOrId;

	if (linkOrId.startsWith(baseUrl)) {
		const isValid = linkOrId.includes(`${baseUrl}${PATH.GROUP.replace(':id', '')}`);
		if (!isValid) return showErrorMessage();

		groupId = linkOrId.split('/').pop()!;
	}

	const [error] = await to(client.fetchGroup(groupId));
	if (error) return showErrorMessage();

	router.push(PATH.GROUP.replace(':id', groupId));
}, veeValidateFocusOnError);

const handleClose = () => {
	resetForm({});
	emit('close');
};

const [inviteLink, inviteLinkProps] = defineField('inviteLink');
</script>

<template>
	<Flex stack class="gap-4" as="form" @submit="handleJoinGroup">
		<FormControl
			label="ID nhóm hoặc link mời"
			html-for="inviteLink"
			:error="Boolean(errors.inviteLink)"
			:helper-text="errors.inviteLink">
			<input
				type="text"
				class="input input-bordered w-full"
				placeholder="Nhập ID nhóm hoặc link mời tham gia."
				v-model="inviteLink"
				v-bind="inviteLinkProps"
				name="inviteLink"
				id="inviteLink"
				v-desktop-focus />
		</FormControl>

		<Flex class="gap-2" items-fluid>
			<Button variant="soft" color="grey" @click="handleClose">Đóng</Button>
			<Button type="submit">Tham gia</Button>
		</Flex>
	</Flex>
</template>
