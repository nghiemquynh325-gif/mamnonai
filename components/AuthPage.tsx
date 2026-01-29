
import React, { useState } from 'react';
import { User } from '../types';
import { login, register, forgotPassword } from '../services/authService';
import { Heart, User as UserIcon, Lock, Mail, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT';

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  // Form states - Pre-fill admin account for easy testing
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@mamnon.ai');
  const [password, setPassword] = useState('admin123');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    // Keep admin credentials for convenience or clear them if preferred
    // setPassword('');
    // setConfirmPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const user = await login(email, password, rememberMe);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp cô ơi!");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu nên dài ít nhất 6 ký tự để bảo mật hơn.");
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password);
      setSuccessMsg("Đăng ký thành công! Cô vui lòng đăng nhập nhé.");
      setMode('LOGIN');
      // setPassword(''); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const msg = await forgotPassword(email);
      setSuccessMsg(msg);
      setTimeout(() => setMode('LOGIN'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-fade-in-up">
        
        {/* Decorative Header */}
        <div className="bg-pink-500 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute bottom-[-20px] right-[-20px] w-24 h-24 bg-white rounded-full"></div>
          </div>
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
             <Heart className="text-pink-500 fill-pink-500" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-white">MamNonAI</h1>
          <p className="text-pink-100 text-sm">Trợ lý đắc lực cho cô giáo</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 border border-red-100">
               <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
               {error}
            </div>
          )}
           {successMsg && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-xl flex items-center gap-2 border border-green-100">
               <CheckCircle size={16} />
               {successMsg}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Đăng Nhập</h2>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="cogiao@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none text-gray-700 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input 
                    type={showPass ? "text" : "password"} 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none text-gray-700 transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-400" 
                  />
                  Ghi nhớ đăng nhập
                </label>
                <button type="button" onClick={() => { resetForm(); setMode('FORGOT'); }} className="text-pink-500 font-bold hover:underline">
                  Quên mật khẩu?
                </button>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? 'Đang vào lớp...' : <>Vào hệ thống <ArrowRight size={20}/></>}
              </button>

              <div className="text-center mt-6 text-sm text-gray-500">
                Cô chưa có tài khoản?{' '}
                <button type="button" onClick={() => { resetForm(); setMode('REGISTER'); }} className="text-pink-600 font-bold hover:underline">
                  Đăng ký ngay
                </button>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'REGISTER' && (
             <form onSubmit={handleRegister} className="space-y-4">
               <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Tạo Tài Khoản Mới</h2>
               
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tên cô giáo</label>
                 <div className="relative">
                   <UserIcon className="absolute left-3 top-3.5 text-gray-400" size={18} />
                   <input 
                     type="text" 
                     required
                     value={name}
                     onChange={e => setName(e.target.value)}
                     placeholder="Nguyễn Thị Lan"
                     className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none text-gray-700 transition-all"
                   />
                 </div>
               </div>
 
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                   <input 
                     type="email" 
                     required
                     value={email}
                     onChange={e => setEmail(e.target.value)}
                     placeholder="cogiao@example.com"
                     className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none text-gray-700 transition-all"
                   />
                 </div>
               </div>
 
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mật khẩu</label>
                 <div className="relative">
                   <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                   <input 
                     type={showPass ? "text" : "password"} 
                     required
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     placeholder="••••••••"
                     className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none text-gray-700 transition-all"
                   />
                   <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                     {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                   </button>
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nhập lại mật khẩu</label>
                 <div className="relative">
                   <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                   <input 
                     type="password"
                     required
                     value={confirmPassword}
                     onChange={e => setConfirmPassword(e.target.value)}
                     placeholder="••••••••"
                     className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none text-gray-700 transition-all"
                   />
                 </div>
               </div>
 
               <button 
                 type="submit" 
                 disabled={isLoading}
                 className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-200 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
               >
                 {isLoading ? 'Đang đăng ký...' : 'Đăng Ký'}
               </button>
 
               <div className="text-center mt-6 text-sm text-gray-500">
                 Cô đã có tài khoản rồi?{' '}
                 <button type="button" onClick={() => { resetForm(); setMode('LOGIN'); }} className="text-pink-600 font-bold hover:underline">
                   Đăng nhập
                 </button>
               </div>
             </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'FORGOT' && (
             <form onSubmit={handleForgot} className="space-y-4">
               <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Quên Mật Khẩu</h2>
               <p className="text-gray-500 text-sm text-center mb-4">Cô đừng lo, hãy nhập email vào đây, hệ thống sẽ gửi mật khẩu mới cho cô ngay.</p>
               
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email của cô</label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                   <input 
                     type="email" 
                     required
                     value={email}
                     onChange={e => setEmail(e.target.value)}
                     placeholder="cogiao@example.com"
                     className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none text-gray-700 transition-all"
                   />
                 </div>
               </div>
 
               <button 
                 type="submit" 
                 disabled={isLoading}
                 className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
               >
                 {isLoading ? 'Đang gửi...' : 'Gửi lại mật khẩu'}
               </button>
 
               <div className="text-center mt-6 text-sm text-gray-500">
                 <button type="button" onClick={() => { resetForm(); setMode('LOGIN'); }} className="text-gray-500 hover:text-gray-700 font-bold hover:underline flex items-center justify-center gap-1 mx-auto">
                    Quay lại đăng nhập
                 </button>
               </div>
             </form>
          )}

        </div>
      </div>
    </div>
  );
};
