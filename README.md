# Chinese Learning Platform - Frontend

Ứng dụng học tiếng Trung với giao diện đẹp và nhiều tính năng thú vị.

## Tính năng

- 🎯 **Học từ vựng thông minh**: Học từ vựng được cá nhân hóa theo sở thích và trình độ
- 🧠 **Bài test thích ứng**: Các bài test tự động điều chỉnh theo hiệu suất của bạn
- 🏆 **Test năng lực AI**: Đánh giá chính xác trình độ tiếng Trung từ A1 đến C2
- 🎮 **Cuộc thi ngôn ngữ**: Tham gia các cuộc thi với người học khác
- 📊 **Theo dõi tiến độ**: Kiếm điểm kinh nghiệm và xu, xem cấp độ tăng lên
- 🎨 **Giao diện đẹp**: Thiết kế hiện đại, nhiều màu sắc, responsive mobile

## Công nghệ sử dụng

- **React 18** - Thư viện UI
- **TypeScript** - Ngôn ngữ lập trình
- **Vite** - Build tool nhanh
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Component library
- **Lucide React** - Icon library
- **React Router** - Routing
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Framer Motion** - Animation
- **React Hot Toast** - Notifications

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env` từ `.env.example`:
```bash
cp env.example .env
```

3. Cấu hình API URL trong file `.env`:
```
VITE_API_URL=http://localhost:5005/api
```

4. Chạy ứng dụng:
```bash
npm run dev
```

## Cấu trúc thư mục

```
src/
├── components/          # Components tái sử dụng
│   ├── ui/             # UI components (shadcn/ui)
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard components
│   ├── vocabulary/     # Vocabulary learning components
│   ├── tests/          # Test components
│   ├── proficiency/    # Proficiency test components
│   └── shared/         # Shared components
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── lib/                # Utilities
├── pages/              # Page components
├── services/           # API services
└── types/              # TypeScript types
```

## Tính năng chính

### 1. Học từ vựng
- Chọn chủ đề để học từ vựng
- Phát âm thanh từ vựng
- Quiz kiểm tra kiến thức
- Theo dõi tiến độ học tập

### 2. Bài test
- Bài test theo cấp độ
- Timer đếm ngược
- Kết quả chi tiết
- Phần thưởng XP và xu

### 3. Test năng lực
- Test thích ứng với AI
- Xác định trình độ chính xác
- Lộ trình học tập cá nhân hóa

### 4. Cuộc thi
- Tham gia cuộc thi với người khác
- Bảng xếp hạng
- Phần thưởng hấp dẫn

### 5. Hồ sơ cá nhân
- Thông tin người dùng
- Thống kê học tập
- Thành tích và danh hiệu
- Lịch sử báo cáo

### 6. Bảng quản trị
- Quản lý từ vựng
- Quản lý chủ đề
- Quản lý cấp độ
- Xử lý báo cáo lỗi

## Responsive Design

Ứng dụng được thiết kế responsive hoàn toàn, hoạt động tốt trên:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large Desktop (1280px+)

## Giao diện

- **Màu sắc**: Gradient đẹp mắt với nhiều màu sắc
- **Animation**: Hiệu ứng mượt mà với Framer Motion
- **Icons**: Icon đẹp với Lucide React
- **Typography**: Font chữ dễ đọc
- **Spacing**: Khoảng cách hợp lý
- **Shadows**: Đổ bóng tinh tế

## Development

```bash
# Chạy development server
npm run dev

# Build cho production
npm run build

# Preview build
npm run preview

# Lint code
npm run lint
```

## Deployment

1. Build ứng dụng:
```bash
npm run build
```

2. Deploy thư mục `dist` lên hosting service như:
- Vercel
- Netlify
- GitHub Pages
- Firebase Hosting

## Liên kết với Backend

Frontend kết nối với backend thông qua REST API:
- Authentication: `/api/auth`
- Vocabulary: `/api/vocabulary`
- Tests: `/api/tests`
- Proficiency: `/api/proficiency`
- Reports: `/api/reports`
- Users: `/api/users`

## License

MIT License


