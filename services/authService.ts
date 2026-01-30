
import { User } from "../types";
import { supabase } from "./supabaseClient";

// Đăng ký tài khoản mới
export const register = async (name: string, email: string, password: string): Promise<User> => {
  // 1. Đăng ký auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error("Đăng ký thất bại, vui lòng thử lại.");

  // 2. Lưu thông tin phụ (Tên) vào bảng profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([
      { id: authData.user.id, full_name: name, email: email }
    ]);

  if (profileError) {
    console.error("Lỗi tạo profile:", profileError);
    // Vẫn trả về user nhưng cảnh báo log
  }

  return {
    id: authData.user.id,
    name: name,
    email: email,
  };
};

// Đăng nhập
export const login = async (email: string, password: string, remember: boolean): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error("Email hoặc mật khẩu không đúng.");
  if (!data.user) throw new Error("Lỗi đăng nhập.");

  // Tối ưu: Lấy profile song song hoặc không chặn nếu chậm
  let userName = email.split('@')[0];

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.user.id)
      .maybeSingle(); // Dùng maybeSingle nhanh hơn single (không lỗi nếu null)

    if (profile && profile.full_name) {
      userName = profile.full_name;
    }
  } catch (err) {
    console.warn("Profile load slow/error:", err);
  }

  return {
    id: data.user.id,
    name: userName,
    email: data.user.email || email,
  };
};

// Kiểm tra user hiện tại
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  // Lấy profile
  let userName = session.user.email?.split('@')[0] || "Cô giáo";

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profile?.full_name) userName = profile.full_name;
  } catch (e) {
    // Ignore profile error
  }

  return {
    id: session.user.id,
    name: userName,
    email: session.user.email || "",
  };
};

// Đăng xuất
export const logout = async () => {
  await supabase.auth.signOut();
  // Clear local storage to ensure next user doesn't use old key/model
  localStorage.removeItem('MAMNON_AI_API_KEY');
  localStorage.removeItem('MAMNON_AI_MODEL');
};

// Quên mật khẩu
export const forgotPassword = async (email: string): Promise<string> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.href, // Quay lại trang hiện tại để reset
  });

  if (error) throw new Error(error.message);
  return "Hệ thống đã gửi link khôi phục mật khẩu vào email của cô!";
};
