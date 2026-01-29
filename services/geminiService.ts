import { GoogleGenAI } from "@google/genai";
import { LessonRequest, LessonPurpose, SKKNRequest } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

export const generateLessonPlan = async (request: LessonRequest): Promise<string> => {
  // 1. Try to get key from LocalStorage (User setting)
  // 2. Fallback to Environment variable (Dev setting)
  const apiKey = localStorage.getItem('MAMNON_AI_API_KEY') || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("Chưa có mã kết nối AI. Cô vui lòng vào mục 'Cài đặt' để nhập API Key nhé!");
  }

  // Get selected model from LocalStorage or default to flash-preview
  const savedModel = localStorage.getItem('MAMNON_AI_MODEL');
  const modelId = savedModel || "gemini-3-flash-preview";

  // Initialize client per request to ensure we use the latest key
  const ai = new GoogleGenAI({ apiKey });

  let purposeInstruction = "";
  switch (request.purpose) {
    case LessonPurpose.DAILY:
      purposeInstruction = "Giáo án dạy hàng ngày: Viết ngắn gọn, súc tích nhưng ngôn ngữ phải tự nhiên, tình cảm, dễ thực hiện ngay.";
      break;
    case LessonPurpose.OBSERVATION:
      purposeInstruction = "Giáo án thao giảng: Viết cực kỳ chi tiết, chú trọng hệ thống câu hỏi gợi mở thông minh (Questions & Answers), lời dẫn dắt hay, thể hiện kỹ năng sư phạm khéo léo.";
      break;
    case LessonPurpose.COMPETITION:
      purposeInstruction = "Giáo án thi Giáo viên giỏi: Viết thật trau chuốt, sáng tạo, logic chặt chẽ. Lời thoại và tình huống sư phạm phải chuẩn mực và ấn tượng.";
      break;
    default:
      purposeInstruction = "Viết giáo án phù hợp với hoạt động giáo dục, ngôn ngữ gần gũi.";
  }

  const facilitiesInstruction = request.facilities
    ? `Điều kiện lớp học: ${request.facilities}. Hãy thiết kế hoạt động tận dụng tốt nhất điều kiện này.`
    : "Ưu tiên sử dụng nguyên vật liệu mở, đồ dùng sẵn có, dễ kiếm trong tự nhiên hoặc đời sống.";

  // Metadata block for the header
  const headerInfo = `
  THÔNG TIN HÀNH CHÍNH CẦN HIỂN THỊ Ở ĐẦU GIÁO ÁN:
  - Người thực hiện: ${request.author || ".................."}
  - Đơn vị: ${request.unit || ".................."}
  - Ngày soạn: ${request.datePrepared || ".................."}
  - Ngày dạy: ${request.dateTaught || ".................."}
  - Chủ đề lớn: ${request.theme || ".................."}
  `;

  const userPrompt = `
  Cô hãy soạn giúp tôi bộ kế hoạch hoạt động này nhé:
  ${headerInfo}
  - Lớp: ${request.ageGroup}
  - Lĩnh vực: ${request.subject}
  - Đề tài (Hoạt động học): ${request.topic}
  - Thời gian: ${request.duration} phút
  - Mục đích: ${request.purpose}
  
  YÊU CẦU CỤ THỂ (QUAN TRỌNG):
  1. **CẤU TRÚC**: Phải soạn ĐẦY ĐỦ 3 PHẦN để thành một ngày hoạt động hoàn chỉnh:
     - Phần I: Hoạt động học (Theo đề tài trên)
     - Phần II: Hoạt động ngoài trời (Gợi ý hoạt động phù hợp với chủ đề bài học)
     - Phần III: Hoạt động góc (Gợi ý các góc chơi phù hợp chủ đề)
  
  2. **CHẤT LƯỢNG**: ${purposeInstruction}
  
  3. **ĐIỀU KIỆN**: ${facilitiesInstruction}
  
  ${request.goals ? `4. Yêu cầu thêm: ${request.goals}` : ''}
  
  Lưu ý: Hãy viết như một giáo viên thực thụ. Tuyệt đối tuân thủ cấu trúc #### và - **Cô**: / - **Trẻ**: để phần mềm tạo bảng.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // Increased budget slightly to allow for style checking
        thinkingConfig: { thinkingBudget: 2048 }, // Tăng khả năng tư duy để soạn bài dài hơn
        temperature: 0.85,
      },
    });

    let finalText = response.text || "";

    // Cleaning: Remove Markdown code block wrappers if present
    finalText = finalText.trim();
    if (finalText.startsWith("```markdown")) {
      finalText = finalText.replace(/^```markdown\s*/, "").replace(/\s*```$/, "");
    } else if (finalText.startsWith("```")) {
      finalText = finalText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    return finalText || "Xin lỗi, tôi chưa thể tạo giáo án lúc này. Vui lòng thử lại.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('API key') || error.message?.includes('403')) {
      throw new Error("Mã kết nối AI (API Key) không đúng hoặc đã hết hạn. Cô vui lòng kiểm tra lại trong mục Cài đặt.");
    }
    throw new Error("Có lỗi xảy ra khi kết nối với AI (" + (error.message || "Unknown") + "). Vui lòng kiểm tra lại kết nối mạng.");
  }
};

