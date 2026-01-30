
import React, { useEffect, useState } from 'react';
import { SavedLessonPlan, Subject } from '../types';
import { getPlans, deletePlan } from '../services/storageService';
import { Trash2, Eye, Plus, Calendar, Clock, BookOpen, Smile, Loader2 } from 'lucide-react';

interface DashboardProps {
  onViewPlan: (plan: SavedLessonPlan) => void;
  onCreateNew: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewPlan, onCreateNew }) => {
  const [plans, setPlans] = useState<SavedLessonPlan[]>([]);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load plans from Supabase
  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const data = await getPlans();
      setPlans(data);
    } catch (error: any) {
      // Silently ignore AbortError from React StrictMode
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
        return;
      }
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Cô có chắc muốn xóa giáo án này không?')) {
      try {
        await deletePlan(id);
        // Cập nhật lại list sau khi xóa thành công
        setPlans(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        alert("Không xóa được, cô kiểm tra lại mạng nhé.");
      }
    }
  };

  const getSubjectColor = (subject: Subject) => {
    switch (subject) {
      case Subject.VAN_HOC: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case Subject.TOAN: return 'bg-blue-100 text-blue-700 border-blue-200';
      case Subject.THE_CHAT: return 'bg-red-100 text-red-700 border-red-200';
      case Subject.AM_NHAC: return 'bg-pink-100 text-pink-700 border-pink-200';
      case Subject.TAO_HINH: return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const filteredPlans = plans.filter(p =>
    p.title.toLowerCase().includes(filter.toLowerCase()) ||
    p.request.subject.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-gradient-to-r from-pink-500 to-rose-400 p-8 rounded-3xl shadow-lg text-white">
        <div>
          <h2 className="text-3xl font-extrabold mb-2">Xin chào cô giáo! 👋</h2>
          <p className="text-pink-100 text-lg">Chúc cô một ngày làm việc tràn đầy năng lượng và niềm vui.</p>
          <div className="mt-4 flex gap-4">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2">
              <BookOpen size={20} />
              <span className="font-bold">{plans.length} Giáo án đã lưu</span>
            </div>
          </div>
        </div>
        <button
          onClick={onCreateNew}
          className="bg-white text-pink-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 group"
        >
          <Plus size={24} className="group-hover:rotate-90 transition-transform" />
          Soạn bài mới
        </button>
      </div>

      {/* Search & List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="text-pink-500" /> Hoạt động gần đây
          </h3>
          <input
            type="text"
            placeholder="Tìm kiếm giáo án..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full md:w-64"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-pink-500" size={40} />
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="bg-gray-50 p-4 rounded-full inline-block mb-4">
              <Smile size={48} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Chưa có giáo án nào. Cô hãy bắt đầu soạn bài ngay nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => onViewPlan(plan)}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-pink-200 transition-all cursor-pointer group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getSubjectColor(plan.request.subject)}`}>
                    {plan.request.subject}
                  </span>
                  <button
                    onClick={(e) => handleDelete(plan.id, e)}
                    className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                    title="Xóa giáo án"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h4 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                  {plan.title}
                </h4>

                <div className="mt-auto space-y-2 pt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Smile size={14} className="text-gray-400" />
                    <span>{plan.request.ageGroup}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    {/* Hiển thị ngày tháng format Việt Nam */}
                    <span>{new Date(plan.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                  <span className="text-pink-500 text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Xem chi tiết <Eye size={16} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
