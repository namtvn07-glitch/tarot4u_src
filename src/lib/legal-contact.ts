import { env } from "@/lib/env";

// Một nguồn duy nhất để Footer và các trang pháp lý không lệch nhau.
// Giá trị đến từ env: đổi email hỗ trợ là việc vận hành, không phải việc sửa
// code — và không ai muốn địa chỉ liên hệ thật nằm cứng trong repo công khai.
export const SUPPORT_EMAIL = env.NEXT_PUBLIC_SUPPORT_EMAIL;
