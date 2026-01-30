import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { CheckCircle, BookOpen, Target, BrainCircuit, Sparkles, Trophy, Users, Eye, Calendar, ArrowRight } from 'lucide-react'
import { api } from '../services/api'

const features = [
  {
    icon: BookOpen,
    title: 'Học từ vựng thông minh',
    description: 'Học từ vựng được cá nhân hóa theo sở thích và trình độ của bạn với công nghệ lặp lại ngắt quãng.',
    gradient: 'from-red-500 to-orange-500',
    iconColor: 'text-red-600'
  },
  {
    icon: Target,
    title: 'Bài test thích ứng',
    description: 'Các bài test tự động điều chỉnh theo hiệu suất của bạn, đảm bảo luôn thử thách nhưng không quá khó.',
    gradient: 'from-amber-400 to-yellow-600',
    iconColor: 'text-amber-600'
  },
  {
    icon: BrainCircuit,
    title: 'Test năng lực AI',
    description: 'Đánh giá chính xác trình độ tiếng Trung của bạn từ HSK 1 đến HSK 9 với công nghệ AI tiên tiến.',
    gradient: 'from-emerald-400 to-teal-600',
    iconColor: 'text-emerald-600'
  },
  {
    icon: Trophy,
    title: 'Cuộc thi ngôn ngữ',
    description: 'Tham gia các cuộc thi với người học khác, cạnh tranh vị trí bảng xếp hạng và giành giải thưởng.',
    gradient: 'from-blue-500 to-indigo-600',
    iconColor: 'text-blue-600'
  },
  {
    icon: CheckCircle,
    title: 'Theo dõi tiến độ',
    description: 'Kiếm điểm kinh nghiệm và xu, xem cấp độ tăng lên và theo dõi hành trình học tập hàng ngày.',
    gradient: 'from-rose-500 to-red-700',
    iconColor: 'text-rose-600'
  },
  {
    icon: Users,
    title: 'Cộng đồng học tập',
    description: 'Kết nối với những người học khác, chia sẻ kinh nghiệm và hỗ trợ lẫn nhau trong hành trình chinh phục Hán ngữ.',
    gradient: 'from-purple-500 to-violet-600',
    iconColor: 'text-purple-600'
  }
]

