import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  Search, 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock, 
  BookOpen,
  HelpCircle,
  ChevronRight,
  CheckCircle
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trung tâm trợ giúp</h1>
          <p className="text-gray-600">Tìm câu trả lời cho các câu hỏi của bạn</p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Tìm kiếm câu trả lời..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Help Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Danh mục trợ giúp</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {helpCategories.map((category) => {
              const Icon = category.icon
              return (
                <Card key={category.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{category.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{category.articles} bài viết</Badge>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Popular Articles */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Bài viết phổ biến
                </CardTitle>
                <CardDescription>
                  Các câu hỏi được tìm kiếm nhiều nhất
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popularArticles.map((article, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{article.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{article.category}</span>
                            <span>{article.views} lượt xem</span>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{article.helpful}% hữu ích</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Support */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  Liên hệ hỗ trợ
                </CardTitle>
                <CardDescription>
                  Cần hỗ trợ thêm? Liên hệ với chúng tôi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactMethods.map((method, index) => {
                  const Icon = method.icon
                  return (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Icon className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{method.title}</h4>
                          <p className="text-sm text-gray-600">{method.description}</p>
                          <p className="text-sm font-medium text-blue-600">{method.contact}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{method.responseTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


