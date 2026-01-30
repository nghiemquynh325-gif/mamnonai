import React, { useState, useEffect } from 'react';
import { Key, Save, Eye, EyeOff, ExternalLink, ShieldCheck, HelpCircle, Cpu, Activity, Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { saveApiKey, getApiKey } from '../services/storageService';

export const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('gemini-2.5-flash');

  // Status states
  const [isSaved, setIsSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      // Load API key from database first
      const dbKey = await getApiKey();
      if (dbKey) {
        setApiKey(dbKey);
        localStorage.setItem('MAMNON_AI_API_KEY', dbKey); // Cache locally
      } else {
        // Fallback to localStorage if database doesn't have it
        const savedKey = localStorage.getItem('MAMNON_AI_API_KEY');
        if (savedKey) setApiKey(savedKey);
      }

      const savedModel = localStorage.getItem('MAMNON_AI_MODEL');
      if (savedModel) setModel(savedModel);
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    const trimmedKey = apiKey.trim();

    // Save to database
    try {
      await saveApiKey(trimmedKey);
    } catch (error) {
      // Silently ignore DB errors (like missing api_key column)
      // so user can still save to localStorage
      console.warn('Could not save to DB, using localStorage only');
    }

    // Save to localStorage as cache
    localStorage.setItem('MAMNON_AI_API_KEY', trimmedKey);
    localStorage.setItem('MAMNON_AI_MODEL', model);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    // Reset test status when settings change
    setTestStatus('idle');
    setTestMessage('');
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      setTestStatus('error');
      setTestMessage('Cô chưa nhập Mã khóa AI.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Đang kết nối thử đến máy chủ Google...');

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      // Use the user-selected model for testing
      const response = await ai.models.generateContent({
        model: model,
        contents: 'Hello, confirm connection.',
      });

      if (response.text) {
        setTestStatus('success');
        setTestMessage('Kết nối thành công! Hệ thống đã sẵn sàng.');
      } else {
        throw new Error('Không nhận được phản hồi.');
      }
    } catch (error: any) {
      console.error(error);
      setTestStatus('error');

      // Better error handling
      let errorMsg = 'Lỗi kết nối mạng hoặc mô hình AI đang bận.';

      if (error.message?.includes('API key') || error.message?.includes('403')) {
        errorMsg = 'Mã khóa không đúng. Cô vui lòng kiểm tra lại.';
      } else if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        errorMsg = 'Mã API Key này đã hết hạn mức miễn phí. Cô vui lòng tạo API Key mới hoặc đợi ngày mai để tiếp tục sử dụng.';
      } else if (error.message?.includes('404') || error.message?.includes('NOT_FOUND')) {
        errorMsg = 'Mô hình AI không khả dụng. Vui lòng thử lại sau.';
      }

      setTestMessage(errorMsg);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-10">

      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-800">Cài đặt hệ thống</h2>
        <p className="text-gray-500 mt-2">Thiết lập kết nối trí tuệ nhân tạo để hỗ trợ soạn bài</p>
      </div>

      {/* SECTION 1: KẾT NỐI AI */}
      <section className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
        <div className="bg-pink-50/50 p-4 border-b border-pink-100 flex items-center gap-3">
          <div className="bg-pink-100 p-2 rounded-lg text-pink-600">
            <Key size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">1. Kết nối AI (Chìa khóa thông minh)</h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">
              Mã khóa Google (API Key) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Dán mã khóa AIza... của cô vào đây"
                className="w-full p-3.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none transition-all text-gray-700 font-mono text-sm"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <InfoIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Nếu cô chưa có mã khóa, hãy <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">bấm vào đây</a> để đăng ký miễn phí từ Google.</span>
            </div>
            <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Lưu ý về hạn mức:</strong> Mỗi tài khoản Google có giới hạn <strong>1,500 lượt tạo/ngày</strong>.
                Nếu hết hạn mức, cô có thể: <strong>(1)</strong> Đợi đến sáng mai, hoặc <strong>(2)</strong> Dùng Gmail khác để tạo API Key mới.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CÀI ĐẶT MÔ HÌNH */}
      <section className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
        <div className="bg-blue-50/50 p-4 border-b border-blue-100 flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <Cpu size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">2. Chọn trí thông minh (Mô hình)</h3>
        </div>

        <div className="p-6">
          <label className="block text-gray-700 font-semibold mb-2 text-sm">
            Cô muốn AI làm việc như thế nào?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ModelOption
              id="gemini-2.5-flash"
              name="Gemini 2.5 Flash"
              desc="Tốc độ cực nhanh & Mới nhất (Đã kiểm duyệt)"
              current={model}
              onSelect={setModel}
              icon={<Zap size={18} />}
            />
            <ModelOption
              id="gemini-2.5-flash-nat"
              name="Gemini 2.5 Pro (Natural)"
              desc="Ngôn ngữ tự nhiên, tư duy sâu"
              current={model}
              onSelect={setModel}
              icon={<ShieldCheck size={18} />}
            />
            <ModelOption
              id="gemini-1.5-flash"
              name="Gemini 1.5 Flash"
              desc="Siêu tiết kiệm, hoạt động ổn định"
              current={model}
              onSelect={setModel}
              icon={<Activity size={18} />}
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: KIỂM TRA & LƯU */}
      <section className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
        <div className="bg-green-50/50 p-4 border-b border-green-100 flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg text-green-600">
            <Activity size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">3. Kiểm tra & Lưu cài đặt</h3>
        </div>

        <div className="p-6 flex flex-col items-center justify-center space-y-4">
          <div className="flex w-full gap-4">
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2
                ${testStatus === 'testing' ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
              `}
            >
              {testStatus === 'testing' ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></span>
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  <Activity size={18} />
                  Kiểm tra kết nối
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2
                ${isSaved ? 'bg-green-500 shadow-green-200' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-200'}
              `}
            >
              {isSaved ? <CheckCircle size={18} /> : <Save size={18} />}
              {isSaved ? 'Đã lưu cài đặt' : 'Lưu lại tất cả'}
            </button>
          </div>

          {/* Status Message Area */}
          {testMessage && (
            <div className={`w-full p-4 rounded-xl flex items-start gap-3 text-sm animate-fade-in-up
              ${testStatus === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : ''}
              ${testStatus === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : ''}
              ${testStatus === 'testing' ? 'bg-gray-50 text-gray-600 border border-gray-200' : ''}
            `}>
              {testStatus === 'success' && <CheckCircle className="text-green-600 flex-shrink-0" size={20} />}
              {testStatus === 'error' && <XCircle className="text-red-600 flex-shrink-0" size={20} />}
              {testStatus === 'testing' && <Activity className="text-gray-500 flex-shrink-0 animate-pulse" size={20} />}
              <span className="leading-5 pt-0.5">{testMessage}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// Helper Component for Model Selection
const ModelOption = ({ id, name, desc, current, onSelect, icon }: any) => (
  <button
    onClick={() => onSelect(id)}
    className={`p-3 rounded-xl border text-left transition-all duration-200 h-full flex flex-col
      ${current === id
        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
        : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
      }
    `}
  >
    <div className={`mb-2 ${current === id ? 'text-blue-600' : 'text-gray-400'}`}>
      {icon}
    </div>
    <div className={`font-bold text-sm mb-1 ${current === id ? 'text-blue-800' : 'text-gray-700'}`}>
      {name}
    </div>
    <div className="text-xs text-gray-500 leading-tight">
      {desc}
    </div>
  </button>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
