import { GoogleGenAI } from "@google/genai";
import { LessonRequest, LessonPurpose, SKKNRequest } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";
import { getApiKey } from "./storageService";

export const generateLessonPlan = async (request: LessonRequest): Promise<string> => {
  // 1. Try to get key from Database (User profile)
  // 2. Fallback to LocalStorage (User setting cache)
  // 3. Fallback to Environment variable (Dev setting)
  const dbKey = await getApiKey();
  const apiKey = dbKey || localStorage.getItem('MAMNON_AI_API_KEY') || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("Chưa có mã kết nối AI. Cô vui lòng vào mục 'Cài đặt' để nhập API Key nhé!");
  }

  // Get selected model from LocalStorage or default to flash
  const savedModel = localStorage.getItem('MAMNON_AI_MODEL');
  const modelId = savedModel || "gemini-2.5-flash";

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
        // thinkingConfig: { thinkingBudget: 2048 }, // Disable thinking for flash model to save tokens/quota/compatibility
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
      throw new Error("Mã kết nối AI (API Key) không đúng hoặc đã hết hạn. Cô vui lòng kiểm tra lại trong mục 'Cài đặt'.");
    }
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("Mã API Key này đã hết hạn mức miễn phí trong ngày. Cô có thể:\n1. Tạo API Key mới tại https://aistudio.google.com/app/apikey\n2. Đợi đến ngày mai để tiếp tục sử dụng\n3. Thử chuyển sang model khác trong Cài đặt");
    }
    if (error.message?.includes('404') || error.message?.includes('NOT_FOUND')) {
      throw new Error("Mô hình AI không khả dụng. Vui lòng thử model khác trong Cài đặt.");
    }
    throw new Error("Có lỗi xảy ra khi kết nối với AI (" + (error.message || "Unknown") + "). Vui lòng kiểm tra lại kết nối mạng.");
  }
};

