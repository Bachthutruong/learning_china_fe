import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { 
  ArrowLeft,
  Plus, 
  Trash2, 
  Brain,
  Settings,
  Gem
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'


interface ProficiencyConfig {
  _id: string
  name: string
  description: string
  cost: number
  initialQuestions: {
    level: number
    count: number
  }[]
  branches: {
    name: string
    condition: {
      correctRange: [number, number]
      fromPhase: 'initial' | 'followup' | 'final'
    }
    nextQuestions: {
      level: number
      count: number
    }[]
    resultLevel?: number
    nextPhase?: 'followup' | 'final'
    subBranches?: any[]
  }[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const ProficiencyConfigPage = () => {
  const navigate = useNavigate()
  const [configs, setConfigs] = useState<ProficiencyConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/proficiency-configs')
      setConfigs(response.data.configs || [])
    } catch (error) {
      console.error('Error fetching configs:', error)
      toast.error('Không thể tải danh sách cấu hình')
    } finally {
      setLoading(false)
    }
  }


  const handleDeleteConfig = async (id: string) => {
    setDeletingId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingId) return

    try {
      await api.delete(`/admin/proficiency-configs/${deletingId}`)
      toast.success('Xóa cấu hình thành công!')
      fetchConfigs()
    } catch (error: any) {
      console.error('Error deleting config:', error)
      toast.error(error.response?.data?.message || 'Không thể xóa cấu hình')
    } finally {
      setShowDeleteDialog(false)
      setDeletingId(null)
    }
  }

  const handleActivateConfig = async (id: string) => {
    try {
      await api.post(`/admin/proficiency-configs/${id}/activate`)
      toast.success('Kích hoạt cấu hình thành công!')
      fetchConfigs()
    } catch (error: any) {
      console.error('Error activating config:', error)
      toast.error(error.response?.data?.message || 'Không thể kích hoạt cấu hình')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/proficiency')} className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 p-0">
             <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Button>
          <div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
                <Brain className="w-8 h-8 mr-3 text-primary" />
                Quản lý kịch bản Test
             </h1>
             <p className="text-gray-500 font-medium">Thiết lập cấu trúc phân nhánh và logic AI cho bài thi đánh giá năng lực.</p>
          </div>
        </div>
        
        <Button onClick={() => navigate('/admin/proficiency-config/new')} className="chinese-gradient h-11 px-6 rounded-xl font-black text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-1">
          <Plus className="mr-2 h-4 w-4" /> Tạo kịch bản mới
        </Button>
      </div>

      {/* Configs List Rendering */}
      {configs.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-gray-100 shadow-sm text-center space-y-6">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <Settings className="w-10 h-10" />
           </div>
           <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900">Chưa có kịch bản nào</h3>
              <p className="text-gray-500 font-medium">Khởi tạo kịch bản đầu tiên để bắt đầu hệ thống khảo thí năng lực.</p>
           </div>
           <Button onClick={() => navigate('/admin/proficiency-config/new')} className="chinese-gradient h-12 px-8 rounded-xl font-black text-white shadow-lg">Khởi tạo ngay</Button>
        </div>
      ) : (
        <div className="grid gap-8">
          {configs.map((config) => (
            <div key={config._id} className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               
               <div className="relative z-10 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                     <div className="space-y-4 flex-1">
                        <div className="flex items-center space-x-3">
                           <h2 className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors">{config.name}</h2>
                           {config.isActive && (
                             <Badge className="bg-green-100 text-green-700 border-none rounded-lg font-black text-[8px] uppercase px-2 py-1 tracking-widest">Active System</Badge>
                           )}
                        </div>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-2xl">{config.description}</p>
                     </div>

                     <div className="flex items-center space-x-2">
                        {!config.isActive && (
                          <Button onClick={() => handleActivateConfig(config._id)} className="h-10 px-5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-green-100">Kích hoạt</Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/proficiency-config/${config._id}/edit`)} className="w-10 h-10 rounded-xl hover:bg-blue-50 hover:text-blue-600"><Settings className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteConfig(config._id)} className="w-10 h-10 rounded-xl hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-50 text-center space-y-1 group-hover:bg-white group-hover:shadow-md transition-all">
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Lệ phí khảo thí</p>
                        <p className="text-xl font-black text-amber-500 flex items-center justify-center"><Gem className="w-4 h-4 mr-1 fill-current" /> {config.cost.toLocaleString()}</p>
                     </div>
                     <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-50 text-center space-y-1 group-hover:bg-white group-hover:shadow-md transition-all">
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Giai đoạn Initial</p>
                        <p className="text-xl font-black text-gray-900">{config.initialQuestions.length} Cấp độ</p>
                     </div>
                     <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-50 text-center space-y-1 group-hover:bg-white group-hover:shadow-md transition-all">
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Số nhánh logic</p>
                        <p className="text-xl font-black text-gray-900">{config.branches.length} Nhánh</p>
                     </div>
                     <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-50 text-center space-y-1 group-hover:bg-white group-hover:shadow-md transition-all">
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Cập nhật cuối</p>
                        <p className="text-sm font-bold text-gray-700">{new Date(config.updatedAt).toLocaleDateString('vi-VN')}</p>
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
