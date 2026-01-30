
import { SavedLessonPlan, LessonRequest } from "../types";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabaseClient";

// Lưu giáo án lên Cloud
export const savePlan = async (request: LessonRequest, content: string): Promise<SavedLessonPlan> => {
  // Get session from localStorage directly to bypass SDK AbortError
  const sessionData = localStorage.getItem('sb-savcmyugqmwviplclvec-auth-token');

  if (!sessionData) {
    throw new Error("Cô cần đăng nhập để lưu giáo án.");
  }

  let session;
  try {
    session = JSON.parse(sessionData);
  } catch {
    throw new Error("Session không hợp lệ. Vui lòng đăng nhập lại.");
  }

  const accessToken = session?.access_token;
  const userId = session?.user?.id;

  if (!accessToken || !userId) {
    throw new Error("Cô cần đăng nhập để lưu giáo án.");
  }

  const newPlan = {
    user_id: userId,
    title: request.topic,
    content: content,
    request_data: request,
    created_at: new Date().toISOString()
  };

  // Use raw fetch to bypass SDK AbortErrors completely
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/lesson_plans`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(newPlan)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const data = result[0];

    return {
      id: data.id,
      createdAt: data.created_at,
      request: data.request_data,
      content: data.content,
      title: data.title
    };

  } catch (err: any) {
    console.error("Raw Fetch Save Error:", err);
    throw new Error("Lỗi kết nối (Raw): " + err.message);
  }
};


// Lấy danh sách giáo án từ Cloud
export const getPlans = async (): Promise<SavedLessonPlan[]> => {
  try {
    // Get session from localStorage directly to bypass SDK AbortError
    const sessionData = localStorage.getItem('sb-savcmyugqmwviplclvec-auth-token');

    if (!sessionData) {
      console.warn("No session found, returning empty list");
      return [];
    }

    let session;
    try {
      session = JSON.parse(sessionData);
    } catch {
      console.warn("Invalid session, returning empty list");
      return [];
    }

    const accessToken = session?.access_token;

    if (!accessToken) {
      console.warn("No access token, returning empty list");
      return [];
    }

    // Use raw fetch with timeout to bypass SDK AbortErrors
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/lesson_plans?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("Failed to fetch plans:", response.status, response.statusText);
      return [];
    }

    const data = await response.json();

    return (data || []).map((item: any) => ({
      id: item.id,
      createdAt: item.created_at,
      request: item.request_data,
      content: item.content,
      title: item.title
    }));
  } catch (err: any) {
    console.error("Lỗi tải giáo án (Catch):", err);
    return [];
  }
};

// Xóa giáo án
export const deletePlan = async (id: string): Promise<void> => {
  // Get session from localStorage directly to bypass SDK AbortError
  const sessionData = localStorage.getItem('sb-savcmyugqmwviplclvec-auth-token');

  if (!sessionData) {
    throw new Error("Cô cần đăng nhập để xóa giáo án.");
  }

  let session;
  try {
    session = JSON.parse(sessionData);
  } catch {
    throw new Error("Session không hợp lệ. Vui lòng đăng nhập lại.");
  }

  const accessToken = session?.access_token;

  if (!accessToken) {
    throw new Error("Cô cần đăng nhập để xóa giáo án.");
  }

  // Use raw fetch to bypass SDK AbortErrors
  const response = await fetch(`${SUPABASE_URL}/rest/v1/lesson_plans?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Không thể xóa giáo án: ${response.status} - ${errorText}`);
  }
};

// Lưu API Key
export const saveApiKey = (key: string) => {
  localStorage.setItem('MAMNON_AI_API_KEY', key);
};

// Lấy API Key (Ưu tiên từ DB, sau đó đến LocalStorage)
export const getApiKey = async (userId?: string): Promise<string | null> => {
  // 1. Check LocalStorage first (Fastest)
  const localKey = localStorage.getItem('MAMNON_AI_API_KEY');
  if (localKey) return localKey;

  // 2. Fallback to Database
  try {
    let uid = userId;
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession();
      uid = session?.user?.id;
    }

    if (uid) {
      const { data } = await supabase
        .from('profiles')
        .select('api_key')
        .eq('id', uid)
        .single();

      if (data?.api_key) {
        localStorage.setItem('MAMNON_AI_API_KEY', data.api_key); // Cache it
        return data.api_key;
      }
    }
  } catch (err) {
    // Ignore DB errors (benign)
  }

  // 3. Environment Variable (Last resort)
  return import.meta.env.VITE_GOOGLE_API_KEY || null;
};
