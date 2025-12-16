import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface PrivateRouteProps {
	children: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
	const isLogin = Boolean(localStorage.getItem('token'));
	const location = useLocation();
	if (!isLogin) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}
	return children;
};

/* not stone */
const PrivateRoute_NS: React.FC<PrivateRouteProps> = ({ children }) => {
	const isLogin = Boolean(localStorage.getItem('not_stone_token'));
	const location = useLocation();
	if (!isLogin) {
		return <Navigate to="/not_stone/login" state={{ from: location }} replace />;
	}
	return children;
};

export default PrivateRoute;
export { PrivateRoute_NS };
