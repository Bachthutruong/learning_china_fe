import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'
import { Settings } from 'lucide-react'

export const AdminSettings = () => {
  const [siteName, setSiteName] = useState('Chinese Learning')
  const [supportEmail, setSupportEmail] = useState('support@example.com')

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
           <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center text-white mr-4 shadow-lg">
              <Settings className="w-6 h-6" />
           </div>
           Cài đặt hệ thống
        </h1>
        <p className="text-gray-500 font-medium">Cấu hình các tham số vận hành và thông tin định danh của Jiudi Learning.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-xl space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               
               <div className="relative z-10 space-y-6">
                  <h3 className="text-xl font-black text-gray-900 border-b border-gray-50 pb-4">Cấu hình định danh</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Tên nền tảng</Label>
                        <Input 
                          value={siteName} 
                          onChange={(e) => setSiteName(e.target.value)} 
                          className="h-12 rounded-xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email hỗ trợ khách hàng</Label>
                        <Input 
                          value={supportEmail} 
                          onChange={(e) => setSupportEmail(e.target.value)} 
                          className="h-12 rounded-xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold"
                        />
                     </div>
                  </div>

                  <div className="pt-6">
                     <Button className="chinese-gradient h-12 px-10 rounded-xl font-black text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all">
                        Lưu thay đổi cấu hình
                     </Button>
                  </div>
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
               <div className="absolute inset-0 chinese-gradient opacity-10" />
               <div className="relative z-10 space-y-4">
                  <h4 className="text-lg font-black flex items-center">
                     <div className="w-2 h-5 bg-primary rounded-full mr-3" />
                     Phiên bản hiện tại
                  </h4>
                  <p className="text-3xl font-black tracking-tighter">v3.5.2-stable</p>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">Hệ thống đang hoạt động ổn định trên hạ tầng Cloud. Các bản cập nhật bảo mật được áp dụng tự động.</p>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-4">
               <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Trạng thái dịch vụ</h4>
               <div className="space-y-3">
                  {[
                    { label: 'API Gateway', status: 'Online', color: 'bg-green-500' },
                    { label: 'Database Cluster', status: 'Online', color: 'bg-green-500' },
                    { label: 'Storage Service', status: 'Online', color: 'bg-green-500' }
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                       <span className="text-xs font-bold text-gray-600">{s.label}</span>
                       <div className="flex items-center space-x-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${s.color} animate-pulse`} />
                          <span className="text-[10px] font-black uppercase text-gray-400">{s.status}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}


