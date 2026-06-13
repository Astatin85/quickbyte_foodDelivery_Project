import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Customer
import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerRestaurants from './pages/customer/Restaurants';
import CustomerMenu from './pages/customer/Menu';
import CustomerCart from './pages/customer/Cart';
import CustomerOrders from './pages/customer/Orders';
import CustomerOrderDetail from './pages/customer/OrderDetail';
import CustomerCheckout from './pages/customer/Checkout';
import CustomerNotifications from './pages/customer/Notifications';
import CustomerProfile from './pages/customer/CustomerProfile';

// Restaurant
import RestaurantLayout from './pages/restaurant/RestaurantLayout';
import RestaurantDashboard from './pages/restaurant/Dashboard';
import RestaurantMenu from './pages/restaurant/Menu';
import RestaurantOrders from './pages/restaurant/Orders';
import RestaurantProfile from './pages/restaurant/Profile';
import OwnerProfile from './pages/restaurant/OwnerProfile';

// Delivery
import DeliveryLayout from './pages/delivery/DeliveryLayout';
import DeliveryDashboard from './pages/delivery/Dashboard';
import DeliveryHistory from './pages/delivery/History';
import DeliveryProfile from './pages/delivery/DeliveryProfile';
import DeliveryNotifications from './pages/delivery/Notifications';

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminRestaurants from './pages/admin/Restaurants';
import AdminOrders from './pages/admin/Orders';
import AdminAnalytics from './pages/admin/Analytics';
import AdminCommissions from './pages/admin/Commissions';
import AdminNotifications from './pages/admin/Notifications';

const ProtectedRoute = ({ children, roles }) => {
  const { isLoggedIn, user } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/login" replace />;
  return children;
};

const RoleRedirect = () => {
  const { user, isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  switch (user?.role) {
    case 'CUSTOMER': return <Navigate to="/customer/restaurants" replace />;
    case 'RESTAURANT_OWNER': return <Navigate to="/restaurant/dashboard" replace />;
    case 'DELIVERY_PARTNER': return <Navigate to="/delivery/dashboard" replace />;
    case 'ADMIN': return <Navigate to="/admin/dashboard" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<RoleRedirect />} />

        {/* Customer */}
        <Route path="/customer" element={<ProtectedRoute roles={['CUSTOMER']}><CartProvider><CustomerLayout /></CartProvider></ProtectedRoute>}>
          <Route index element={<Navigate to="restaurants" replace />} />
          <Route path="restaurants" element={<CustomerRestaurants />} />
          <Route path="restaurants/:id" element={<CustomerMenu />} />
          <Route path="cart" element={<CustomerCart />} />
          <Route path="checkout" element={<CustomerCheckout />} />
          <Route path="orders" element={<CustomerOrders />} />
          <Route path="orders/:id" element={<CustomerOrderDetail />} />
          <Route path="notifications" element={<CustomerNotifications />} />
          <Route path="profile" element={<CustomerProfile />} />
        </Route>

        {/* Restaurant */}
        <Route path="/restaurant" element={<ProtectedRoute roles={['RESTAURANT_OWNER']}><RestaurantLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<RestaurantDashboard />} />
          <Route path="profile" element={<RestaurantProfile />} />
          <Route path="menu" element={<RestaurantMenu />} />
          <Route path="orders" element={<RestaurantOrders />} />
          <Route path="owner-profile" element={<OwnerProfile />} />
        </Route>

        {/* Delivery */}
        <Route path="/delivery" element={<ProtectedRoute roles={['DELIVERY_PARTNER']}><DeliveryLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DeliveryDashboard />} />
          <Route path="history" element={<DeliveryHistory />} />
          <Route path="notifications" element={<DeliveryNotifications />} />
          <Route path="profile" element={<DeliveryProfile />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="restaurants" element={<AdminRestaurants />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="commissions" element={<AdminCommissions />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
