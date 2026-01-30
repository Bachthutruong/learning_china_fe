import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { 
  FileText, 
  User, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  // Calendar
} from 'lucide-react'

const termsSections = [
  {
    id: 'acceptance',
    title: 'Chấp nhận điều khoản',
    icon: CheckCircle,
    color: 'from-green-500 to-emerald-500',
    content: [
      'Bằng việc sử dụng dịch vụ Chinese Learning, bạn đồng ý tuân thủ các điều khoản này.',
      'Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng không sử dụng dịch vụ.',
      'Chúng tôi có quyền cập nhật các điều khoản này bất kỳ lúc nào.'
    ]
  },
  {
    id: 'user-account',
    title: 'Tài khoản người dùng',
    icon: User,
    color: 'from-blue-500 to-cyan-500',
    content: [
      'Bạn phải cung cấp thông tin chính xác và cập nhật khi đăng ký tài khoản.',
      'Bạn chịu trách nhiệm bảo mật mật khẩu và tài khoản của mình.',
      'Một người chỉ được tạo một tài khoản duy nhất.',
      'Chúng tôi có quyền tạm khóa hoặc xóa tài khoản vi phạm.'
    ]
  },
  {
    id: 'acceptable-use',
    title: 'Sử dụng hợp lệ',
    icon: Shield,
    color: 'from-purple-500 to-pink-500',
    content: [
      'Sử dụng dịch vụ chỉ cho mục đích học tập cá nhân.',
      'Không được sử dụng để vi phạm pháp luật hoặc quyền của người khác.',
      'Không được cố gắng hack, phá hoại hoặc can thiệp vào hệ thống.',
      'Không được chia sẻ tài khoản với người khác.'
    ]
  },
  {
    id: 'prohibited-activities',
    title: 'Hoạt động bị cấm',
    icon: XCircle,
    color: 'from-red-500 to-pink-500',
    content: [
      'Sử dụng bot, script hoặc công cụ tự động khác.',
      'Cố gắng reverse engineer hoặc sao chép dịch vụ.',
      'Phát tán virus, malware hoặc mã độc hại.',
      'Thu thập thông tin của người dùng khác.',
      'Sử dụng dịch vụ cho mục đích thương mại không được phép.'
    ]
  }
]

const userRights = [
  {
    title: 'Quyền truy cập',
    description: 'Truy cập vào tất cả tính năng miễn phí của dịch vụ',
    icon: CheckCircle
  },
  {
    title: 'Quyền học tập',
    description: 'Học từ vựng, làm bài test và sử dụng tài liệu',
    icon: CheckCircle
  },
  {
    title: 'Quyền hỗ trợ',
    description: 'Nhận hỗ trợ kỹ thuật và tư vấn học tập',
    icon: CheckCircle
  }
]

const userObligations = [
  {
    title: 'Tuân thủ pháp luật',
    description: 'Sử dụng dịch vụ theo đúng quy định pháp luật',
    icon: Shield
  },
  {
    title: 'Bảo mật thông tin',
    description: 'Bảo vệ thông tin tài khoản và không chia sẻ với người khác',
    icon: Shield
  },
  {
    title: 'Sử dụng đúng mục đích',
    description: 'Chỉ sử dụng cho mục đích học tập cá nhân',
    icon: Shield
  }
]

export const TermsOfUse = () => {
    return (
      <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header Section */}
          <div className="text-center space-y-4">
             <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-primary" />
             </div>
             <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Điều khoản <span className="text-primary">Sử dụng</span></h1>
             <p className="text-gray-500 font-medium">Quy định và thỏa thuận giữa người dùng và nền tảng học tập Jiudi Learning.</p>
             <div className="pt-4 flex justify-center gap-2">
                <Badge variant="outline" className="rounded-xl border-gray-200 font-bold text-gray-400 px-4 py-1">Cập nhật: {new Date().toLocaleDateString('vi-VN')}</Badge>
                <Badge className="bg-primary text-white rounded-xl font-black px-4 py-1">v1.4.0</Badge>
             </div>
          </div>
  
          {/* Important Notice */}
          <div className="bg-amber-50 rounded-[2.5rem] p-8 md:p-10 border-2 border-amber-100 shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-48 h-48 bg-amber-200 opacity-10 rounded-bl-[4rem]" />
             <div className="relative z-10 flex items-start space-x-6">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                   <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-amber-900">Lưu ý quan trọng</h3>
                   <p className="text-sm text-amber-800/80 font-medium leading-relaxed">
                      Bằng việc truy cập và sử dụng bất kỳ tính năng nào của Jiudi Learning, bạn mặc định đồng ý với toàn bộ các điều khoản được liệt kê dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ ngay lập tức.
                   </p>
                </div>
             </div>
          </div>
  
          {/* Terms Sections */}
          <div className="grid gap-6">
            {termsSections.map((section) => (
              <div key={section.id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                 <div className="flex items-center space-x-4 mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${section.color} flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-6`}>
                       <section.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">{section.title}</h3>
                 </div>
                 <div className="space-y-4">
                    {section.content.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 rounded-2xl bg-gray-50/50 border border-gray-50 group-hover:bg-white transition-colors">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                         <p className="text-sm text-gray-600 font-medium leading-relaxed">{item}</p>
                      </div>
                    ))}
                 </div>
              </div>
            ))}
          </div>
  
          {/* Rights & Obligations Grid */}
          <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-6">
                <h3 className="text-xl font-black text-green-600 flex items-center">
                   <CheckCircle className="w-5 h-5 mr-2" /> Quyền lợi học viên
                </h3>
                <div className="space-y-4">
                   {userRights.map((r, i) => (
                     <div key={i} className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                           <r.icon className="w-4 h-4" />
                        </div>
                        <div>
                           <p className="text-sm font-black text-gray-900 leading-tight">{r.title}</p>
                           <p className="text-xs text-gray-500 font-medium mt-1">{r.description}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
  
             <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-6">
                <h3 className="text-xl font-black text-blue-600 flex items-center">
                   <Shield className="w-5 h-5 mr-2" /> Nghĩa vụ tuân thủ
                </h3>
                <div className="space-y-4">
                   {userObligations.map((o, i) => (
                     <div key={i} className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                           <o.icon className="w-4 h-4" />
                        </div>
                        <div>
                           <p className="text-sm font-black text-gray-900 leading-tight">{o.title}</p>
                           <p className="text-xs text-gray-500 font-medium mt-1">{o.description}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
  
          {/* Contact Support Section */}
          <div className="bg-gray-900 rounded-[3rem] p-10 md:p-12 text-white text-center relative overflow-hidden group">
             <div className="absolute inset-0 chinese-gradient opacity-10" />
             <div className="relative z-10 space-y-8">
                <div className="space-y-2">
                   <h3 className="text-2xl font-black">Bạn cần làm rõ điều khoản?</h3>
                   <p className="text-gray-400 font-medium">Vui lòng liên hệ với bộ phận CSKH để được giải đáp chi tiết.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                   <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-gray-300">support@jiudilearning.com</span>
                   </div>
                   <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-gray-300">+84 987 654 321</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    )
}