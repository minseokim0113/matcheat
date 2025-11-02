/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "cdn-icons-png.flaticon.com", // 🔹 로고 아이콘
      "images.unsplash.com",        // 🔹 배경 이미지
    ],
  },
};

module.exports = nextConfig;
