import React from 'react';
import { Copy, Download, RefreshCw, CheckCheck, FileText } from 'lucide-react';
import { exportToWord } from '../services/docxService';
import { LessonRequest } from '../types';

interface PlanViewerProps {
  content: string;
  onReset: () => void;
  request: LessonRequest | null;
}

export const PlanViewer: React.FC<PlanViewerProps> = ({ content, onReset, request }) => {
  const [copied, setCopied] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateFileName = (req: LessonRequest | null, textContent: string): string => {
      const sanitize = (text: string) => {
          return text
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") // Remove accents
              .replace(/đ/g, "d").replace(/Đ/g, "D")
              .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
              .trim()
              .replace(/\s+/g, "_") // Replace spaces with underscore
              .toUpperCase();
      };

      if (!req) return "GIAO_AN_MAM_NON";

      // 1. DE_TAI
      const deTai = sanitize(req.topic);

      // 2. DO_TUOI (Extract number if possible, e.g., 5-6)
      // "Mẫu giáo lớn (5 - 6 tuổi)" -> match 5 and 6
      const ageMatch = req.ageGroup.match(/(\d+)\s*[-]\s*(\d+)/);
      const doTuoi = ageMatch ? `${ageMatch[1]}-${ageMatch[2]}` : sanitize(req.ageGroup);

      // 3. CHU_DE
      // Attempt to extract from generated content line: "- **Chủ đề**: ..."
      // Regex looks for "Chủ đề" followed by colon and captures text until end of line
      const themeMatch = textContent.match(/- \*\*Chủ đề\*\*:\s*(.*)/i);
      let chuDe = "";
      
      if (themeMatch && themeMatch[1]) {
          chuDe = sanitize(themeMatch[1]);
      } else {
          // Fallback to subject if theme not extracted
          chuDe = sanitize(req.subject);
      }

      return `GIAO_AN_${deTai}_${doTuoi}_${chuDe}`;
  };

  const handleDownloadWord = async () => {
      setIsExporting(true);
      try {
          const fileName = generateFileName(request, content);
          await exportToWord(content, fileName);
      } catch (error) {
          console.error("Export failed", error);
          alert("Có lỗi khi tạo file Word. Vui lòng thử lại.");
      } finally {
          setIsExporting(false);
      }
  };

  // Simple formatting helper
  const formatText = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Headers
      if (line.startsWith('# ')) return <h1 key={index} className="text-3xl font-bold text-rose-600 mt-6 mb-4 pb-2 border-b-2 border-rose-100">{line.replace('# ', '')}</h1>;
      if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold text-teal-700 mt-6 mb-3 bg-teal-50 inline-block px-3 py-1 rounded-lg">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-bold text-gray-800 mt-4 mb-2">{line.replace('### ', '')}</h3>;
      if (line.startsWith('#### ')) return <h4 key={index} className="text-md font-bold text-gray-800 mt-3 mb-1 ml-2 underline decoration-pink-300">{line.replace('#### ', '')}</h4>;
      
      // Bold items
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="mb-2 text-gray-700 leading-relaxed">
            {parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="text-gray-900 font-bold">{part}</strong> : part))}
          </p>
        );
      }

      // Lists
      if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
        return <li key={index} className="ml-4 mb-2 text-gray-700 list-disc marker:text-pink-400 pl-2 leading-relaxed">{line.replace(/^(\*|-)\s+/, '')}</li>;
      }
      
      // Numbered Lists (Simple detection)
      if (/^\d+\./.test(line.trim())) {
         return <div key={index} className="mb-2 text-gray-700 ml-2 font-medium">{line}</div>
      }

      // Empty lines
      if (line.trim() === '') return <br key={index} />;

      return <p key={index} className="mb-2 text-gray-700 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-pink-100 gap-4">
        <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <span className="bg-green-100 text-green-600 p-1.5 rounded-lg text-sm">Đã hoàn thành</span>
            Kết quả
        </h3>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={handleDownloadWord}
            disabled={isExporting}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {isExporting ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></span>
            ) : (
                <FileText size={16} />
            )}
            <span>{isExporting ? 'Đang tạo...' : 'Tải file Word'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
          >
            {copied ? <CheckCheck size={16} className="text-green-600"/> : <Copy size={16} />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center space-x-1 px-4 py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw size={16} />
            <span>Soạn bài khác</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-2 border-dashed border-pink-200 min-h-[500px]">
        <div className="prose prose-pink max-w-none">
          {formatText(content)}
        </div>
      </div>
    </div>
  );
};