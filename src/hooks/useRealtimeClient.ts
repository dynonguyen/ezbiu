import { inject, type Ref } from 'vue';
import type { IRealtimeClient } from '../apis/realtime-client';
import { CONTEXT_KEY } from '../constants/key';

export function useRealtimeClient() {
	const client = inject<Ref<IRealtimeClient>>(CONTEXT_KEY.REALTIME_CLIENT, {
		value: {},
	} as Ref<IRealtimeClient>);
	return client;
}
