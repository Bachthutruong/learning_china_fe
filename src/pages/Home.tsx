import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { CheckCircle, BookOpen, Target, BrainCircuit, Sparkles, Trophy, Users, Eye, Calendar, ArrowRight } from 'lucide-react'
import { api } from '../services/api'

const features = [
  {
    icon: BookOpen,
    title: 'Học từ vựng thông minh',
    description: 'Học từ vựng được cá nhân hóa theo sở thích và trình độ của bạn với AI.',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Target,
    title: 'Bài test thích ứng',
    description: 'Các bài test tự động điều chỉnh theo hiệu suất của bạn, đảm bảo luôn thử thách nhưng không quá khó.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: BrainCircuit,
    title: 'Test năng lực AI',
    description: 'Đánh giá chính xác trình độ tiếng Trung của bạn từ A1 đến C2 với công nghệ AI tiên tiến.',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: Trophy,
    title: 'Cuộc thi ngôn ngữ',
    description: 'Tham gia các cuộc thi với người học khác, cạnh tranh và giành giải thưởng.',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    icon: CheckCircle,
    title: 'Theo dõi tiến độ',
    description: 'Kiếm điểm kinh nghiệm và xu, xem cấp độ tăng lên và theo dõi hành trình học tập.',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    icon: Users,
    title: 'Cộng đồng học tập',
    description: 'Kết nối với những người học khác, chia sẻ kinh nghiệm và hỗ trợ lẫn nhau.',
    gradient: 'from-teal-500 to-blue-500'
  }
]

interface BlogPost {
  _id: string
  title: string
  content: string
  excerpt?: string
  featuredImage?: string
  author: {
    _id: string
    name: string
    email: string
  }
  status: 'draft' | 'published'
  publishedAt?: string
  views: number
  tags?: string[]
  slug?: string
  createdAt: string
  updatedAt: string
}

export const Home = () => {
  const navigate = useNavigate()
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  useEffect(() => {
    fetchBlogPosts()
  }, [])

  const fetchBlogPosts = async () => {
    try {
      setLoadingPosts(true)
      const response = await api.get('/blog-posts', {
        params: { page: 1, limit: 6 }
      })
      setBlogPosts(response.data.posts || [])
    } catch (error) {
      console.error('Error fetching blog posts:', error)
    } finally {
      setLoadingPosts(false)
    }
  }

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 -skew-y-3 transform-gpu"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                Khám phá thế giới tiếng Trung
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto md:mx-0">
                Tham gia Mandarin Mastery để chuyển đổi trải nghiệm học tập của bạn. 
                Bài học cá nhân hóa, bài test AI và hành trình thú vị từ người mới bắt đầu đến thành thạo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  onClick={() => navigate('/register')}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Bắt đầu miễn phí
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2"
                  onClick={() => navigate('/help')}
                >
                  Tìm hiểu thêm
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative h-64 md:h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="absolute inset-4 bg-white rounded-xl shadow-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-2xl">中</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Chinese Learning</h3>
                    <p className="text-gray-600">Học tiếng Trung thông minh</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tại sao chọn Mandarin Mastery?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Chúng tôi kết hợp thiết kế hiện đại với công nghệ mạnh mẽ để tạo ra ứng dụng học ngôn ngữ tốt nhất.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
                  <CardHeader className="text-center">
                    <div className={`mx-auto bg-gradient-to-r ${feature.gradient} rounded-full w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-100">Người học</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-blue-100">Từ vựng</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Tỷ lệ thành công</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Hỗ trợ</div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Section */}
      {blogPosts.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Bài viết mới nhất
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Khám phá các bài viết hữu ích về học tiếng Trung và văn hóa Trung Quốc
              </p>
            </div>
            {loadingPosts ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải bài viết...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogPosts.map((post) => (
                  <Card key={post._id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg overflow-hidden">
                    {post.featuredImage && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Calendar className="h-4 w-4" />
                        {post.publishedAt && new Date(post.publishedAt).toLocaleDateString('vi-VN')}
                        <span className="mx-2">•</span>
                        <Eye className="h-4 w-4" />
                        {post.views} lượt xem
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600 line-clamp-3 mb-4">
                        {post.excerpt || stripHtml(post.content).substring(0, 150) + '...'}
                      </CardDescription>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <Button
                        variant="link"
                        className="p-0 text-blue-600 hover:text-blue-700 group-hover:underline"
                        onClick={() => navigate(`/blog/${post.slug || post._id}`)}
                      >
                        Đọc thêm
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sẵn sàng bắt đầu hành trình học tiếng Trung?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Tham gia cùng hàng nghìn người học khác và khám phá thế giới tiếng Trung một cách thú vị và hiệu quả.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <Link to="/register" className="flex items-center">
                <Sparkles className="mr-2 h-5 w-5" />
                Đăng ký ngay
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-2">
              <Link to="/login">Đã có tài khoản?</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}


