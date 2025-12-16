import { lazy } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { PrivateRoute_NS } from './PrivateRoute';

/* not stone */
const GameArchivePage = lazy(() => import('../views/NotStone/gameArchive'));
const LoginPage_NS = lazy(() => import('../views/NotStone/LoginRegist/login'));
const RegisterPage_NS = lazy(() => import('../views/NotStone/LoginRegist/regist'));

const isOnline = import.meta.env.VITE_IS_ONLINE === 'true';

export const routes = [
	{
		path: '/not_stone',
		element: <Outlet />,
		children: [
			{
				path: '',
				element: <Navigate to="/not_stone/archive" />
			},
			{
				path: 'archive',
				element: (
					<PrivateRoute_NS>
						<GameArchivePage />
					</PrivateRoute_NS>
				)
			},
			{
				path: 'login',
				element: <LoginPage_NS />
			},
			{
				path: 'register',
				element: <RegisterPage_NS />
			}
		]
	},
];

/* 用于面包屑导航 */
export const path_name: Record<string, string> = {

};

/* 用于侧边栏路由按钮hover时预加载 */
/**
 * 当前URL路径对应的页面的文件路径
 * 注意：动态import需要使用相对路径，@/别名在运行时无法解析
 */
export const sideBar_urlpath_filePath: Record<string, string> = {

};
