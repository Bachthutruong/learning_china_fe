import { Badge } from '../components/ui/badge'
import { 
  Shield, 
  Eye, 
  Lock, 
  User, 
  Database,
  Mail,
  Phone
} from 'lucide-react'

const privacySections = [
  { id: 'collection', title: 'Thu thập thông tin', icon: Database, color: 'from-blue-500 to-cyan-500', content: ['Chúng tôi thu thập email và dữ liệu học tập khi bạn đăng ký.', 'Thông tin giúp cải thiện lộ trình học tập cá nhân.'] },
  { id: 'security', title: 'Bảo mật dữ liệu', icon: Lock, color: 'from-orange-500 to-red-500', content: ['Sử dụng mã hóa SSL để bảo vệ dữ liệu.', 'Lưu trữ trên máy chủ an toàn và bảo mật cao.'] }
]

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
           <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6"><Shield className="w-8 h-8 text-primary" /></div>
           <h1 className="text-4xl font-black text-gray-900">Chính sách <span className="text-primary">Bảo mật</span></h1>
           <p className="text-gray-500 font-medium">Jiudi Learning cam kết bảo vệ thông tin cá nhân của bạn.</p>
           <div className="pt-4 flex justify-center gap-2"><Badge variant="outline" className="rounded-xl font-bold text-gray-400 px-4">Cập nhật: 2026</Badge></div>
        </div>

        <div className="grid gap-6">{privacySections.map((s) => (
          <div key={s.id} className="bg-white rounded-[2.5rem] p-8 border shadow-sm group">
             <div className="flex items-center space-x-4 mb-6"><div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg`}><s.icon className="w-6 h-6" /></div><h3 className="text-xl font-black">{s.title}</h3></div>
             <div className="space-y-4">{s.content.map((item, i) => <div key={i} className="flex items-start space-x-3 p-4 rounded-2xl bg-gray-50/50 border"><div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" /><p className="text-sm text-gray-600 font-medium">{item}</p></div>)}</div>
          </div>
        ))}</div>

        <div className="bg-white rounded-[2.5rem] p-8 border shadow-xl flex flex-wrap justify-center gap-8">
           <div className="flex items-center gap-3"><Mail className="text-primary" /> <span className="font-bold">privacy@jiudilearning.com</span></div>
           <div className="flex items-center gap-3"><Phone className="text-primary" /> <span className="font-bold">+84 123 456 789</span></div>
        </div>
      </div>
    </div>
  )
}