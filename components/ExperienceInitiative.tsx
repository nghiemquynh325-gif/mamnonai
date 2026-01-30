import React, { useState } from 'react';
import { SKKNRequest } from '../types';
import { generateSKKN } from '../services/geminiService';
import { savePlan } from '../services/storageService';
import { Save, Loader2, Copy, FileText, Download } from 'lucide-react';
import * as docx from 'docx';
import { saveAs } from 'file-saver';

export const ExperienceInitiative: React.FC = () => {
    const [request, setRequest] = useState<SKKNRequest>({
        topic: '',
        field: 'PT_NHAN_THUC',
        ageGroup: 'Mẫu giáo lớn (5 - 6 tuổi)',
        role: 'Giáo viên',
        unit: '',
        currentReality: {
            advantages: '',
            disadvantages: ''
        },
        measures: '',
        results: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (field: keyof SKKNRequest, value: any) => {
        setRequest(prev => ({ ...prev, [field]: value }));
    };

    const handleRealityChange = (type: 'advantages' | 'disadvantages', value: string) => {
        setRequest(prev => ({
            ...prev,
            currentReality: {
                ...prev.currentReality,
                [type]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const content = await generateSKKN(request);
            setResult(content);
            setIsLoading(false); // Show result immediately

            // Auto-save SKKN to database (Background process)
            (async () => {
                try {
                    // Compatible mapping for LessonRequest
                    // We map 'field' to 'subject' so Dashboard doesn't crash on undefined subject
                    const compatibleRequest: any = {
                        ...request,
                        subject: request.field, // Important for Dashboard filter
                    };
                    await savePlan(compatibleRequest, content);
                    console.log("SKKN đã được lưu tự động");
                } catch (saveError) {
                    console.error("Lỗi khi lưu SKKN:", saveError);
                    alert("Đã tạo nội dung nhưng KHÔNG LƯU ĐƯỢC TỰ ĐỘNG. Cô vui lòng bấm nút LUƯ (hình đĩa mềm) để lưu thủ công nhé!");
                }
            })();
        } catch (err: any) {
            setError(err.message || "Có lỗi xảy ra khi tạo sáng kiến.");
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(result);
            alert("Đã sao chép nội dung!");
        }
    }

    const handleDownload = () => {
        if (!result) return;

        // Advanced Docx export with Times New Roman 14, 1.5 line spacing
        const doc = new docx.Document({
            styles: {
                default: {
                    document: {
                        run: {
                            size: 28, // 14pt (28 half-points)
                            font: "Times New Roman",
                        },
                        paragraph: {
                            spacing: {
                                line: 360, // 1.5 lines
                                lineRule: "auto",
                            },
                            alignment: docx.AlignmentType.JUSTIFIED,
                        },
                    },
                },
            },
            sections: [{
                properties: {},
                children: [
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: request.topic.toUpperCase(),
                                bold: true,
                                size: 32, // 16pt for Title
                                font: "Times New Roman",
                            }),
                        ],
                        alignment: docx.AlignmentType.CENTER,
                        spacing: {
                            after: 400, // Space after title
                        }
                    }),
                    ...result.split('\n').map(line => {
                        const trimmed = line.trim();
                        // Simple header detection: Starts with "X." or "I." or all caps (short)
                        const isHeader = /^[IVX0-9]+\./.test(trimmed) || (trimmed.length < 100 && trimmed === trimmed.toUpperCase() && trimmed.length > 5);

                        return new docx.Paragraph({
                            children: [
                                new docx.TextRun({
                                    text: trimmed,
                                    bold: isHeader,
                                    font: "Times New Roman",
                                })
                            ],
                            spacing: {
                                after: 200,
                            }
                        });
                    })
                ],
            }],
        });

        docx.Packer.toBlob(doc).then((blob) => {
            saveAs(blob, `SKKN_${request.topic.substring(0, 20)}.docx`);
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-pink-100">
                <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
                    <div className="bg-blue-500 p-2 rounded-xl text-white">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Viết Sáng Kiến Kinh Nghiệm</h2>
                        <p className="text-sm text-gray-500">Trợ lý AI hỗ trợ viết sáng kiến kinh nghiệm chuẩn sư phạm</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Tên đề tài</label>
                            <input
                                required
                                value={request.topic}
                                onChange={(e) => handleInputChange('topic', e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition"
                                placeholder="VD: Một số biện pháp giúp trẻ 5-6 tuổi..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Lĩnh vực / Chuyên đề</label>
                            <select
                                value={request.field}
                                onChange={(e) => handleInputChange('field', e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none"
                            >
                                <option value="PT_NHAN_THUC">Phát triển nhận thức</option>
                                <option value="PT_NGON_NGU">Phát triển ngôn ngữ</option>
                                <option value="PT_THAM_MY">Phát triển thẩm mỹ</option>
                                <option value="PT_TC_KNXH">Phát triển tình cảm & KNXH</option>
                                <option value="PT_THE_CHAT">Phát triển thể chất</option>
                                <option value="QUAN_LY">Công tác quản lý, chủ nhiệm</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Độ tuổi</label>
                            <select
                                value={request.ageGroup}
                                onChange={(e) => handleInputChange('ageGroup', e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl outline-none"
                            >
                                <option value="Nhà trẻ (24 - 36 tháng)">Nhà trẻ (24 - 36 tháng)</option>
                                <option value="Mẫu giáo bé (3 - 4 tuổi)">Mẫu giáo bé (3 - 4 tuổi)</option>
                                <option value="Mẫu giáo nhỡ (4 - 5 tuổi)">Mẫu giáo nhỡ (4 - 5 tuổi)</option>
                                <option value="Mẫu giáo lớn (5 - 6 tuổi)">Mẫu giáo lớn (5 - 6 tuổi)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Đơn vị / Trường</label>
                            <input
                                value={request.unit}
                                onChange={(e) => handleInputChange('unit', e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-400"
                                placeholder="VD: Trường Mầm non Hoa Sen"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Vai trò tác giả</label>
                            <select
                                value={request.role}
                                onChange={(e) => handleInputChange('role', e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl outline-none"
                            >
                                <option value="Giáo viên">Giáo viên</option>
                                <option value="Phó hiệu trưởng">Phó hiệu trưởng</option>
                                <option value="Hiệu trưởng">Hiệu trưởng</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 block">Thực trạng vấn đề (Lý do chọn đề tài)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <textarea
                                value={request.currentReality.advantages}
                                onChange={(e) => handleRealityChange('advantages', e.target.value)}
                                className="w-full p-3 border border-green-200 bg-green-50 rounded-xl outline-none h-32 text-sm placeholder-green-700/50"
                                placeholder="- Thuận lợi: ..."
                            />
                            <textarea
                                value={request.currentReality.disadvantages}
                                onChange={(e) => handleRealityChange('disadvantages', e.target.value)}
                                className="w-full p-3 border border-red-200 bg-red-50 rounded-xl outline-none h-32 text-sm placeholder-red-700/50"
                                placeholder="- Khó khăn, hạn chế: ..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Các biện pháp đã thực hiện (Gợi ý chính)</label>
                        <textarea
                            value={request.measures}
                            onChange={(e) => handleInputChange('measures', e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none h-32"
                            placeholder="Liệt kê các biện pháp chính cô định viết. VD: Biện pháp 1: Xây dựng môi trường; Biện pháp 2: Ứng dụng CNTT..."
                        />
                        <p className="text-xs text-gray-400">Cô có thể gạch đầu dòng các ý chính, AI sẽ viết chi tiết giúp cô.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Kết quả đạt được</label>
                        <textarea
                            value={request.results}
                            onChange={(e) => handleInputChange('results', e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none h-24"
                            placeholder="Trẻ hứng thú hơn, ... % trẻ đạt yêu cầu..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center space-x-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        <span>{isLoading ? "Đang viết sáng kiến..." : "Soạn thảo sáng kiến kinh nghiệm"}</span>
                    </button>
                </form>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
                    {error}
                </div>
            )}

            {result && (
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 animate-fade-in relative">
                    <div className="absolute top-4 right-4 flex space-x-2">
                        <button
                            onClick={async () => {
                                try {
                                    // Manual save
                                    const compatibleRequest: any = {
                                        ...request,
                                        subject: request.field,
                                    };
                                    await savePlan(compatibleRequest, result);
                                    alert("Đã lưu thành công vào hệ thống! Cô có thể xem lại ở Dashboard.");
                                } catch (err: any) {
                                    console.error("Manual save error:", err);
                                    alert(err.message || "Lỗi khi lưu. Cô vui lòng kiểm tra mạng hoặc đăng nhập lại.");
                                }
                            }}
                            className="p-2 hover:bg-green-50 rounded-full text-green-600"
                            title="Lưu vào hệ thống"
                        >
                            <Save size={20} />
                        </button>
                        <button
                            onClick={handleCopy}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                            title="Sao chép"
                        >
                            <Copy size={20} />
                        </button>
                        <button
                            onClick={handleDownload}
                            className="p-2 hover:bg-blue-50 rounded-full text-blue-600"
                            title="Tải file Word"
                        >
                            <Download size={20} />
                        </button>
                    </div>
                    <div className="prose max-w-none whitespace-pre-wrap font-serif leading-relaxed text-gray-800">
                        {result}
                    </div>
                </div>
            )}
        </div>
    );
};
