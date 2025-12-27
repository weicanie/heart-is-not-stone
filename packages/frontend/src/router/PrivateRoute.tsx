import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface PrivateRouteProps {
	children: React.ReactElement;
}

/* not stone */
const PrivateRoute_NS: React.FC<PrivateRouteProps> = ({ children }) => {
	const isLogin = Boolean(localStorage.getItem('not_stone_token'));
	const location = useLocation();
	if (!isLogin) {
		return <Navigate to="/not_stone/login" state={{ from: location }} replace />;
	}
	return children;
};

export { PrivateRoute_NS };
