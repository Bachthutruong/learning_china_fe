import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { BarChart3, Users, TrendingUp, BookOpen } from 'lucide-react'
import { Coins, TestTube } from 'lucide-react'

export const AdminAnalytics = () => {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
             <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center text-white mr-4 shadow-lg">
                <BarChart3 className="w-6 h-6" />
             </div>
             Trung tâm dữ liệu
          </h1>
          <p className="text-gray-500 font-medium">Phân tích chuyên sâu về tương tác người dùng và hiệu quả học tập.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
           <Button variant="ghost" size="sm" className="rounded-lg font-black text-[10px] uppercase h-9 px-4">7 Ngày</Button>
           <Button variant="default" size="sm" className="rounded-lg font-black text-[10px] uppercase h-9 px-4 chinese-gradient text-white shadow-md">30 Ngày</Button>
           <Button variant="ghost" size="sm" className="rounded-lg font-black text-[10px] uppercase h-9 px-4">Toàn thời gian</Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Học viên mới', val: '+1,250', trend: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
           { label: 'Doanh thu Xu', val: '4.2M', trend: '+8.5%', icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50' },
           { label: 'Bài thi hoàn tất', val: '18,402', trend: '+24%', icon: TestTube, color: 'text-green-600', bg: 'bg-green-50' },
           { label: 'Từ vựng đã học', val: '156K', trend: '+5%', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-4">
                 <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:rotate-6`}>
                    <stat.icon className="w-6 h-6" />
                 </div>
                 <Badge className="bg-green-50 text-green-600 border-none font-black text-[8px]">{stat.trend}</Badge>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900">{stat.val}</p>
           </div>
         ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl space-y-8 relative overflow-hidden h-[450px] flex flex-col items-center justify-center text-center">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                  <TrendingUp className="w-10 h-10" />
               </div>
               <div className="space-y-2 relative z-10">
                  <h3 className="text-2xl font-black text-gray-900">Biểu đồ tăng trưởng</h3>
                  <p className="text-gray-500 font-medium max-w-xs">Hệ thống đang đồng bộ dữ liệu thời gian thực từ Database Cluster.</p>
               </div>
               <div className="flex gap-2 relative z-10">
                  <div className="w-3 h-24 bg-gray-100 rounded-full flex items-end"><div className="w-full h-[40%] chinese-gradient rounded-full animate-in slide-in-from-bottom duration-1000" /></div>
                  <div className="w-3 h-24 bg-gray-100 rounded-full flex items-end"><div className="w-full h-[65%] chinese-gradient rounded-full animate-in slide-in-from-bottom duration-1000 delay-100" /></div>
                  <div className="w-3 h-24 bg-gray-100 rounded-full flex items-end"><div className="w-full h-[55%] chinese-gradient rounded-full animate-in slide-in-from-bottom duration-1000 delay-200" /></div>
                  <div className="w-3 h-24 bg-gray-100 rounded-full flex items-end"><div className="w-full h-[85%] chinese-gradient rounded-full animate-in slide-in-from-bottom duration-1000 delay-300" /></div>
                  <div className="w-3 h-24 bg-gray-100 rounded-full flex items-end"><div className="w-full h-[45%] chinese-gradient rounded-full animate-in slide-in-from-bottom duration-1000 delay-400" /></div>
               </div>
            </div>
         </div>

         <div className="space-y-8">
            <div className="bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
               <div className="absolute inset-0 chinese-gradient opacity-10" />
               <div className="relative z-10 space-y-6">
                  <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center">
                     <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2 animate-pulse" />
                     Báo cáo AI
                  </h4>
                  <p className="text-xl font-bold leading-relaxed italic">"Học viên cấp độ 3 đang có xu hướng gặp khó khăn ở phần Ngữ pháp Đọc hiểu. Cần bổ sung thêm 20-30 câu hỏi luyện tập chuyên sâu."</p>
                  <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/10 rounded-xl h-11 font-black text-xs uppercase tracking-widest">Xem chi tiết insight</Button>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
               <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">Phân bố địa lý</h4>
               <div className="space-y-4">
                  {[
                    { country: 'Việt Nam', percent: 65, color: 'bg-red-500' },
                    { country: 'Đài Loan', percent: 20, color: 'bg-blue-500' },
                    { country: 'Trung Quốc', percent: 10, color: 'bg-yellow-500' },
                    { country: 'Khác', percent: 5, color: 'bg-gray-400' }
                  ].map((c, i) => (
                    <div key={i} className="space-y-1.5">
                       <div className="flex justify-between text-[10px] font-black uppercase text-gray-500">
                          <span>{c.country}</span>
                          <span>{c.percent}%</span>
                       </div>
                       <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                          <div className={`h-full ${c.color}`} style={{ width: `${c.percent}%` }} />
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


