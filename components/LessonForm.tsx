import React, { useState } from 'react';
import { AgeGroup, LessonRequest, Subject, LessonPurpose } from '../types';
import { AGE_OPTIONS, SUBJECT_OPTIONS, PURPOSE_OPTIONS } from '../constants';
import { Sparkles, Clock, Book, Smile, Target, Briefcase, Box, User, Building, Calendar, Layers } from 'lucide-react';

interface LessonFormProps {
  onSubmit: (data: LessonRequest) => void;
  isLoading: boolean;
}

export const LessonForm: React.FC<LessonFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<LessonRequest>({
    author: '',
    unit: '',
    datePrepared: new Date().toISOString().split('T')[0],
    dateTaught: '',
    ageGroup: AgeGroup.MAU_GIAO_4_5,
    subject: Subject.VAN_HOC,
    theme: '',
    topic: '',
    duration: '25-30',
    goals: '',
    purpose: LessonPurpose.DAILY,
    facilities: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) return;
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-pink-100">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Soạn Giáo Án Mới</h2>
        <p className="text-gray-500">Nhập thông tin hoạt động để AI hỗ trợ cô soạn bài nhé!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Administrative Info */}
        <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 space-y-4">
            <h3 className="font-bold text-pink-700 flex items-center gap-2">
                <User size={20}/> Thông tin giáo viên & Lớp
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Người soạn / Dạy</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={formData.author}
                            onChange={(e) => setFormData({...formData, author: e.target.value})}
                            placeholder="Họ và tên cô giáo"
                            className="w-full p-3 pl-10 bg-white border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none text-gray-700"
                        />
                        <User size={16} className="absolute left-3 top-3.5 text-pink-400"/>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Đơn vị / Trường</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={formData.unit}
                            onChange={(e) => setFormData({...formData, unit: e.target.value})}
                            placeholder="Trường Mầm non..."
                            className="w-full p-3 pl-10 bg-white border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none text-gray-700"
                        />
                        <Building size={16} className="absolute left-3 top-3.5 text-pink-400"/>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Ngày soạn</label>
                    <div className="relative">
                        <input 
                            type="date" 
                            value={formData.datePrepared}
                            onChange={(e) => setFormData({...formData, datePrepared: e.target.value})}
                            className="w-full p-3 pl-10 bg-white border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none text-gray-700"
                        />
                        <Calendar size={16} className="absolute left-3 top-3.5 text-pink-400"/>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Ngày dạy (Dự kiến)</label>
                    <div className="relative">
                        <input 
                            type="date" 
                            value={formData.dateTaught}
                            onChange={(e) => setFormData({...formData, dateTaught: e.target.value})}
                            className="w-full p-3 pl-10 bg-white border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none text-gray-700"
                        />
                        <Calendar size={16} className="absolute left-3 top-3.5 text-pink-400"/>
                    </div>
                </div>
            </div>
        </div>

        {/* Section 2: Core Lesson Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Age Group */}
            <div className="space-y-2">
                <label className="flex items-center space-x-2 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                    <Smile size={18} className="text-pink-500" />
                    <span>Lứa tuổi</span>
                </label>
                <div className="relative">
                    <select
                        value={formData.ageGroup}
                        onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value as AgeGroup })}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none transition-all appearance-none cursor-pointer text-gray-700"
                        disabled={isLoading}
                    >
                        {AGE_OPTIONS.map((age) => (
                        <option key={age} value={age}>{age}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
                <label className="flex items-center space-x-2 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                    <Book size={18} className="text-blue-500" />
                    <span>Lĩnh vực / Hoạt động</span>
                </label>
                <div className="relative">
                    <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value as Subject })}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-300 outline-none transition-all appearance-none cursor-pointer text-gray-700"
                        disabled={isLoading}
                    >
                        {SUBJECT_OPTIONS.map((subj) => (
                        <option key={subj} value={subj}>{subj}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        {/* Theme (Chủ đề lớn) */}
        <div className="space-y-2">
            <label className="flex items-center space-x-2 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                <Layers size={18} className="text-indigo-500" />
                <span>Chủ đề (VD: Thế giới thực vật, Gia đình...)</span>
            </label>
            <input
                type="text"
                value={formData.theme || ''}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                placeholder="Nhập chủ đề lớn..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none transition-all placeholder-gray-400 text-gray-700"
                disabled={isLoading}
            />
        </div>

        {/* Topic (Đề tài) */}
        <div className="space-y-2">
            <label className="flex items-center space-x-2 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                <Sparkles size={18} className="text-yellow-500" />
                <span>Đề tài (Tên bài dạy cụ thể)</span>
            </label>
            <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Ví dụ: Truyện 'Nhổ củ cải', VĐTN 'Cháu yêu bà'..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300 outline-none transition-all placeholder-gray-400 text-gray-700"
                disabled={isLoading}
                required
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration */}
            <div className="space-y-2">
                <label className="flex items-center space-x-2 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                    <Clock size={18} className="text-green-500" />
                    <span>Thời gian (phút)</span>
                </label>
                <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="25-30"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 focus:border-green-300 outline-none transition-all text-gray-700"
                    disabled={isLoading}
                />
            </div>
            
            {/* Purpose */}
            <div className="space-y-2">
                <label className="flex items-center space-x-2 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                    <Briefcase size={18} className="text-orange-500" />
                    <span>Mục đích</span>
                </label>
                <div className="relative">
                    <select
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value as LessonPurpose })}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none transition-all appearance-none cursor-pointer text-gray-700"
                        disabled={isLoading}
                    >
                        {PURPOSE_OPTIONS.map((purpose) => (
                        <option key={purpose} value={purpose}>{purpose}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        {/* Facilities (Optional) */}
        <div className="space-y-2">
            <label className="flex items-center space-x-2 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                <Box size={18} className="text-teal-500" />
                <span>Điều kiện cơ sở vật chất (Tuỳ chọn)</span>
            </label>
            <textarea
                value={formData.facilities || ''}
                onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                placeholder="Ví dụ: Lớp có máy chiếu, sân rộng... hoặc Lớp chật, thiếu đồ dùng..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-300 focus:border-teal-300 outline-none transition-all placeholder-gray-400 text-gray-700 h-24 resize-none"
                disabled={isLoading}
            />
        </div>

        {/* Specific Goals (Optional) */}
        <div className="space-y-2">
            <label className="flex items-center space-x-2 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                <Target size={18} className="text-purple-500" />
                <span>Yêu cầu khác (Tuỳ chọn)</span>
            </label>
            <input
                type="text"
                value={formData.goals || ''}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                placeholder="Ví dụ: Trẻ biết vận động theo nhạc, trẻ hào hứng..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-300 outline-none transition-all text-gray-700"
                disabled={isLoading}
            />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full p-4 rounded-xl font-bold text-lg text-white shadow-lg shadow-pink-200
            transform transition-all duration-200 flex items-center justify-center space-x-2
            ${isLoading 
                ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:scale-[1.02] hover:shadow-xl'
            }
          `}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang suy nghĩ ý tưởng...</span>
                </>
            ) : (
                <>
                    <Sparkles className="w-6 h-6" />
                    <span>Soạn Giáo Án Ngay</span>
                </>
            )}
        </button>
      </form>
    </div>
  );
};