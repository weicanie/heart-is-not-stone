import type { ServerDataFormat } from '@not_stone/shared';
import { Requester, type RequestConfig } from './requester';

const config: RequestConfig<unknown, ServerDataFormat> = {
	baseURL: import.meta.env.VITE_NOT_STONE_BASE_URL || '/not_stone_api',
	timeout: 100000,
	//这里设置实例拦截器
	reqOKFn: [
		config => {
			//添加token
			const token = localStorage.getItem('not_stone_token');
			if (token && config.headers) {
				config.headers['Authorization'] = `Bearer ${token}`;
			}

			return config;
		}
	],
	resOKFn: [
		response => {
			return response;
		}
	]
};

export const instance_not_stone = new Requester<unknown, ServerDataFormat>(config);
