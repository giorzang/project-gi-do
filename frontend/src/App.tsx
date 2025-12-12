import { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom'; // Import Router
import { useAuthStore } from './store/useAuthStore';
import { Monitor, LogOut, Edit2, Check, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import MatchLayout from './components/match/MatchLayout';
import MatchLobby from './components/match/MatchLobby';
import MatchMapStats from './components/match/MatchMapStats';
import api from './services/api';

function App() {
  const { user, checkAuth, isLoading, logout } = useAuthStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    
    if (tokenFromUrl) {
      localStorage.setItem('authToken', tokenFromUrl);
      // Reload lại trang để xóa query param và đảm bảo App khởi tạo lại sạch sẽ với token mới
      window.location.href = '/';
      return;
    }
    
    checkAuth();
  }, []);

  const handleLogin = () => {
    // Sử dụng đường dẫn tương đối để tự động trỏ về đúng Host/Port hiện tại
    window.location.href = '/auth/steam';
  };

  const startEditing = () => {
    if (user) {
      setEditingName(user.username);
      setIsEditingName(true);
    }
  };

  const cancelEditing = () => {
    setIsEditingName(false);
    setEditingName('');
  };

  const saveName = async () => {
    if (!editingName.trim()) return;
    try {
      await api.put('/auth/profile', { username: editingName });
      await checkAuth(); // Reload user data
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update name", error);
      alert("Không thể đổi tên (Có thể tên quá dài hoặc lỗi server)");
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white hover:text-orange-500 transition-colors">
          <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center shadow-lg shadow-orange-600/20">
            <Monitor size={18} className="text-white"/>
          </div>
          CS2 Manager
        </Link>
        
        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-800 py-1.5 px-3 rounded-full border border-slate-700">
              <img src={user.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full"/>
              
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input 
                    type="text" 
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="bg-slate-900 border border-slate-600 rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:border-orange-500 w-32"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName();
                      if (e.key === 'Escape') cancelEditing();
                    }}
                  />
                  <button onClick={saveName} className="p-1 text-green-500 hover:bg-slate-700 rounded-full"><Check size={14}/></button>
                  <button onClick={cancelEditing} className="p-1 text-red-500 hover:bg-slate-700 rounded-full"><X size={14}/></button>
                </div>
              ) : (
                <>
                  <span className="font-medium text-sm">{user.username}</span>
                  <button onClick={startEditing} className="text-slate-500 hover:text-white transition-colors" title="Đổi tên">
                    <Edit2 size={12} />
                  </button>
                </>
              )}

              {user.is_admin === 1 && <span className="text-[10px] bg-red-600 px-1.5 py-0.5 rounded text-white font-bold tracking-wider">ADMIN</span>}
            </div>
            <button onClick={logout} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors" title="Đăng xuất">
              <LogOut size={20}/>
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="bg-[#171a21] hover:bg-[#2a475e] text-white px-5 py-2 rounded flex items-center gap-2 font-bold transition-all border border-slate-700 text-sm"
          >
             Đăng nhập Steam
          </button>
        )}
      </header>

      {/* Routing Content */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        
        {/* Nested Routes cho Matches */}
        <Route path="/matches/:id" element={<MatchLayout />}>
            <Route index element={<MatchLobby />} />          {/* /matches/1 */}
            <Route path=":mapnumber" element={<MatchMapStats />} /> {/* /matches/1/1 */}
        </Route>
        
        {/* Backward Compatibility (redirect nếu cần, hoặc để 404) */}
        {/* <Route path="/match/:id" element={<Navigate to="/matches/:id" />} /> */}
      </Routes>
    </div>
  );
}

export default App;