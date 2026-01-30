import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  Search, 
  ChevronDown, 
  HelpCircle,
  BookOpen,
  TestTube,
  User,
  Star
} from 'lucide-react'

const faqCategories = [
  {
    id: 'general',
    title: 'Câu hỏi chung',
    icon: HelpCircle,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'learning',
    title: 'Học tập',
    icon: BookOpen,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'tests',
    title: 'Bài kiểm tra',
    icon: TestTube,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'account',
    title: 'Tài khoản',
    icon: User,
    color: 'from-orange-500 to-red-500'
  }
]

const faqData = [
  {
    id: 1,
    category: 'general',
    question: 'Chinese Learning là gì?',
    answer: 'Chinese Learning là nền tảng học tiếng Trung thông minh sử dụng AI để cá nhân hóa trải nghiệm học tập. Chúng tôi cung cấp các khóa học từ cơ bản đến nâng cao, bài kiểm tra thích ứng và hệ thống gamification để giúp bạn học tiếng Trung một cách hiệu quả và thú vị.',
    helpful: 95
  },
  {
    id: 2,
    category: 'learning',
    question: 'Làm thế nào để bắt đầu học?',
    answer: 'Để bắt đầu học, bạn cần tạo tài khoản miễn phí. Sau đó, bạn có thể chọn chủ đề quan tâm, làm bài test năng lực để xác định trình độ, và bắt đầu học từ vựng hoặc làm bài kiểm tra phù hợp với cấp độ của mình.',
    helpful: 88
  },
  {
    id: 3,
    category: 'learning',
    question: 'Hệ thống XP và xu hoạt động như thế nào?',
    answer: 'XP (Experience Points) là điểm kinh nghiệm bạn nhận được khi hoàn thành các hoạt động học tập. Xu là đơn vị tiền tệ trong ứng dụng, được sử dụng để mua các tính năng premium hoặc tham gia cuộc thi. Bạn có thể kiếm XP và xu thông qua học từ vựng, làm bài test, check-in hàng ngày và báo cáo lỗi.',
    helpful: 92
  },
  {
    id: 4,
    category: 'tests',
    question: 'Test năng lực là gì?',
    answer: 'Test năng lực là bài kiểm tra thích ứng giúp đánh giá trình độ tiếng Trung của bạn từ A1 đến C2. Bài test sử dụng thuật toán AI để điều chỉnh độ khó câu hỏi dựa trên câu trả lời của bạn, đảm bảo kết quả chính xác và phù hợp với khả năng thực tế.',
    helpful: 90
  },
  {
    id: 5,
    category: 'tests',
    question: 'Làm thế nào để làm bài test hiệu quả?',
    answer: 'Để làm bài test hiệu quả, hãy đảm bảo bạn có kết nối internet ổn định, tập trung cao độ, và trả lời câu hỏi một cách trung thực. Không cần vội vàng, hãy đọc kỹ câu hỏi và các lựa chọn trước khi đưa ra câu trả lời.',
    helpful: 87
  },
  {
    id: 6,
    category: 'account',
    question: 'Làm thế nào để thay đổi thông tin cá nhân?',
    answer: 'Bạn có thể thay đổi thông tin cá nhân bằng cách vào trang Profile, nhấn nút "Chỉnh sửa" và cập nhật thông tin mong muốn. Một số thông tin như email có thể cần xác thực bổ sung.',
    helpful: 85
  },
  {
    id: 7,
    category: 'general',
    question: 'Ứng dụng có miễn phí không?',
    answer: 'Chinese Learning cung cấp gói miễn phí với đầy đủ tính năng cơ bản. Bạn có thể học từ vựng, làm bài test, và sử dụng hầu hết các tính năng mà không cần trả phí. Các tính năng premium như cuộc thi và nội dung độc quyền có thể yêu cầu xu hoặc gói đăng ký.',
    helpful: 93
  },
  {
    id: 8,
    category: 'learning',
    question: 'Làm thế nào để học từ vựng hiệu quả?',
    answer: 'Để học từ vựng hiệu quả, hãy chọn chủ đề bạn quan tâm, học từ vựng theo ngữ cảnh, luyện tập thường xuyên, và sử dụng tính năng quiz để kiểm tra kiến thức. Ứng dụng sử dụng thuật toán spaced repetition để giúp bạn ghi nhớ lâu hơn.',
    helpful: 91
  }
]

