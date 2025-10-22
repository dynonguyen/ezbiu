import { inject } from 'vue';
import type { IApiClient } from '../apis/api-client';
import { CONTEXT_KEY } from '../constants/key';

export const useApiClient = () => {
	return inject<IApiClient>(CONTEXT_KEY.API_CLIENT, {} as IApiClient);
};
