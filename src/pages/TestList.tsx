import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { 
  Coins, 
  Star,
  Brain,
  Zap,
  Trophy,
  Crown,
  Sparkles,
  Rocket,
  Target,
  Award,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  Diamond,
  Flame,
  Gamepad2,
  Shield,
  Sword
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export const TestList = () => {
  const { user } = useAuth()
  const [userLevel, setUserLevel] = useState(1)

  useEffect(() => {
    fetchUserLevel()
  }, [])

  const fetchUserLevel = async () => {
    try {
      const response = await api.get('/users/profile')
      setUserLevel(response.data.user.level || 1)
    } catch (error) {
      console.error('Error fetching user level:', error)
    }
  }


  const handleStartTest = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để làm test')
      return
    }

    if (user.coins < 10000) {
      toast.error('Không đủ xu! Hãy học thêm từ vựng để nhận xu miễn phí!')
      return
    }

    // Navigate to new test system
    window.location.href = '/test/new'
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Header */}
          <div className="text-center mb-12">
            <div className="relative inline-block mb-6">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
                🧪 Bài Test
              </h1>
              <div className="absolute -top-4 -right-4">
                <Sparkles className="h-10 w-10 text-yellow-400 animate-bounce" />
              </div>
              <div className="absolute -bottom-2 -left-2">
                <Brain className="h-8 w-8 text-purple-400 animate-pulse" />
              </div>
              <div className="absolute top-2 -left-6">
                <Trophy className="h-6 w-6 text-orange-400 animate-ping" />
              </div>
            </div>
            
            <p className="text-xl text-gray-700 font-medium mb-8">
              Làm bài test theo cấp độ để kiểm tra kiến thức và nhận thưởng
            </p>
            
            {user && (
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                <div className="group relative">
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                      <Coins className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <span className="font-bold text-lg">Xu: {user.coins.toLocaleString()}</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Diamond className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-blue-600">Tiền tệ</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Zap className="h-5 w-5 text-yellow-500 animate-bounce" />
                  </div>
                </div>
                
                <div className="group relative">
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <span className="font-bold text-lg">Cấp: {userLevel}</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Award className="h-5 w-5 text-yellow-500 animate-pulse" />
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-8">
              <Button 
                onClick={handleStartTest}
                disabled={!user || user.coins < 10000}
                className={`text-2xl px-12 py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 ${
                  !user || user.coins < 10000
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  {!user ? (
                    <>
                      <Shield className="h-8 w-8" />
                      <span>Đăng nhập để làm test</span>
                    </>
                  ) : user.coins < 10000 ? (
                    <>
                      <Target className="h-8 w-8" />
                      <span>Không đủ xu (cần 10,000)</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="h-8 w-8 mr-2" />
                      <span>🚀 Bắt đầu Test</span>
                      <Sparkles className="h-6 w-6" />
                    </>
                  )}
                </div>
              </Button>
            </div>
          </div>

          {/* Enhanced Level Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Current Level Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-3xl shadow-xl border-2 border-blue-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-900">Cấp độ hiện tại: {userLevel}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  </div>
                </div>
              </div>
              <div className="bg-white/50 p-6 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-6 w-6 text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-blue-800 font-medium mb-2">
                      💡 Trả lời đúng hết tất cả câu hỏi ở cấp độ này để lên cấp!
                    </p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700">Tiến bộ liên tục</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Proficiency Test Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-8 rounded-3xl shadow-xl border-2 border-purple-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
                  <Sword className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-purple-900">Test năng lực</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <span className="text-sm text-orange-600">Thử thách cao</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/50 p-6 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Rocket className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-purple-800 font-medium mb-2">
                      🚀 Muốn nhảy cấp? Hãy làm Test năng lực!
                    </p>
                    <Link 
                      to="/proficiency" 
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      <Gamepad2 className="h-5 w-5" />
                      Bắt đầu thử thách
                      <Sparkles className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Rules & Rewards */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-100 p-8 rounded-3xl shadow-xl border-2 border-green-200 mb-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-3 bg-white/50 px-6 py-3 rounded-2xl mb-4">
                <Award className="h-6 w-6 text-green-500" />
                <span className="font-bold text-green-700 text-lg">Quy tắc & Phần thưởng</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-4 inline-block">
                  <Coins className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold text-blue-800 mb-2">Chi phí test</h4>
                <p className="text-blue-600 font-semibold text-lg">10,000 xu</p>
              </div>
              
              <div className="text-center">
                <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mb-4 inline-block">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold text-green-800 mb-2">Phần thưởng</h4>
                <p className="text-green-600 font-semibold text-lg">100 xu + 100 XP/câu đúng</p>
              </div>
              
              <div className="text-center">
                <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4 inline-block">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold text-purple-800 mb-2">Mục tiêu</h4>
                <p className="text-purple-600 font-semibold text-lg">Trả lời đúng tất cả câu hỏi</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
