import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import {
  Coins,
  Star,
  Brain,
  Zap,
  Crown,
  Calendar,
  BarChart3,
  TestTube,
  Gem
} from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

interface TestStatistics {
  userId: string
  userName: string
  userEmail: string
  userLevel: number
  totalTests: number
  totalQuestions: number
  totalCorrect: number
  totalWrong: number
  totalCoinsEarned: number
  totalExperienceEarned: number
  averageScore: number
  lastTestDate: string
}

interface StatisticsResponse {
  year: number
  month: number
  monthName: string
  totalUsers: number
  totalTests: number
  statistics: TestStatistics[]
}

export const TestList = () => {
  const { user } = useAuth()
  const [userLevel, setUserLevel] = useState(1)
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    fetchUserLevel()
    fetchStatistics()
  }, [selectedYear, selectedMonth])

  const fetchUserLevel = async () => {
    try {
      const response = await api.get('/users/profile')
      setUserLevel(response.data.user.level || 1)
    } catch (error) {
      console.error('Error fetching user level:', error)
    }
  }

  const fetchStatistics = async () => {
    setLoading(true)
    try {
      const response = await api.get('/tests/statistics/month', {
        params: {
          year: selectedYear,
          month: selectedMonth
        }
      })
      setStatistics(response.data)
    } catch (error: any) {
      console.error('Error fetching statistics:', error)
      if (error.response?.status !== 404) {
        toast.error('Không thể tải thống kê')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleThisMonth = () => {
    const now = new Date()
    setSelectedYear(now.getFullYear())
    setSelectedMonth(now.getMonth() + 1)
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value)
    setSelectedYear(date.getFullYear())
    setSelectedMonth(date.getMonth() + 1)
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
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
           <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              <TestTube className="w-4 h-4 text-primary" />
              <span className="text-primary text-xs font-bold uppercase tracking-widest">Hệ thống khảo thí</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Luyện tập & <span className="text-primary">Kiểm tra</span>
           </h1>
           <p className="text-gray-500 font-medium">
              Hệ thống bài test thông minh tự động điều chỉnh theo trình độ của bạn, giúp tối ưu hóa việc ghi nhớ.
           </p>
        </div>

        {/* User Stats Summary */}
        <div className="grid md:grid-cols-2 gap-8">
           <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 chinese-gradient opacity-5 rounded-bl-[4rem]" />
              <div className="relative z-10 flex items-center space-x-6">
                 <div className="w-20 h-20 chinese-gradient rounded-[2rem] flex items-center justify-center shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                    <Crown className="w-10 h-10 text-white" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Trình độ hiện tại</p>
                    <h3 className="text-3xl font-black text-gray-900">Cấp độ {userLevel}</h3>
                    <div className="flex items-center space-x-1 text-amber-500">
                       <Star className="w-4 h-4 fill-current" />
                       <Star className="w-4 h-4 fill-current" />
                       <Star className="w-4 h-4 fill-current" />
                       <span className="text-xs font-bold ml-2 text-gray-400">Đạt 85% tiến độ</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 opacity-5 rounded-bl-[4rem]" />
              <div className="relative z-10 flex items-center space-x-6">
                 <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center shadow-sm group-hover:rotate-3 transition-transform">
                    <Coins className="w-10 h-10 text-amber-500 fill-current" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ngân sách học tập</p>
                    <h3 className="text-3xl font-black text-gray-900">{user?.coins.toLocaleString()} Xu</h3>
                    <p className="text-xs font-bold text-gray-400 italic">Cần 10,000 Xu cho mỗi lượt Test</p>
                 </div>
              </div>
           </div>
        </div>

        {/* CTA and Logic Cards */}
        <div className="grid lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 space-y-8 flex flex-col items-center text-center">
                 <div className="space-y-4">
                    <h2 className="text-3xl font-black text-gray-900">Sẵn sàng vượt cấp?</h2>
                    <p className="text-gray-500 font-medium max-w-md">Bài test tổng hợp bao gồm đầy đủ các kỹ năng: Nhận diện mặt chữ, Phiên âm, Ngữ pháp và Đọc hiểu.</p>
                 </div>

                 <Button 
                   onClick={handleStartTest}
                   disabled={!user || user.coins < 10000}
                   className={`h-16 px-12 rounded-2xl font-black text-xl shadow-2xl transition-all transform hover:-translate-y-1 ${
                     !user || user.coins < 10000
                       ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                       : 'chinese-gradient text-white shadow-primary/20 hover:shadow-primary/30'
                   }`}
                 >
                   {user && user.coins < 10000 ? 'Không đủ số dư' : 'Bắt đầu bài Test ngay'}
                 </Button>

                 <div className="flex items-center space-x-8 pt-4">
                    <div className="text-center">
                       <p className="text-xl font-black text-gray-900">20</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Câu hỏi</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100" />
                    <div className="text-center">
                       <p className="text-xl font-black text-gray-900">30</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Phút làm</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100" />
                    <div className="text-center">
                       <p className="text-xl font-black text-green-600">+2000</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">XP Thưởng</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-primary rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl shadow-primary/20 group">
              <div className="absolute inset-0 chinese-gradient opacity-90" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                 <div className="space-y-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                       <Brain className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-black leading-tight">Test Năng lực AI</h3>
                    <p className="text-white/70 text-sm font-medium leading-relaxed">Muốn bỏ qua các bài học căn bản? Hãy thực hiện bài test năng lực để nhảy thẳng tới trình độ hiện tại của bạn.</p>
                 </div>
                 
                 <Link to="/proficiency">
                    <Button className="w-full h-14 bg-white text-primary hover:bg-gray-100 rounded-xl font-black shadow-lg transform group-hover:-translate-y-1 transition-all">
                       Thử thách ngay
                    </Button>
                 </Link>
              </div>
           </div>
        </div>

        {/* Statistics Section */}
        <div className="space-y-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                 <h2 className="text-2xl font-black text-gray-900 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-2 text-primary" />
                    Bảng xếp hạng tháng
                 </h2>
                 <p className="text-gray-500 font-medium">Top học viên có thành tích xuất sắc nhất trong kỳ thi.</p>
              </div>
              
              <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                 <Calendar className="w-4 h-4 text-gray-400 ml-2" />
                 <input
                   type="month"
                   value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
                   onChange={handleMonthChange}
                   className="text-xs font-black uppercase tracking-widest text-gray-600 bg-transparent border-none focus:ring-0 cursor-pointer"
                 />
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Thứ hạng</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Học viên</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Số bài Test</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Độ chính xác</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Phần thưởng</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {loading ? (
                         [1, 2, 3].map(i => (
                           <tr key={i} className="animate-pulse">
                              <td colSpan={5} className="px-8 py-6 h-16 bg-gray-50/20" />
                           </tr>
                         ))
                       ) : statistics && statistics.statistics.length > 0 ? (
                         statistics.statistics.map((stat, idx) => (
                           <tr key={stat.userId} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="px-8 py-6">
                                 <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                                   idx === 0 ? 'bg-yellow-400 text-white shadow-lg' :
                                   idx === 1 ? 'bg-gray-300 text-white shadow-lg' :
                                   idx === 2 ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400'
                                 }`}>
                                    {idx + 1}
                                 </span>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl chinese-gradient flex items-center justify-center text-white font-black">
                                       {stat.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-gray-900">{stat.userName}</p>
                                       <Badge className="bg-primary/5 text-primary text-[9px] uppercase font-black border-none h-4 px-1.5">Lv.{stat.userLevel}</Badge>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <span className="text-sm font-black text-gray-900">{stat.totalTests}</span>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <div className="flex flex-col items-center space-y-1">
                                    <span className={`text-sm font-black ${stat.averageScore >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
                                       {stat.averageScore}%
                                    </span>
                                    <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                       <div className={`h-full ${stat.averageScore >= 80 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${stat.averageScore}%` }} />
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <div className="space-y-0.5">
                                    <p className="text-sm font-black text-amber-500 flex items-center justify-end">
                                       <Gem className="w-3 h-3 mr-1" /> {stat.totalCoinsEarned.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] font-bold text-primary flex items-center justify-end">
                                       <Zap className="w-3 h-3 mr-1 fill-current" /> {stat.totalExperienceEarned.toLocaleString()} XP
                                    </p>
                                 </div>
                              </td>
                           </tr>
                         ))
                       ) : (
                         <tr>
                            <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-bold italic">Chưa có dữ liệu thống kê cho tháng này.</td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
