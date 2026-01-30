
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LessonForm } from './components/LessonForm';
import { PlanViewer } from './components/PlanViewer';
import { Settings } from './components/Settings';
import { Dashboard } from './components/Dashboard';
import { AuthPage } from './components/AuthPage';
import { ExperienceInitiative } from './components/ExperienceInitiative';
import { LessonRequest, SavedLessonPlan, User } from './types';
import { generateLessonPlan } from './services/geminiService';
import { savePlan } from './services/storageService';
import { logout } from './services/authService';
import { supabase } from './services/supabaseClient';
import { HashRouter } from 'react-router-dom';
import { LogOut, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [currentPage, setCurrentPage] = useState('dashboard');
  const [lessonPlan, setLessonPlan] = useState<string | null>(null);
  const [currentRequest, setCurrentRequest] = useState<LessonRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Trigger Dashboard reload

  // Lắng nghe trạng thái đăng nhập từ Supabase
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Use cached session first (no network call)
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError) {
          console.error("Auth session error:", authError);
          // If auth fails, we just proceed as logged out
        }

        if (session?.user) {
          // Set user immediately with email, fetch profile later
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.email?.split('@')[0] || 'Cô giáo'
          });

          // Mark auth as done immediately
          setIsAuthChecking(false);

          // Fetch profile in background (non-blocking)
          (async () => {
            try {
              const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
              if (profile?.full_name) {
                setUser(prev => prev ? { ...prev, name: profile.full_name } : null);
              }
            } catch (err) {
              console.log("Profile fetch error (using fallback):", err);
            }
          })();
        } else {
          setIsAuthChecking(false);
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
          // Ignore benign abort errors but still turn off loading
          setIsAuthChecking(false);
          return;
        }
        console.error("Unexpected error during auth check:", err);
        setIsAuthChecking(false);
      } finally {
        // Ensure we always turn off loading
        setIsAuthChecking(false);
      }
    };

    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profile?.full_name || session.user.email?.split('@')[0] || 'Cô giáo'
          });
        } else {
          setUser(null);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Ignore AbortError as it's likely due to StrictMode or rapid component unmounting
          return;
        }
        console.error("Auth state change processing error:", err);
      } finally {
        setIsAuthChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    // Auth state change listener will handle setting user, 
    // but we can set page here
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    if (window.confirm("Cô có chắc muốn đăng xuất không ạ?")) {
      await logout();
      setUser(null);
      setLessonPlan(null);
      setCurrentRequest(null);
    }
  };

  const handleGenerate = async (data: LessonRequest) => {
    setIsLoading(true);
    setError(null);
    setLessonPlan(null);
    setCurrentRequest(data);

    // Scroll to top for better UX on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const result = await generateLessonPlan(data);
      setLessonPlan(result);

      // Auto save after generation (Async)
      try {
        await savePlan(data, result);
        // Trigger Dashboard refresh
        setRefreshKey(prev => prev + 1);
      } catch (saveError) {
        console.error("Lỗi tự động lưu:", saveError);
        // Không block trải nghiệm nếu lưu lỗi, chỉ log
      }

    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
      if (err.message && err.message.includes('Cài đặt')) {
        setCurrentPage('settings');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setLessonPlan(null);
    setError(null);
    setCurrentRequest(null);
    setCurrentPage('create');
  };

  const handleViewSavedPlan = (plan: SavedLessonPlan) => {
    setLessonPlan(plan.content);
    setCurrentRequest(plan.request);
    setCurrentPage('create');
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    if (currentPage === 'dashboard') {
      return (
        <Dashboard
          key={refreshKey} // Force remount when refreshKey changes
          onViewPlan={handleViewSavedPlan}
          onCreateNew={() => {
            handleReset();
            setCurrentPage('create');
          }}
        />
      );
    }

    if (currentPage === 'settings') {
      return <Settings />;
    }

    if (currentPage === 'skkn') {
      return <ExperienceInitiative />;
    }

    if (currentPage === 'about') {
      return (
        <div className="bg-white rounded-3xl shadow-lg p-8 animate-fade-in text-gray-700">
          <h2 className="text-2xl font-bold text-pink-600 mb-4">Về MamNonAI</h2>
          <p className="mb-4 leading-relaxed">
            MamNonAI là trợ lý ảo được thiết kế riêng cho các cô giáo mầm non Việt Nam.
            Ứng dụng giúp cô tiết kiệm thời gian soạn giáo án, tìm kiếm ý tưởng hoạt động mới mẻ
            nhưng vẫn đảm bảo bám sát Chương trình Giáo dục Mầm non.
          </p>
          <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ Dữ liệu của cô hiện đã được đồng bộ và bảo mật trên hệ thống đám mây (Cloud).
            </p>
          </div>
        </div>
      )
    }

    // Default: 'create' page
    return (
      <div className="space-y-8">
        {!lessonPlan && !isLoading && (
          <div className="animate-fade-in">
            <LessonForm onSubmit={handleGenerate} isLoading={isLoading} />
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
            <div className="bg-pink-100 p-6 rounded-full mb-6">
              <img
                src="https://picsum.photos/200/200?random=1"
                alt="Thinking"
                className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-white"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Cô đợi xíu nhé...</h3>
            <p className="text-gray-500 max-w-xs mx-auto">AI đang suy nghĩ ý tưởng và soạn bài cho cô thật hay đây ạ!</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex flex-col items-center text-center space-y-3">
            <span className="text-3xl">😕</span>
            <p className="font-medium">{error}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-white border border-red-300 rounded-lg hover:bg-red-50 text-sm font-bold shadow-sm"
              >
                Thử lại
              </button>
              {error.includes('Cài đặt') && (
                <button
                  onClick={() => setCurrentPage('settings')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-bold shadow-sm"
                >
                  Vào Cài Đặt
                </button>
              )}
            </div>
          </div>
        )}

        {lessonPlan && (
          <PlanViewer
            content={lessonPlan}
            onReset={() => {
              handleReset();
            }}
            request={currentRequest}
          />
        )}
      </div>
    );
  };

  // Màn hình chờ khi đang check session
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-pink-500" size={48} />
      </div>
    )
  }

  // Nếu chưa login -> Hiện AuthPage
  if (!user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Đã login -> Hiện Main Layout
  return (
    <HashRouter>
      <Layout onNavigate={setCurrentPage} currentPage={currentPage}>
        {/* Thanh Header người dùng */}
        <div className="flex justify-end mb-4 items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600 bg-white px-3 py-1.5 rounded-full shadow-sm border border-pink-100">
            <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center text-pink-600 font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-sm">Cô {user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
            title="Đăng xuất"
          >
            <LogOut size={20} />
          </button>
        </div>

        {renderContent()}
      </Layout>
    </HashRouter>
  );
};

export default App;