export const generateSKKN = async (request: SKKNRequest): Promise<string> => {
  const apiKey = localStorage.getItem('MAMNON_AI_API_KEY') || process.env.API_KEY;
  if (!apiKey) throw new Error("Chưa có mã kết nối AI. Cô vui lòng vào mục 'Cài đặt' để nhập API Key nhé!");

  const savedModel = localStorage.getItem('MAMNON_AI_MODEL');
  const modelId = savedModel || "gemini-1.5-flash";
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
  HÃY ĐÓNG VAI LÀ GIÁO VIÊN MẦM NON CÓ NHIỀU KINH NGHIỆM ĐỂ VIẾT BÀI.
  
  Dựa trên các thông tin sau, hãy viết một bài SÁNG KIẾN KINH NGHIỆM hoàn chỉnh:

  [TÊN SÁNG KIẾN]: ${request.topic}
  [LĨNH VỰC]: ${request.field}
  [ĐỐI TƯỢNG ÁP DỤNG]: Trẻ ${request.ageGroup}
  [ĐƠN VỊ CÔNG TÁC]: ${request.unit} (Người thực hiện: ${request.role})
  [THỰC TRẠNG]:
    - Thuận lợi: ${request.currentReality.advantages}
    - Khó khăn: ${request.currentReality.disadvantages}
  [BIỆN PHÁP]: ${request.measures}
  [HIỆU QUẢ]: ${request.results}

  ----------------------------
  YÊU CẦU CẤU TRÚC (BẮT BUỘC 9 MỤC):
  1. Tên sáng kiến
  2. Lĩnh vực áp dụng
  3. Người thực hiện
  4. Đơn vị công tác
  5. Lý do chọn đề tài
  6. Thực trạng trước khi áp dụng
  7. Các biện pháp thực hiện (Phần trọng tâm - Viết chi tiết, chia thành các biện pháp nhỏ, có ví dụ minh họa)
  8. Hiệu quả đạt được (Cụ thể trên trẻ, giáo viên và nhà trường)
  9. Kiến nghị – đề xuất
  ----------------------------

  YÊU CẦU NỘI DUNG & VĂN PHONG (CHỐNG "MÙI AI"):
  1. Văn phong hành chính – khoa học nhưng phải "đời", giống giáo viên viết.
  2. Tuyệt đối KHÔNG dùng từ ngữ sáo rỗng, hoa mỹ, lý thuyết suông.
  3. Có dẫn chứng thực tế, ví dụ cụ thể về hoạt động, trò chơi, tình huống sư phạm.
  4. Không phóng đại thành tích.
  5. Ngôn ngữ mạch lạc, chân thực, tránh lặp từ.
  6. Biện pháp phải gắn liền với thực trạng đã nêu.
  
  HÃY TỰ KIỂM TRA TRƯỚC KHI TRẢ VỀ KẾT QUẢ:
  - Nội dung có đúng cấu trúc 9 mục không?
  - Biện pháp có giải quyết được khó khăn không?
  - Hiệu quả có đo đếm được không?

  (Lưu ý: Chỉ trả về nội dung bài viết, không bao gồm lời dẫn của AI)
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2048 },
        temperature: 0.7,
      },
    });
    return response.text || "Xin lỗi, không thể tạo nội dung lúc này.";
  } catch (error: any) {
    console.error("SKKN Gen Error:", error);
    if (error.message?.includes('API key') || error.message?.includes('403')) {
      throw new Error("Mã kết nối AI (API Key) không đúng hoặc đã hết hạn. Cô vui lòng kiểm tra lại trong mục Cài đặt.");
    }
    throw new Error("Có lỗi xảy ra: " + (error.message || "Unknown error"));
  }
};