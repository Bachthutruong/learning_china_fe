import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { 
  MessageCircle, 
  Send, 
  Star,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  CheckCircle,
  Heart
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const feedbackTypes = [
  {
    id: 'bug',
    title: 'Báo cáo lỗi',
    description: 'Phát hiện lỗi trong ứng dụng',
    icon: '🐛',
    color: 'from-red-500 to-pink-500'
  },
  {
    id: 'feature',
    title: 'Đề xuất tính năng',
    description: 'Gợi ý tính năng mới',
    icon: '💡',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'improvement',
    title: 'Cải thiện',
    description: 'Đề xuất cải thiện tính năng hiện có',
    icon: '⚡',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'content',
    title: 'Nội dung',
    description: 'Phản hồi về nội dung học tập',
    icon: '📚',
    color: 'from-purple-500 to-pink-500'
  }
]

const ratingLabels = [
  'Rất không hài lòng',
  'Không hài lòng',
  'Bình thường',
  'Hài lòng',
  'Rất hài lòng'
]

export const Feedback = () => {
  const [formData, setFormData] = useState({
    type: '',
    rating: 0,
    title: '',
    description: '',
    email: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Cảm ơn bạn đã gửi phản hồi! Chúng tôi sẽ xem xét và cải thiện dựa trên ý kiến của bạn.')
      setFormData({
        type: '',
        rating: 0,
        title: '',
        description: '',
        email: ''
      })
    } catch (error) {
      toast.error('Có lỗi xảy ra khi gửi phản hồi. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const renderStars = () => {
    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleInputChange('rating', star)}
            className={`p-1 transition-colors ${
              star <= formData.rating
                ? 'text-yellow-400'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          >
            <Star className="h-6 w-6 fill-current" />
          </button>
        ))}
        {formData.rating > 0 && (
          <span className="text-sm text-gray-600 ml-2">
            {ratingLabels[formData.rating - 1]}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Góp ý & Phản hồi</h1>
          <p className="text-gray-600">Chúng tôi rất trân trọng ý kiến của bạn để cải thiện dịch vụ</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Chia sẻ ý kiến của bạn
            </CardTitle>
            <CardDescription>
              Phản hồi của bạn giúp chúng tôi cải thiện trải nghiệm học tập
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Loại phản hồi *
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  {feedbackTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        formData.type === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('type', type.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-r ${type.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                          {type.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{type.title}</h4>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Đánh giá tổng thể *
                </label>
                {renderStars()}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Tóm tắt ngắn gọn về phản hồi của bạn"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả chi tiết *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Mô tả chi tiết về vấn đề, đề xuất hoặc phản hồi của bạn..."
                  rows={6}
                  required
                />
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (tùy chọn)
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Để chúng tôi có thể liên hệ lại nếu cần"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Chúng tôi có thể liên hệ lại để làm rõ thêm thông tin
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isSubmitting || !formData.type || !formData.rating || !formData.title || !formData.description}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Gửi phản hồi
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Thank You Message */}
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Cảm ơn bạn đã góp ý!</h3>
                <p className="text-sm text-gray-600">
                  Mỗi phản hồi của bạn đều có giá trị và giúp chúng tôi cải thiện dịch vụ tốt hơn.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


