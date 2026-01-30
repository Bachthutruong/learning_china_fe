import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  MessageCircle,
  Send,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

const contactInfo = [
  {
    title: 'Email hỗ trợ',
    value: 'support@chineselearning.com',
    description: 'Phản hồi trong vòng 24 giờ',
    icon: Mail,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Hotline',
    value: '+84 123 456 789',
    description: 'Thứ 2 - Thứ 6: 8:00 - 18:00',
    icon: Phone,
    color: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Địa chỉ',
    value: 'Hà Nội, Việt Nam',
    description: 'Văn phòng chính',
    icon: MapPin,
    color: 'from-purple-500 to-pink-500'
  }
]

const contactReasons = [
  'Hỗ trợ kỹ thuật',
  'Câu hỏi về tài khoản',
  'Báo cáo lỗi',
  'Đề xuất tính năng',
  'Hợp tác',
  'Khác'
]

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Tin nhắn đã được gửi thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.')
      setFormData({
        name: '',
        email: '',
        reason: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      toast.error('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
           <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span className="text-primary text-xs font-bold uppercase tracking-widest">Liên kết với chúng tôi</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Luôn lắng nghe <span className="text-primary">Mọi phản hồi</span></h1>
           <p className="text-gray-500 font-medium">Bạn có thắc mắc về lộ trình hay cần hỗ trợ kỹ thuật? Đừng ngần ngại kết nối với đội ngũ Jiudi.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
           {/* Contact Info Cards */}
           <div className="space-y-6">
              {contactInfo.map((info, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                   <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center text-white shadow-lg mb-6 group-hover:rotate-6 transition-transform`}>
                      <info.icon className="w-7 h-7" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900 mb-1">{info.title}</h3>
                   <p className="text-sm font-black text-primary mb-3 break-all">{info.value}</p>
                   <p className="text-xs text-gray-400 font-medium">{info.description}</p>
                </div>
              ))}
              
              <div className="bg-primary p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-primary/20 group">
                 <div className="absolute inset-0 chinese-gradient opacity-90" />
                 <div className="relative z-10 space-y-4">
                    <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest opacity-60">
                       <Clock className="w-3 h-3" />
                       <span>Làm việc</span>
                    </div>
                    <h4 className="text-2xl font-black">Giờ hành chính</h4>
                    <div className="space-y-2 text-sm font-medium text-white/80">
                       <div className="flex justify-between"><span>Thứ 2 - Thứ 6:</span><span>08:00 - 18:00</span></div>
                       <div className="flex justify-between"><span>Thứ 7:</span><span>09:00 - 17:00</span></div>
                       <div className="flex justify-between opacity-50 italic"><span>Chủ nhật:</span><span>Nghỉ</span></div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Contact Form */}
           <div className="lg:col-span-2 bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                 <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center">
                    <Send className="w-6 h-6 mr-3 text-primary" />
                    Gửi yêu cầu trực tuyến
                 </h3>

                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Danh tính của bạn</Label>
                          <Input
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Nguyễn Văn A..."
                            className="h-12 rounded-xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold"
                            required
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Địa chỉ Email</Label>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="name@email.com..."
                            className="h-12 rounded-xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold"
                            required
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Lý do liên hệ</Label>
                       <select
                         value={formData.reason}
                         onChange={(e) => handleInputChange('reason', e.target.value)}
                         className="w-full h-12 px-4 bg-gray-50/50 border-2 border-gray-50 rounded-xl font-bold text-sm text-gray-700 focus:bg-white focus:border-primary focus:ring-0 transition-all outline-none"
                         required
                       >
                         <option value="">Chọn một mục lục...</option>
                         {contactReasons.map((r) => <option key={r} value={r}>{r}</option>)}
                       </select>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Chủ đề cần hỗ trợ</Label>
                       <Input
                         value={formData.subject}
                         onChange={(e) => handleInputChange('subject', e.target.value)}
                         placeholder="Tóm tắt vấn đề của bạn..."
                         className="h-12 rounded-xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold"
                         required
                       />
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nội dung chi tiết</Label>
                       <Textarea
                         value={formData.message}
                         onChange={(e) => handleInputChange('message', e.target.value)}
                         placeholder="Hãy mô tả chi tiết vấn đề bạn đang gặp phải..."
                         className="min-h-[180px] rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-medium leading-relaxed"
                         required
                       />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-16 rounded-2xl chinese-gradient text-white font-black text-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all"
                    >
                       {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Gửi yêu cầu hỗ trợ'}
                    </Button>
                 </form>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}