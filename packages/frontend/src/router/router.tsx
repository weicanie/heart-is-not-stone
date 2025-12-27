import { lazy } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import LandingPage from '../views/Saas/LandingPage';
import { PrivateRoute_NS } from './PrivateRoute';
import UpdateBreadRouter from './UpdateBreadRouter';
const NotFoundPage = lazy(() => import('../views/Saas/NotFound'));
const Main = lazy(() => import('../views/Main'));
const UserManagePage = lazy(() => import('../views/Main/Manage/User'));
const ServiceManagePage = lazy(() => import('../views/Main/Manage/Service'));
const NotificationManagePage = lazy(() => import('../views/Main/Manage/Notifaction'));
const UserNotificationPage = lazy(() => import('../views/Main/Notifaction'));

const GameArchivePage = lazy(() => import('../views/Main/gameArchive'));
const LoginPage_NS = lazy(() => import('../views/LoginRegist/login'));
const RegisterPage_NS = lazy(() => import('../views/LoginRegist/regist'));

const manegeRoute = {
	path: '/main/manage',
	element: (
		<UpdateBreadRouter>
			<Outlet />
		</UpdateBreadRouter>
	),
	children: [
		{
			path: '',
			element: <Navigate to="/main/manage/user" />
		},
		{
			path: 'user',
			element: (
				<UpdateBreadRouter>
					<UserManagePage />
				</UpdateBreadRouter>
			)
		},
		{
			path: 'service',
			element: (
				<UpdateBreadRouter>
					<ServiceManagePage />
				</UpdateBreadRouter>
			)
		},
		{
			path: 'notification',
			element: (
				<UpdateBreadRouter>
					<NotificationManagePage />
				</UpdateBreadRouter>
			)
		}
	]
};

export const routes = [
	{
		path: '/main',
		element: (
			<PrivateRoute_NS>
				<Main />
			</PrivateRoute_NS>
		),
		children: [
			{
				path: '',
				element: <Navigate to="/main/archive" />
			},
			{
				path: 'archive',
				element: (
					<UpdateBreadRouter>
						<GameArchivePage />
					</UpdateBreadRouter>
				)
			},
			manegeRoute,
			// 通知中心
			{
				path: '/main/notification',
				element: (
					<UpdateBreadRouter>
						<UserNotificationPage />
					</UpdateBreadRouter>
				)
			}
		]
	},

	{
		path: 'login',
		element: <LoginPage_NS />
	},
	{
		path: 'register',
		element: <RegisterPage_NS />
	},
	{
		path: '',
		element: <Navigate to="/main/archive" />
	},
	{
		path: '*',
		element: <NotFoundPage />
	},
	{
		path: '/saas',
		element: <LandingPage />
	}
];

/* 用于面包屑导航 */
export const path_name: Record<string, string> = {
	'/main/archive': '档案管理',
	'/main/manage': '管理后台',
	'/main/manage/user': '用户管理',
	'/main/manage/service': '服务管理',
	'/main/manage/notification': '通知管理'
};

/* 用于侧边栏路由按钮hover时预加载 */
/**
 * 当前URL路径对应的页面的文件路径
 * 注意：动态import需要使用相对路径，@/别名在运行时无法解析
 */
export const sideBar_urlpath_filePath: Record<string, string> = {
	// 管理后台
	'/main/manage/user': '../views/Main/Manage/User',
	'/main/manage/service': '../views/Main/Manage/Service',
	'/main/manage/notification': '../views/Main/Manage/Notifaction'
};
