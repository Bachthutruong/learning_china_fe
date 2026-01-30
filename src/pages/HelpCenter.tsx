import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { 
  Search, 
  MessageCircle, 
  Mail, 
  Phone, 
  BookOpen,
  HelpCircle,
  ChevronRight,
  CheckCircle,
  Star
} from 'lucide-react'
import { useState } from 'react'

const helpCategories = [
  {
    id: 'getting-started',
    title: 'Bắt đầu học',
    description: 'Hướng dẫn cơ bản để bắt đầu hành trình học tiếng Trung',
    icon: BookOpen,
    articles: 12,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'vocabulary',
    title: 'Từ vựng',
    description: 'Cách học và ghi nhớ từ vựng hiệu quả',
    icon: BookOpen,
    articles: 8,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'tests',
    title: 'Bài kiểm tra',
    description: 'Hướng dẫn làm bài test và test năng lực',
    icon: HelpCircle,
    articles: 6,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'account',
    title: 'Tài khoản',
    description: 'Quản lý tài khoản và cài đặt cá nhân',
    icon: MessageCircle,
    articles: 10,
    color: 'from-orange-500 to-red-500'
  }
]

const popularArticles = [
  {
    title: 'Làm thế nào để bắt đầu học tiếng Trung?',
    category: 'Bắt đầu học',
    views: 1250,
    helpful: 95
  },
  {
    title: 'Cách sử dụng hệ thống XP và xu',
    category: 'Tài khoản',
    views: 980,
    helpful: 88
  },
  {
    title: 'Làm thế nào để làm bài test hiệu quả?',
    category: 'Bài kiểm tra',
    views: 756,
    helpful: 92
  },
  {
    title: 'Cách học từ vựng nhanh và nhớ lâu',
    category: 'Từ vựng',
    views: 1100,
    helpful: 90
  }
]

const contactMethods = [
  {
    title: 'Email hỗ trợ',
    description: 'Phản hồi trong vòng 24 giờ',
    contact: 'support@chineselearning.com',
    icon: Mail,
    responseTime: '24 giờ'
  },
  {
    title: 'Hotline',
    description: 'Hỗ trợ trực tiếp qua điện thoại',
    contact: '+84 123 456 789',
    icon: Phone,
    responseTime: 'Ngay lập tức'
  },
  {
    title: 'Chat trực tuyến',
    description: 'Hỗ trợ trực tiếp qua chat',
    contact: 'Chat với chúng tôi',
    icon: MessageCircle,
    responseTime: 'Ngay lập tức'
  }
]

export const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
           <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-primary text-xs font-bold uppercase tracking-widest">Trung tâm hỗ trợ học viên</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Chúng tôi có thể <span className="text-primary">Giúp gì cho bạn?</span></h1>
           
           <div className="pt-6">
              <div className="relative group max-w-2xl mx-auto">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                 <input
                   type="text"
                   placeholder="Tìm kiếm giải pháp, hướng dẫn, hoặc câu hỏi..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full h-16 pl-14 pr-6 bg-white border border-gray-100 rounded-[2rem] shadow-xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-gray-700"
                 />
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <h2 className="text-2xl font-black text-gray-900 flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-primary" /> Chủ đề trợ giúp
           </h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {helpCategories.map((cat) => (
                <div key={cat.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                   <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${cat.color} opacity-5 rounded-bl-[3rem]`} />
                   <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white shadow-lg mb-6 group-hover:rotate-6 transition-transform`}>
                      <cat.icon className="w-7 h-7" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900 mb-2">{cat.title}</h3>
                   <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">{cat.description}</p>
                   <div className="flex items-center text-[10px] font-black uppercase text-primary tracking-widest">
                      {cat.articles} Bài hướng dẫn <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-8">
              <h2 className="text-2xl font-black text-gray-900 flex items-center">
                 <Star className="w-6 h-6 mr-2 text-amber-500 fill-current" /> Bài viết được quan tâm nhất
              </h2>
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden divide-y divide-gray-50">
                 {popularArticles.map((article, i) => (
                   <div key={i} className="p-6 md:p-8 hover:bg-gray-50/50 transition-colors cursor-pointer group flex items-center justify-between gap-6">
                      <div className="space-y-2">
                         <h4 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors leading-snug">{article.title}</h4>
                         <div className="flex items-center space-x-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <span className="text-primary">{article.category}</span>
                            <span className="flex items-center"><CheckCircle className="w-3 h-3 mr-1 text-green-500" /> {article.helpful}% hữu ích</span>
                            <span>{article.views.toLocaleString()} Lượt xem</span>
                         </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                         <ChevronRight className="w-5 h-5" />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-8">
              <h2 className="text-2xl font-black text-gray-900">Kênh liên hệ</h2>
              <div className="space-y-4">
                 {contactMethods.map((method, i) => (
                   <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                         <method.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-sm font-black text-gray-900">{method.title}</p>
                         <p className="text-xs text-gray-500 font-medium mb-2">{method.description}</p>
                         <p className="text-sm font-black text-primary truncate">{method.contact}</p>
                      </div>
                      <Badge className="bg-green-50 text-green-600 border-none font-black text-[8px] uppercase">{method.responseTime}</Badge>
                   </div>
                 ))}
              </div>
              
              <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
                 <div className="absolute inset-0 chinese-gradient opacity-20" />
                 <div className="relative z-10 space-y-4">
                    <h4 className="text-xl font-black">Cộng đồng hỗ trợ</h4>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">Tham gia nhóm trao đổi học tập trên Discord hoặc Facebook để được giải đáp nhanh nhất từ các Mentor.</p>
                    <Button className="w-full bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-black h-12">Tham gia cộng đồng</Button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}