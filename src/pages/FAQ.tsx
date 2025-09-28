import { Card, CardContent} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  HelpCircle,
  BookOpen,
  TestTube,
  // Trophy,
  User
} from 'lucide-react'
import { useState } from 'react'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Câu hỏi thường gặp</h1>
          <p className="text-gray-600">Tìm câu trả lời cho các câu hỏi phổ biến</p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Danh mục</h2>
          <div className="flex flex-wrap gap-4 mb-6">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
            >
              Tất cả
            </Button>
            {faqCategories.map((category) => {
              const Icon = category.icon
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {category.title}
                </Button>
              )
            })}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((faq) => {
            const isExpanded = expandedItems.includes(faq.id)
            const category = faqCategories.find(cat => cat.id === faq.category)
            
            return (
              <Card key={faq.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div 
                    className="cursor-pointer"
                    onClick={() => toggleExpanded(faq.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {category && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <category.icon className="h-3 w-3" />
                              {category.title}
                            </Badge>
                          )}
                          <span className="text-sm text-gray-500">{faq.helpful}% hữu ích</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg">{faq.question}</h3>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      <div className="flex items-center gap-4 mt-4">
                        <Button variant="outline" size="sm">
                          Hữu ích
                        </Button>
                        <Button variant="outline" size="sm">
                          Không hữu ích
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredFAQs.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy câu hỏi</h3>
              <p className="text-gray-600 mb-4">Hãy thử tìm kiếm với từ khóa khác hoặc liên hệ với chúng tôi</p>
              <Button>Liên hệ hỗ trợ</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