export const generateSKKN = async (request: SKKNRequest): Promise<string> => {
  const apiKey = localStorage.getItem('MAMNON_AI_API_KEY') || process.env.API_KEY;
  if (!apiKey) throw new Error("Chưa có mã kết nối AI. Cô vui lòng vào mục 'Cài đặt' để nhập API Key nhé!");

  const savedModel = localStorage.getItem('MAMNON_AI_MODEL');
  const modelId = savedModel || "gemini-2.5-flash";
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
  HÃY ĐÓNG VAI LÀ GIÁO VIÊN MẦM NON CÓ NHIỀU KINH NGHIỆM ĐỂ VIẾT BÀI SÁNG KIẾN KINH NGHIỆM CHUYÊN NGHIỆP.
  
  Dựa trên các thông tin sau, hãy viết một bài SÁNG KIẾN KINH NGHIỆM hoàn chỉnh, CHI TIẾT, ĐỘ DÀI 20-25 TRANG:

  [THÔNG TIN ĐẦU VÀO]:
  - TÊN SÁNG KIẾN: ${request.topic}
  - LĨNH VỰC: ${request.field}
  - ĐỐI TƯỢNG ÁP DỤNG: Trẻ ${request.ageGroup}
  - ĐƠN VỊ CÔNG TÁC: ${request.unit}
  - NGƯỜI THỰC HIỆN: ${request.role}
  - THỰC TRẠNG:
    + Thuận lợi: ${request.currentReality.advantages}
    + Khó khăn: ${request.currentReality.disadvantages}
  - BIỆN PHÁP/GIẢI PHÁP: ${request.measures}
  - HIỆU QUẢ ĐẠT ĐƯỢC: ${request.results}

  ----------------------------
  CẤU TRÚC BÀI VIẾT (BẮT BUỘC - ĐỘ DÀI 20-25 TRANG):
  
  **LƯU Ý QUAN TRỌNG**: 
  - KHÔNG viết phần MỤC LỤC (Table of Contents)
  - BẮT ĐẦU TRỰC TIẾP từ phần I. ĐẶT VẤN ĐỀ
  - Chỉ viết nội dung chính của bài SKKN
  
  **I. ĐẶT VẤN ĐỀ** (3-4 trang)
  
  1.1. Tên sáng kiến
  - Viết rõ tên đầy đủ của sáng kiến
  
  1.2. Tác giả
  - Họ và tên: [Tự động điền từ thông tin]
  - Chức vụ: ${request.role}
  - Đơn vị công tác: ${request.unit}
  - Số điện thoại: [Để trống hoặc ghi "Cập nhật sau"]
  - Email: [Để trống hoặc ghi "Cập nhật sau"]
  
  1.3. Lý do chọn đề tài (300-500 từ)
  - Xuất phát từ thực tiễn công tác giảng dạy
  - Nêu rõ tầm quan trọng của vấn đề
  - Có thể trích dẫn văn bản pháp luật liên quan (Chương trình GDMN, Thông tư...)
  - Dẫn chứng thực tế tại đơn vị
  - Kết luận về sự cần thiết phải nghiên cứu đề tài
  
  1.4. Mục đích nghiên cứu (100-200 từ)
  - Nêu rõ mục đích chính của sáng kiến
  - Kết quả mong muốn đạt được
  
  1.5. Đối tượng và phạm vi nghiên cứu (50-100 từ)
  - Đối tượng: Trẻ ${request.ageGroup}
  - Phạm vi: ${request.unit}
  - Thời gian thực hiện (ví dụ: năm học 2024-2025)
  
  **II. GIẢI QUYẾT VẤN ĐỀ**
  
  2.1. Cơ sở lý luận của vấn đề (200-300 từ)
  - Khái niệm liên quan đến chủ đề
  - Cơ sở khoa học sư phạm
  - Cơ sở pháp lý (nếu có)
  
  2.2. Thực trạng của vấn đề
  
  2.2.1. Thuận lợi (100-150 từ)
  - Nêu các điều kiện thuận lợi hiện có
  - Dựa trên thông tin: ${request.currentReality.advantages}
  - Có số liệu cụ thể nếu có thể
  
  2.2.2. Khó khăn (150-200 từ)
  - Phân tích các khó khăn, hạn chế
  - Dựa trên thông tin: ${request.currentReality.disadvantages}
  - Nêu rõ nguyên nhân của khó khăn
  - Có số liệu, ví dụ cụ thể
  
  2.3. Các giải pháp đã sử dụng (PHẦN TRỌNG TÂM - 1500-2000 từ)
  
  Dựa trên thông tin biện pháp: "${request.measures}", hãy chia thành 4-6 giải pháp cụ thể.
  
  Mỗi giải pháp phải có cấu trúc:
  
  **2.3.X. [Tên giải pháp]**
  
  a) Mục đích:
  - Nêu rõ mục đích của giải pháp này
  
  b) Cách thực hiện:
  - Bước 1: [Cụ thể]
  - Bước 2: [Cụ thể]
  - Bước 3: [Cụ thể]
  - ...
  
  c) Ví dụ minh họa:
  - Mô tả 1 tình huống cụ thể đã thực hiện
  - Có tên hoạt động, trò chơi, tình huống sư phạm
  - Có đối thoại, hành động của trẻ (nếu phù hợp)
  - Ví dụ: "Trong hoạt động 'Khám phá thế giới xung quanh' với chủ đề 'Gia đình', tôi tổ chức cho các bé..."
  
  d) Kết quả:
  - Hiệu quả của giải pháp này
  - Phản ứng của trẻ
  
  2.4. Hiệu quả của sáng kiến kinh nghiệm (300-500 từ)
  
  Dựa trên thông tin: "${request.results}"
  
  - Hiệu quả đối với trẻ:
    + Có số liệu cụ thể (%, số lượng trẻ)
    + So sánh trước và sau khi áp dụng
    + Ví dụ: "Trước khi áp dụng, chỉ có 60% trẻ tham gia tích cực. Sau 3 tháng, con số này tăng lên 92%"
  
  - Hiệu quả đối với giáo viên:
    + Thay đổi trong phương pháp giảng dạy
    + Tiết kiệm thời gian, công sức
  
  - Hiệu quả đối với nhà trường:
    + Đóng góp vào chất lượng giáo dục
    + Có thể nhân rộng không
  
  **III. KẾT LUẬN VÀ KIẾN NGHỊ**
  
  3.1. Kết luận (150-200 từ)
  - Tóm tắt những gì đã đạt được
  - Khẳng định giá trị của sáng kiến
  - Đánh giá tổng quan
  
  3.2. Bài học kinh nghiệm (100-150 từ)
  - Những điều rút ra được trong quá trình thực hiện
  - Những điểm cần lưu ý khi áp dụng
  
  3.3. Kiến nghị (100-150 từ)
  - Đề xuất với cấp trên (nếu có)
  - Hướng phát triển tiếp theo
  - Điều kiện để nhân rộng mô hình
  
  **IV. TÀI LIỆU THAM KHẢO**
  - Liệt kê 3-5 tài liệu tham khảo
  - Ưu tiên: Chương trình GDMN, Thông tư của Bộ GD&ĐT, sách chuyên ngành
  
  ----------------------------
  YÊU CẦU VĂN PHONG (CHỐNG "MÙI AI"):
  
  1. **Ngôn ngữ tự nhiên, chân thực**:
     - Dùng ngôi thứ nhất ("tôi", "chúng tôi") khi kể về trải nghiệm
     - Tránh từ ngữ sáo rỗng, hoa mỹ, lý thuyết suông
     - Viết như một giáo viên đang chia sẻ kinh nghiệm thực tế
  
  2. **Có dẫn chứng cụ thể**:
     - Tên hoạt động, trò chơi cụ thể
     - Tình huống sư phạm thực tế
     - Đối thoại với trẻ (nếu phù hợp)
     - Số liệu thực tế (%, số lượng)
  
  3. **Mạch lạc, logic**:
     - Các phần liên kết chặt chẽ với nhau
     - Giải pháp phải giải quyết được khó khăn đã nêu
     - Hiệu quả phải phù hợp với giải pháp
  
  4. **Không phóng đại**:
     - Thành tích phải thực tế, đo đếm được
     - Tránh dùng từ "hoàn toàn", "tuyệt đối", "100%"
  
  5. **Văn phong hành chính - khoa học nhưng "đời"**:
     - Trang trọng nhưng không cứng nhắc
     - Chuyên nghiệp nhưng gần gũi
     - Có thuật ngữ chuyên ngành nhưng dễ hiểu
  
  ----------------------------
  TỰ KIỂM TRA TRƯỚC KHI TRẢ KẾT QUẢ:
  
  ✓ KHÔNG có phần Mục lục (Table of Contents)?
  ✓ Bắt đầu trực tiếp từ phần I. ĐẶT VẤN ĐỀ?
  ✓ Đã đủ 4 phần lớn (I, II, III, IV)?
  ✓ Phần I đã đủ 3-4 trang?
  ✓ Phần II.2.1 (Cơ sở lý luận) đã có 2-3 lý thuyết tâm lý học?
  ✓ Phần II.2.3 (Giải pháp) đã có 5-7 giải pháp chi tiết?
  ✓ Mỗi giải pháp đã có đủ: a) b) c) d)?
  ✓ Phần II.2.4 (Hiệu quả) có số liệu, so sánh trước/sau?
  ✓ Văn phong tự nhiên, không "mùi AI"?
  ✓ Có dẫn chứng thực tế, tình huống cụ thể?
  ✓ Độ dài đã đạt 20-25 trang (8000-10000 từ)?
  ✓ Có tài liệu tham khảo (5-8 tài liệu)?
  
  (Lưu ý: Chỉ trả về nội dung bài viết, KHÔNG bao gồm lời dẫn của AI, KHÔNG có Mục lục)
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
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("Mã API Key này đã hết hạn mức miễn phí trong ngày. Cô có thể:\n1. Tạo API Key mới tại https://aistudio.google.com/app/apikey\n2. Đợi đến ngày mai để tiếp tục sử dụng\n3. Thử chuyển sang model khác trong Cài đặt");
    }
    if (error.message?.includes('404') || error.message?.includes('NOT_FOUND')) {
      throw new Error("Mô hình AI không khả dụng. Vui lòng thử model khác trong Cài đặt.");
    }
    throw new Error("Có lỗi xảy ra: " + (error.message || "Unknown error"));
  }
};