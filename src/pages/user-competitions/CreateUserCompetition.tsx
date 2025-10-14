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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Tạo Cuộc Thi Mới
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Tạo cuộc thi riêng để thi đấu với bạn bè
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-3">
              <Label htmlFor="title" className="text-base font-semibold text-gray-700">
                Tên cuộc thi
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ví dụ: Thi đấu HSK 4"
                maxLength={100}
                className="h-12 text-lg border-2 border-gray-200 focus:border-purple-500 rounded-xl"
              />
            </div>

            {/* Number of questions */}
            <div className="space-y-4">
              <Label htmlFor="questions" className="text-base font-semibold text-gray-700">
                Số lượng câu hỏi: <span className="text-purple-600 font-bold">{formData.numberOfQuestions}</span>
              </Label>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl">
                <Slider
                  id="questions"
                  min={1}
                  max={20}
                  step={1}
                  value={[formData.numberOfQuestions]}
                  onValueChange={(value: number[]) => setFormData({ ...formData, numberOfQuestions: value[0] })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span className="font-medium">1 câu</span>
                  <span className="font-medium">20 câu</span>
                </div>
              </div>
            </div>

            {/* Time per question */}
            <div className="space-y-4">
              <Label htmlFor="time" className="text-base font-semibold text-gray-700">
                Thời gian mỗi câu: <span className="text-blue-600 font-bold">{formData.timePerQuestion} phút</span>
              </Label>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                <Slider
                  id="time"
                  min={0.5}
                  max={3}
                  step={0.5}
                  value={[formData.timePerQuestion]}
                  onValueChange={(value: number[]) => setFormData({ ...formData, timePerQuestion: value[0] })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span className="font-medium">0.5 phút</span>
                  <span className="font-medium">3 phút</span>
                </div>
              </div>
            </div>

            {/* Start time */}
            <div className="space-y-3">
              <Label htmlFor="startTime" className="text-base font-semibold text-gray-700">
                Thời gian bắt đầu
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
                className="h-12 text-lg border-2 border-gray-200 focus:border-indigo-500 rounded-xl"
              />
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 p-6 rounded-2xl border border-purple-200 space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-purple-600" />
                Thông tin cuộc thi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <FileQuestion className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cấp độ</p>
                    <p className="font-semibold text-gray-800">HSK {user?.level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng thời gian</p>
                    <p className="font-semibold text-gray-800">{totalTime} phút</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl md:col-span-2">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <CalendarClock className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kết thúc</p>
                    <p className="font-semibold text-gray-800">{new Date(new Date(formData.startTime).getTime() + totalTime * 60 * 1000).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl border border-orange-200">
                <Coins className="w-6 h-6 text-orange-600" />
                <span className="text-lg font-bold text-orange-700">Chi phí: {cost.toLocaleString()} Xu</span>
              </div>
            </div>

            {/* Current balance */}
            {user && (
              <div className={`p-4 rounded-xl border-2 ${user.coins < cost ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className={`w-5 h-5 ${user.coins < cost ? 'text-red-600' : 'text-green-600'}`} />
                    <span className="text-sm text-gray-600">Số dư hiện tại:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${user.coins < cost ? 'text-red-600' : 'text-green-600'}`}>
                      {user.coins.toLocaleString()} Xu
                    </span>
                    {user.coins < cost && (
                      <span className="text-red-600 text-sm font-medium">(Không đủ xu)</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit button */}
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={loading || (user !== null && user.coins < cost)}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang tạo cuộc thi...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Tạo cuộc thi ({cost.toLocaleString()} Xu)
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
