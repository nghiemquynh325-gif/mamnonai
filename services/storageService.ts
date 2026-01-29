
import { SavedLessonPlan, LessonRequest } from "../types";
import { supabase } from "./supabaseClient";

// Lưu giáo án lên Cloud
export const savePlan = async (request: LessonRequest, content: string): Promise<SavedLessonPlan> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Cô cần đăng nhập để lưu giáo án.");
  }

  const newPlan = {
    user_id: user.id,
    title: request.topic,
    content: content,
    request_data: request,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('lesson_plans')
    .insert([newPlan])
    .select()
    .single();

  if (error) {
    console.error("Lỗi lưu giáo án:", error);
    throw new Error("Không thể lưu giáo án. Vui lòng kiểm tra mạng.");
  }

  return {
    id: data.id,
    createdAt: data.created_at, // Supabase trả về chuỗi ISO
    request: data.request_data,
    content: data.content,
    title: data.title
  };
};

// Lấy danh sách giáo án từ Cloud
export const getPlans = async (): Promise<SavedLessonPlan[]> => {
  const { data, error } = await supabase
    .from('lesson_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Lỗi tải giáo án:", error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    createdAt: item.created_at,
    request: item.request_data, // JSONB tự động parse thành object
    content: item.content,
    title: item.title
  }));
};

// Xóa giáo án
export const deletePlan = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('lesson_plans')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error("Không thể xóa giáo án này.");
  }
};
