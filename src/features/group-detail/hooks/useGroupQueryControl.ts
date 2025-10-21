import { useQueryClient } from '@tanstack/vue-query';
import { QUERY_KEY, REALTIME_EVENT } from '../../../constants/key';
import { useRealtimeClient } from '../../../hooks/useRealtimeClient';
import { useGroupContext } from './useGroupContext';

export function useGroupQueryControl() {
	const client = useRealtimeClient();

	const queryClient = useQueryClient();
	const { group } = useGroupContext();

	const refetchGroup = () => {
		queryClient.invalidateQueries({ queryKey: [QUERY_KEY.GROUP, group.value.id] });
		client.value?.channel?.send({
			type: 'broadcast',
			event: REALTIME_EVENT.GROUP_UPDATED,
			payload: {},
		});
	};

	const refetchBills = () => {
		queryClient.invalidateQueries({ queryKey: [QUERY_KEY.BILL_LIST, group.value.id] });
		client.value?.channel?.send({
			type: 'broadcast',
			event: REALTIME_EVENT.BILL_UPDATED,
			payload: {},
		});
	};

	return { refetchGroup, refetchBills };
}
