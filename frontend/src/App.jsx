import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AuctionList from './pages/AuctionList';
import AuctionDetail from './pages/AuctionDetail';
import CreateAuction from './pages/CreateAuction';
import MyAuctions from './pages/MyAuctions';
import WonAuctions from './pages/WonAuctions';
import Watchlist from './pages/Watchlist';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auctions" element={<AuctionList />} />
        <Route path="/auctions/:id" element={<AuctionDetail />} />

        {/* Seller routes */}
        <Route
          path="/create-auction"
          element={
            <ProtectedRoute allowedRoles={['seller', 'admin']}>
              <CreateAuction />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-auctions"
          element={
            <ProtectedRoute allowedRoles={['seller', 'admin']}>
              <MyAuctions />
            </ProtectedRoute>
          }
        />

        {/* Buyer routes */}
        <Route
          path="/watchlist"
          element={
            <ProtectedRoute allowedRoles={['buyer', 'seller', 'admin']}>
              <Watchlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/won-auctions"
          element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <WonAuctions />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['buyer', 'seller', 'admin']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
