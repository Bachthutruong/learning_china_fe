import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { 
  Plus, 
  Trash2, 
  Loader2,
  Award,
  Coins,
  Gem,
  X
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { Badge } from '../../components/ui/badge'

interface RankReward {
  rank: number
  coins: number
}

interface RewardsConfig {
  _id: string
  name: string
  description?: string
  rankRewards: RankReward[]
  isActive: boolean
  effectiveFrom?: string
  effectiveTo?: string
  createdAt: string
  updatedAt: string
}

export const CompetitionRewardsConfigPage = () => {
  const [configs, setConfigs] = useState<RewardsConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingConfig, setEditingConfig] = useState<RewardsConfig | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rankRewards: [] as RankReward[],
    effectiveFrom: '',
    effectiveTo: ''
  })

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/competition-ranking/admin/rewards-configs')
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
      await api.delete(`/competition-ranking/admin/rewards-configs/${deletingId}`)
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
      await api.post(`/competition-ranking/admin/rewards-configs/${id}/activate`)
      toast.success('Kích hoạt cấu hình thành công!')
      fetchConfigs()
    } catch (error: any) {
      console.error('Error activating config:', error)
      toast.error(error.response?.data?.message || 'Không thể kích hoạt cấu hình')
    }
  }

  const handleCreateNew = () => {
    setEditingConfig(null)
    setFormData({
      name: '',
      description: '',
      rankRewards: [],
      effectiveFrom: '',
      effectiveTo: ''
    })
    setShowFormDialog(true)
  }

  const handleEdit = (config: RewardsConfig) => {
    setEditingConfig(config)
    setFormData({
      name: config.name,
      description: config.description || '',
      rankRewards: config.rankRewards,
      effectiveFrom: config.effectiveFrom ? new Date(config.effectiveFrom).toISOString().slice(0,16) : '',
      effectiveTo: config.effectiveTo ? new Date(config.effectiveTo).toISOString().slice(0,16) : ''
    })
    setShowFormDialog(true)
  }

  const addRankReward = () => {
    const maxRank = formData.rankRewards.length > 0 
      ? Math.max(...formData.rankRewards.map(rr => rr.rank)) + 1
      : 1
    setFormData({
      ...formData,
      rankRewards: [
        ...formData.rankRewards,
        { rank: maxRank, coins: 0 }
      ]
    })
  }

  const removeRankReward = (index: number) => {
    setFormData({
      ...formData,
      rankRewards: formData.rankRewards.filter((_, i) => i !== index)
    })
  }

  const updateRankReward = (index: number, field: 'rank' | 'coins', value: number) => {
    const newRewards = [...formData.rankRewards]
    newRewards[index][field] = value
    setFormData({ ...formData, rankRewards: newRewards })
  }

  const handleSubmitForm = async () => {
    if (!formData.name || formData.rankRewards.length === 0) {
      toast.error('Vui lòng điền tên và thêm ít nhất một phần thưởng hạng')
      return
    }

    if (formData.effectiveFrom && formData.effectiveTo) {
      const from = new Date(formData.effectiveFrom)
      const to = new Date(formData.effectiveTo)
      if (to < from) {
        toast.error('Thời gian kết thúc phải sau thời gian bắt đầu')
        return
      }
    }

    for (const reward of formData.rankRewards) {
      if (!reward.rank || reward.coins === undefined || reward.coins < 0) {
        toast.error('Mỗi phần thưởng phải có hạng và số xu hợp lệ')
        return
      }
    }

    try {
      if (editingConfig) {
        await api.put(`/competition-ranking/admin/rewards-configs/${editingConfig._id}`, formData)
        toast.success('Cập nhật cấu hình thành công!')
      } else {
        await api.post('/competition-ranking/admin/rewards-configs', formData)
        toast.success('Tạo cấu hình thành công!')
      }
      setShowFormDialog(false)
      fetchConfigs()
    } catch (error: any) {
      console.error('Error saving config:', error)
      toast.error(error.response?.data?.message || 'Không thể lưu cấu hình')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
             <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center text-white mr-4 shadow-lg">
                <Coins className="w-6 h-6" />
             </div>
             Chính sách thưởng Rank
          </h1>
          <p className="text-gray-500 font-medium">Thiết lập cơ cấu thưởng Xu cho bảng xếp hạng tổng sắp định kỳ của học viên.</p>
        </div>
        
        <Button onClick={handleCreateNew} className="chinese-gradient h-11 px-6 rounded-xl font-black text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-1">
          <Plus className="mr-2 h-4 w-4" /> Tạo kịch bản thưởng
        </Button>
      </div>

      {/* Configs List Rendering */}
      {configs.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-gray-100 shadow-sm text-center space-y-6">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <Award className="w-10 h-10" />
           </div>
           <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900">Chưa có kịch bản thưởng</h3>
              <p className="text-gray-500 font-medium">Khởi tạo kịch bản đầu tiên để khuyến khích tinh thần thi đấu của học viên.</p>
           </div>
           <Button onClick={handleCreateNew} className="chinese-gradient h-12 px-8 rounded-xl font-black text-white">Khởi tạo ngay</Button>
        </div>
      ) : (
        <div className="grid gap-8">
          {configs.map((config) => (
            <div key={config._id} className={`bg-white rounded-[3rem] p-8 border border-gray-100 shadow-xl relative overflow-hidden group transition-all ${config.isActive ? 'ring-4 ring-primary/10' : ''}`}>
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               
               <div className="relative z-10 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                     <div className="space-y-4 flex-1">
                        <div className="flex items-center space-x-3">
                           <h2 className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors">{config.name}</h2>
                           {config.isActive && (
                             <Badge className="bg-primary text-white border-none rounded-lg font-black text-[8px] uppercase px-2 py-1 tracking-widest shadow-md">System Active</Badge>
                           )}
                        </div>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-2xl">{config.description || 'Không có mô tả cho kịch bản thưởng này.'}</p>
                        {(config.effectiveFrom || config.effectiveTo) && (
                          <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                             <span className="flex items-center"><Plus className="w-3 h-3 mr-1" /> {config.effectiveFrom ? new Date(config.effectiveFrom).toLocaleDateString('vi-VN') : 'Immediate'}</span>
                             <span className="text-gray-300">→</span>
                             <span className="flex items-center"><X className="w-3 h-3 mr-1" /> {config.effectiveTo ? new Date(config.effectiveTo).toLocaleDateString('vi-VN') : 'Never Expire'}</span>
                          </div>
                        )}
                     </div>

                     <div className="flex items-center space-x-2">
                        {!config.isActive && (
                          <Button onClick={() => handleActivateConfig(config._id)} className="h-9 px-5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-green-100">Kích hoạt</Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(config)} className="h-9 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-primary">Chỉnh sửa</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteConfig(config._id)} className="w-9 h-9 rounded-xl hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {config.rankRewards.map((reward, rIdx) => (
                      <div key={rIdx} className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center space-y-3 hover:bg-white hover:shadow-md transition-all">
                         <div className="w-10 h-10 rounded-2xl chinese-gradient flex items-center justify-center text-white shadow-md">
                            <Award className="w-5 h-5" />
                         </div>
                         <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Hạng {reward.rank}</p>
                         <p className="text-xl font-black text-amber-500 flex items-center">
                            <Gem className="w-4 h-4 mr-1.5 fill-current" /> {reward.coins.toLocaleString()}
                         </p>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center space-y-4 mb-8">
             <DialogTitle className="text-3xl font-black text-gray-900">{editingConfig ? 'Hiệu chỉnh kịch bản' : 'Tạo kịch bản thưởng'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Tên kịch bản thưởng</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Thưởng Rank mùa Xuân 2026..."
                className="h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Mô tả chính sách</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả ngắn gọn về tiêu chí thưởng..."
                className="h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-medium"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Danh sách giải thưởng</Label>
                     <Button type="button" variant="outline" size="sm" onClick={addRankReward} className="rounded-lg font-black text-[8px] uppercase border-gray-200">
                        <Plus className="w-3 h-3 mr-1" /> Thêm hạng
                     </Button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {formData.rankRewards.map((reward, index) => (
                      <div key={index} className="flex gap-3 items-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-16">
                          <Label className="text-[8px] font-black uppercase text-gray-400">Rank</Label>
                          <Input type="number" value={reward.rank} onChange={(e) => updateRankReward(index, 'rank', parseInt(e.target.value) || 1)} className="h-8 font-black text-center" />
                        </div>
                        <div className="flex-1">
                          <Label className="text-[8px] font-black uppercase text-gray-400">Xu thưởng</Label>
                          <Input type="number" value={reward.coins} onChange={(e) => updateRankReward(index, 'coins', parseInt(e.target.value) || 0)} className="h-8 font-black text-amber-500" />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeRankReward(index)} className="mt-4 text-gray-300 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Thời gian hiệu lực</Label>
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Ngày bắt đầu</span>
                        <Input type="datetime-local" value={formData.effectiveFrom} onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })} className="h-10 text-xs font-bold" />
                     </div>
                     <div className="space-y-1">
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Ngày kết thúc</span>
                        <Input type="datetime-local" value={formData.effectiveTo} onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })} className="h-10 text-xs font-bold" />
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <DialogFooter className="mt-10 gap-3">
            <Button variant="ghost" onClick={() => setShowFormDialog(false)} className="rounded-xl font-bold text-gray-400">Hủy bỏ</Button>
            <Button onClick={handleSubmitForm} className="chinese-gradient px-8 rounded-xl font-black text-white shadow-lg shadow-primary/20">
               {editingConfig ? 'Cập nhật ngay' : 'Khởi tạo ngay'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl max-w-sm text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
             <Trash2 className="w-8 h-8" />
          </div>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-black text-gray-900">Xác nhận xóa?</DialogTitle>
            <DialogDescription className="text-sm font-medium text-gray-500 leading-relaxed">Toàn bộ dữ liệu cấu hình này sẽ bị gỡ bỏ vĩnh viễn khỏi hệ thống.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-8">
            <Button onClick={confirmDelete} className="h-12 rounded-xl font-black text-white shadow-lg bg-red-500 hover:bg-red-600">Đồng ý xóa</Button>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} className="h-12 rounded-xl font-bold text-gray-400">Hủy bỏ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}