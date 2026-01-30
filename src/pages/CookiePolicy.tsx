import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  Cookie, 
  Settings, 
  Shield, 
  Eye,
  Database,
  CheckCircle,
  Mail
} from 'lucide-react'

const cookieTypes = [
  { id: 'essential', title: 'Cookies cần thiết', description: 'Cần thiết cho hoạt động của website', icon: Shield, color: 'from-green-500 to-emerald-500', required: true, examples: ['Xác thực người dùng', 'Bảo mật phiên đăng nhập'] },
  { id: 'analytics', title: 'Cookies phân tích', description: 'Giúp chúng tôi hiểu cách bạn sử dụng website', icon: Database, color: 'from-blue-500 to-cyan-500', required: false, examples: ['Theo dõi lượt truy cập', 'Phân tích hành vi'] }
]

export const CookiePolicy = () => {
  const [cookieSettings, setCookieSettings] = useState({ essential: true, analytics: false })

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4"><div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6"><Cookie className="w-8 h-8 text-primary" /></div><h1 className="text-4xl font-black text-gray-900">Chính sách <span className="text-primary">Cookies</span></h1></div>

        <div className="grid md:grid-cols-2 gap-6">{cookieTypes.map((type) => (
          <div key={type.id} className="bg-white rounded-[2.5rem] p-8 border shadow-sm group">
             <div className="flex items-center space-x-4 mb-6"><div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center text-white shadow-lg`}><type.icon className="w-6 h-6" /></div><div><h3 className="text-lg font-black">{type.title}</h3>{type.required && <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase h-4 px-1.5 mt-1">Bắt buộc</Badge>}</div></div>
             <div className="space-y-3">{type.examples.map((ex, i) => <div key={i} className="flex items-center space-x-3 text-sm text-gray-500 font-medium"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /><span>{ex}</span></div>)}</div>
          </div>
        ))}</div>

        <div className="bg-white rounded-[3rem] p-8 md:p-12 border shadow-2xl space-y-10">
           <div className="space-y-4 max-w-2xl mx-auto">{cookieTypes.map((type) => (
             <div key={type.id} className="flex items-center justify-between p-6 rounded-3xl bg-gray-50/50 border hover:bg-white transition-all">
                <div className="flex items-center space-x-4"><div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center text-white`}><type.icon className="w-5 h-5" /></div><span className="font-bold text-gray-700">{type.title}</span></div>
                {type.required ? <Badge variant="outline" className="text-[9px] uppercase tracking-widest text-gray-400">Hệ thống</Badge> : <button onClick={() => setCookieSettings(prev => ({ ...prev, [type.id]: !prev[type.id as keyof typeof cookieSettings] }))} className={`w-12 h-6 rounded-full relative transition-all ${cookieSettings[type.id as keyof typeof cookieSettings] ? 'bg-primary' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${cookieSettings[type.id as keyof typeof cookieSettings] ? 'left-7' : 'left-1'}`} /></button>}
             </div>
           ))}</div>
           <div className="flex justify-center gap-4"><Button onClick={() => alert('Đã lưu!')} className="chinese-gradient text-white font-black px-8">Lưu cài đặt</Button></div>
        </div>

        <div className="bg-gray-900 rounded-[3rem] p-10 text-white text-center relative overflow-hidden group"><div className="relative z-10 space-y-4"><h3>Thắc mắc về quyền riêng tư?</h3><div className="flex justify-center"><div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex items-center space-x-3"><Mail className="w-4 h-4 text-primary" /><span className="text-xs font-bold text-gray-300">privacy@jiudilearning.com</span></div></div></div></div>
      </div>
    </div>
  )
}