export const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedItems, setExpandedItems] = useState<number[]>([])

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
           <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-primary text-xs font-bold uppercase tracking-widest">Câu hỏi thường gặp</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Giải đáp <span className="text-primary">Thắc mắc</span></h1>
           <p className="text-gray-500 font-medium">Mọi điều bạn cần biết về lộ trình học tập, hệ thống điểm thưởng và cách vận hành của Jiudi Learning.</p>
        </div>

        {/* Search & Categories */}
        <div className="space-y-8">
           <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Nhập từ khóa cần tìm kiếm (ví dụ: XP, nạp xu, bài test...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 pl-14 pr-6 bg-white border border-gray-100 rounded-[2rem] shadow-xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-gray-700"
              />
           </div>

           <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  selectedCategory === 'all'
                    ? 'chinese-gradient text-white shadow-lg'
                    : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                Tất cả chủ đề
              </button>
              {faqCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    selectedCategory === cat.id
                      ? 'chinese-gradient text-white shadow-lg'
                      : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50 hover:text-gray-600'
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  <span>{cat.title}</span>
                </button>
              ))}
           </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((faq) => {
            const isExpanded = expandedItems.includes(faq.id)
            const category = faqCategories.find(cat => cat.id === faq.category)
            
            return (
              <div 
                key={faq.id} 
                className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'border-primary shadow-xl ring-4 ring-primary/5' : 'border-gray-100 shadow-sm hover:shadow-md'
                }`}
              >
                <div 
                  className="p-6 md:p-8 cursor-pointer group"
                  onClick={() => toggleExpanded(faq.id)}
                >
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                         {category && (
                           <Badge variant="outline" className="rounded-lg px-2 py-0.5 border-primary/20 text-primary text-[8px] font-black uppercase tracking-widest">
                              {category.title}
                           </Badge>
                         )}
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                            <Star className="w-3 h-3 mr-1 text-amber-400 fill-current" /> {faq.helpful}% tin cậy
                         </span>
                      </div>
                      <h3 className={`text-lg md:text-xl font-black transition-colors ${isExpanded ? 'text-primary' : 'text-gray-900 group-hover:text-primary'}`}>
                         {faq.question}
                      </h3>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'chinese-gradient text-white rotate-180' : 'bg-gray-50 text-gray-400'}`}>
                       <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-6 md:px-8 pb-8 animate-in slide-in-from-top duration-300">
                    <div className="pt-6 border-t border-gray-50">
                       <p className="text-gray-600 leading-relaxed font-medium text-base">
                          {faq.answer}
                       </p>
                       <div className="mt-8 flex items-center justify-between">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Thông tin này có hữu ích?</p>
                          <div className="flex space-x-2">
                             <Button variant="ghost" size="sm" className="rounded-lg font-bold text-xs text-green-600 hover:bg-green-50">Cực kỳ hữu ích</Button>
                             <Button variant="ghost" size="sm" className="rounded-lg font-bold text-xs text-red-400 hover:bg-red-50">Vẫn còn thắc mắc</Button>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="bg-white p-20 rounded-[3rem] border border-gray-100 shadow-sm text-center space-y-6">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <Search className="w-10 h-10" />
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900">Không tìm thấy kết quả</h3>
                <p className="text-gray-500 font-medium">Thử thay đổi từ khóa hoặc bộ lọc danh mục.</p>
             </div>
             <Button className="chinese-gradient h-12 px-8 rounded-xl font-black text-white shadow-lg">Gửi câu hỏi của bạn</Button>
          </div>
        )}
      </div>
    </div>
  )
}