export const Home = () => {
  const navigate = useNavigate()
  const [blogPosts, setBlogPosts] = useState<any[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  useEffect(() => {
    fetchBlogPosts()
  }, [])

  const fetchBlogPosts = async () => {
    try {
      setLoadingPosts(true)
      const response = await api.get('/blog-posts', {
        params: { page: 1, limit: 3 }
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
    <div className="min-h-screen bg-[#fdfaf6]">
      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 transform origin-top-right -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left space-y-8">
              <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20 animate-bounce-subtle">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-primary text-xs font-bold uppercase tracking-widest">Ứng dụng học tiếng Trung số 1</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
                Chinh phục <br />
                <span className="text-primary relative inline-block">
                  Tiếng Trung
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 5.5C40 2 120 2 199 5.5" stroke="#ee1c25" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
                <br />Thật Dễ Dàng.
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Jiudi Learning kết hợp trí tuệ nhân tạo (AI) với giáo trình chuẩn quốc tế, 
                giúp bạn đạt được mục tiêu ngôn ngữ nhanh hơn 3 lần so với phương pháp truyền thống.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Button 
                  size="lg" 
                  className="chinese-gradient h-14 px-8 text-lg rounded-2xl shadow-xl hover:shadow-primary/30 transition-all transform hover:-translate-y-1 group"
                  onClick={() => navigate('/register')}
                >
                  Bắt đầu ngay
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-14 px-8 text-lg rounded-2xl border-2 border-gray-200 hover:border-primary hover:text-primary transition-all"
                  onClick={() => navigate('/help')}
                >
                  Xem lộ trình học
                </Button>
              </div>
              
              <div className="flex items-center justify-center lg:justify-start space-x-4 pt-6 text-sm text-gray-500 font-medium">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                      <img src={`https://i.pravatar.cc/150?img=${i+10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <p>Hơn <span className="text-gray-900 font-bold">10,000+</span> học viên đang tham gia</p>
              </div>
            </div>
            
            <div className="relative lg:ml-12">
              <div className="relative z-10 animate-float">
                <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl border border-gray-100 rotate-3 transform-gpu">
                  <img 
                    src="https://images.unsplash.com/photo-1540633594418-3c74c673f4d2?auto=format&fit=crop&q=80&w=1000" 
                    alt="Learning Chinese" 
                    className="rounded-[2rem] shadow-inner object-cover h-[400px] w-full"
                  />
                  <div className="absolute -bottom-6 -left-6 glass-panel p-6 rounded-3xl shadow-2xl border-primary/20 space-y-3 animate-pulse-subtle">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Hôm nay</p>
                        <p className="text-sm font-black text-gray-900">+150 XP & 500 Xu</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-6 -right-6 glass-panel p-5 rounded-3xl shadow-2xl border-primary/20 animate-float delay-700">
                    <div className="text-center">
                      <p className="text-2xl font-black text-primary">HSK 6</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Mục tiêu của bạn</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Học viên', value: '10,000+', icon: Users, color: 'text-blue-600' },
              { label: 'Từ vựng', value: '50,000+', icon: BookOpen, color: 'text-red-600' },
              { label: 'Bài học', value: '1,200+', icon: Target, color: 'text-amber-600' },
              { label: 'Cộng đồng', value: '24/7', icon: Sparkles, color: 'text-purple-600' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow group">
                <div className={`w-12 h-12 ${stat.color} bg-current/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-primary text-sm font-black uppercase tracking-widest">Tính năng nổi bật</h2>
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Tất cả những gì bạn cần để thành thạo tiếng Trung
            </h3>
            <p className="text-lg text-gray-600">
              Jiudi Learning cung cấp hệ sinh thái học tập toàn diện từ cơ bản đến nâng cao.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="group p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-[0.03] rounded-bl-full group-hover:opacity-[0.08] transition-opacity`} />
                  
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-current/20 group-hover:rotate-6 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h4 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h4>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <div className="mt-8 pt-6 border-t border-gray-50 flex items-center text-sm font-bold text-primary group-hover:translate-x-2 transition-transform cursor-pointer">
                    Khám phá ngay <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      {blogPosts.length > 0 && (
        <section className="py-24 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div className="space-y-4 max-w-2xl">
                <h2 className="text-primary text-sm font-black uppercase tracking-widest">Blog & Tin tức</h2>
                <h3 className="text-4xl font-black text-gray-900 tracking-tight">Kinh nghiệm học tập</h3>
                <p className="text-lg text-gray-600">Cập nhật những phương pháp học hiệu quả và tin tức văn hóa Trung Hoa mới nhất.</p>
              </div>
              <Button 
                variant="outline" 
                className="rounded-xl border-2 font-bold px-6 h-12"
                onClick={() => navigate('/blog')}
              >
                Xem tất cả bài viết
              </Button>
            </div>

            {loadingPosts ? (
              <div className="grid md:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-[2rem] h-96 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogPosts.map((post) => (
                  <div 
                    key={post._id} 
                    className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={post.featuredImage || "https://images.unsplash.com/photo-1540633594418-3c74c673f4d2?auto=format&fit=crop&q=80&w=1000"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-primary shadow-sm">
                          {post.tags?.[0] || 'Kinh nghiệm'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-8 flex flex-col flex-grow">
                      <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {post.publishedAt && new Date(post.publishedAt).toLocaleDateString('vi-VN')}</span>
                        <span className="flex items-center"><Eye className="w-3 h-3 mr-1" /> {post.views} Views</span>
                      </div>
                      
                      <h4 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h4>
                      
                      <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-grow">
                        {post.excerpt || stripHtml(post.content).substring(0, 150) + '...'}
                      </p>
                      
                      <button 
                        className="flex items-center text-sm font-black text-gray-900 hover:text-primary transition-colors group/btn"
                        onClick={() => navigate(`/blog/${post.slug || post._id}`)}
                      >
                        Đọc tiếp <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="chinese-gradient rounded-[3rem] p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                Bắt đầu hành trình <br className="hidden md:block" /> chinh phục Hán ngữ ngay hôm nay!
              </h2>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                Tham gia cùng 10,000+ học viên và khám phá phương pháp học tiếng Trung hiệu quả nhất thế giới.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-gray-100 h-14 px-10 text-lg rounded-2xl font-black shadow-xl"
                  onClick={() => navigate('/register')}
                >
                  Đăng ký miễn phí
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white/30 text-white hover:bg-white/10 h-14 px-10 text-lg rounded-2xl font-black"
                  onClick={() => navigate('/login')}
                >
                  Đăng nhập
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}