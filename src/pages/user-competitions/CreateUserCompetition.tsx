import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import { Input } from '../../components/ui/input'
import { Slider } from '../../components/ui/slider'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { Coins, Clock, FileQuestion, CalendarClock, Trophy, Loader2 } from 'lucide-react'

export const CreateUserCompetition = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    numberOfQuestions: 10,
    timePerQuestion: 2,
    startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16) // Default 30 minutes from now
  })

  const totalTime = formData.numberOfQuestions * formData.timePerQuestion
  const cost = 10000

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tên cuộc thi')
      return
    }

    if (new Date(formData.startTime) <= new Date()) {
      toast.error('Thời gian bắt đầu phải sau thời điểm hiện tại')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/user-competitions/create', {
        title: formData.title,
        numberOfQuestions: formData.numberOfQuestions,
        timePerQuestion: formData.timePerQuestion,
        startTime: formData.startTime
      })
      
      toast.success('Tạo cuộc thi thành công!')
      navigate(`/user-competitions/${response.data.competition.id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="text-center space-y-4">
           <div className="w-16 h-16 chinese-gradient rounded-2xl flex items-center justify-center mx-auto shadow-lg rotate-3 mb-6">
              <Trophy className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-4xl font-black text-gray-900 tracking-tight">Khởi tạo <span className="text-primary">Đấu trường</span></h1>
           <p className="text-gray-500 font-medium">Thiết lập quy mô và thời gian cho cuộc tranh tài tri thức của riêng bạn.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           
           <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
              <div className="space-y-2">
                 <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Tên đấu trường</Label>
                 <Input
                   value={formData.title}
                   onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                   placeholder="Ví dụ: Đại chiến Hán ngữ HSK 5..."
                   className="h-14 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold text-lg"
                 />
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 flex justify-between">
                       <span>Số lượng câu hỏi</span>
                       <span className="text-primary font-black">{formData.numberOfQuestions} câu</span>
                    </Label>
                    <div className="px-2">
                       <Slider
                         min={5}
                         max={50}
                         step={5}
                         value={[formData.numberOfQuestions]}
                         onValueChange={(v) => setFormData({ ...formData, numberOfQuestions: v[0] })}
                       />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 flex justify-between">
                       <span>Thời gian mỗi câu</span>
                       <span className="text-primary font-black">{formData.timePerQuestion} Phút</span>
                    </Label>
                    <div className="px-2">
                       <Slider
                         min={0.5}
                         max={5}
                         step={0.5}
                         value={[formData.timePerQuestion]}
                         onValueChange={(v) => setFormData({ ...formData, timePerQuestion: v[0] })}
                       />
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                 <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Thời điểm khai cuộc</Label>
                 <Input
                   type="datetime-local"
                   value={formData.startTime}
                   onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                   className="h-14 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold"
                 />
              </div>

              <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 space-y-6">
                 <h4 className="text-sm font-black uppercase tracking-widest text-primary text-center">Tóm tắt đấu trường</h4>
                 <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                       <p className="text-xl font-black text-gray-900">{totalTime}p</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Tổng giờ</p>
                    </div>
                    <div className="text-center">
                       <p className="text-xl font-black text-gray-900">HSK {user?.level}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Trình độ</p>
                    </div>
                    <div className="text-center">
                       <p className="text-xl font-black text-amber-500">{cost.toLocaleString()}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Lệ phí Xu</p>
                    </div>
                 </div>
                 
                 <div className="pt-4 border-t border-primary/10">
                    <div className="flex justify-between items-center text-xs font-bold text-primary italic">
                       <span>Số dư hiện tại:</span>
                       <span>{user?.coins.toLocaleString()} Xu</span>
                    </div>
                 </div>
              </div>

              <Button
                type="submit"
                disabled={loading || (user !== null && user.coins < cost)}
                className="w-full h-16 rounded-2xl chinese-gradient text-white font-black text-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : `Khởi tạo đấu trường ngay`}
              </Button>
           </form>
        </div>
      </div>
    </div>
  )
}