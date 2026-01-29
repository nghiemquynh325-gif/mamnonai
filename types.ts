
export enum AgeGroup {
  NHA_TRE_24_36 = "Nhà trẻ (24 - 36 tháng)",
  MAU_GIAO_3_4 = "Mẫu giáo bé (3 - 4 tuổi)",
  MAU_GIAO_4_5 = "Mẫu giáo nhỡ (4 - 5 tuổi)",
  MAU_GIAO_5_6 = "Mẫu giáo lớn (5 - 6 tuổi)"
}

export enum Subject {
  PT_NHAN_THUC = "Phát triển nhận thức",
  PT_THAM_MY = "Phát triển thẩm mỹ",
  PT_NGON_NGU = "Phát triển ngôn ngữ",
  PT_TC_KNXH = "Phát triển tình cảm & KNXH",
  VAN_HOC = "Làm quen với văn học (Thơ/Truyện)",
  TOAN = "Làm quen với toán",
  KHAM_PHA = "Khám phá khoa học/xã hội",
  TAO_HINH = "Hoạt động tạo hình",
  AM_NHAC = "Giáo dục âm nhạc",
  THE_CHAT = "Giáo dục thể chất",
  KY_NANG = "Giáo dục kỹ năng sống"
}

export enum LessonPurpose {
  DAILY = "Dạy thường ngày",
  OBSERVATION = "Dự giờ – thao giảng",
  COMPETITION = "Thi giáo viên giỏi"
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
}

export interface LessonRequest {
  // Administrative Info
  author?: string;       // Người soạn/Người dạy
  unit?: string;         // Đơn vị (Trường/Lớp)
  datePrepared?: string; // Ngày soạn
  dateTaught?: string;   // Ngày dạy

  // Core Lesson Info
  ageGroup: AgeGroup;
  subject: Subject;      // Lĩnh vực
  theme?: string;        // Chủ đề (VD: Thế giới thực vật)
  topic: string;         // Đề tài (VD: Vẽ hoa hồng)
  duration: string;
  goals?: string;
  purpose: LessonPurpose;
  facilities?: string;
}

export interface SavedLessonPlan {
  id: string;
  createdAt: number | string; // Cho phép string vì Supabase trả về ISO String
  request: LessonRequest;
  content: string;
  title: string;
}

export interface HistoryItem {
  id: string;
  topic: string;
  subject: Subject;
  timestamp: number;
  content: string;
}

export interface SKKNRequest {
  topic: string;
  field: string;
  ageGroup: string; // Thêm độ tuổi
  role: string;
  unit: string;
  currentReality: {
    advantages: string;
    disadvantages: string;
  };
  measures: string;
  results: string;
}
