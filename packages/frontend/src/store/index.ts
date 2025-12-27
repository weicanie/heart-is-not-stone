import { configureStore } from '@reduxjs/toolkit';
import { breadRouterReducer } from './bread-router';

import { loginReducer } from './login';
import { notificationReducer } from './notification';

const store = configureStore({
	reducer: {
		breadRouter: breadRouterReducer,
		login: loginReducer,
		notification: notificationReducer
	}
});

export default store;
