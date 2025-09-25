import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { CheckCircle, BookOpen, Target, BrainCircuit, Sparkles, Trophy, Users } from 'lucide-react'

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

export const Home = () => {
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
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Bắt đầu miễn phí
                </Button>
                <Button size="lg" variant="outline" className="border-2">
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
            {features.map((feature, index) => {
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


