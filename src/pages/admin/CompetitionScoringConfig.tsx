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
  Users,
  Target,
  X
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { Badge } from '../../components/ui/badge'

interface RankPoint {
  rank: number
  points: number
}

interface ScoringRule {
  minParticipants: number
  maxParticipants: number
  rankPoints: RankPoint[]
}

interface ScoringConfig {
  _id: string
  name: string
  description?: string
  scoringRules: ScoringRule[]
  isActive: boolean
  effectiveFrom?: string
  effectiveTo?: string
  createdAt: string
  updatedAt: string
}

export const CompetitionScoringConfigPage = () => {
  const [configs, setConfigs] = useState<ScoringConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ScoringConfig | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scoringRules: [] as ScoringRule[],
    effectiveFrom: '',
    effectiveTo: ''
  })

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/competition-ranking/admin/scoring-configs')
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
      await api.delete(`/competition-ranking/admin/scoring-configs/${deletingId}`)
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

  const handleCreateNew = () => {
    setEditingConfig(null)
    setFormData({
      name: '',
      description: '',
      scoringRules: [],
      effectiveFrom: '',
      effectiveTo: ''
    })
    setShowFormDialog(true)
  }

  const handleEdit = (config: ScoringConfig) => {
    setEditingConfig(config)
    setFormData({
      name: config.name,
      description: config.description || '',
      scoringRules: config.scoringRules,
      effectiveFrom: config.effectiveFrom ? new Date(config.effectiveFrom).toISOString().slice(0,16) : '',
      effectiveTo: config.effectiveTo ? new Date(config.effectiveTo).toISOString().slice(0,16) : ''
    })
    setShowFormDialog(true)
  }

  const addRule = () => {
    setFormData({
      ...formData,
      scoringRules: [
        ...formData.scoringRules,
        { minParticipants: 1, maxParticipants: 10, rankPoints: [{ rank: 1, points: 10 }] }
      ]
    })
  }

  const removeRule = (index: number) => {
    setFormData({
      ...formData,
      scoringRules: formData.scoringRules.filter((_, i) => i !== index)
    })
  }

  const updateRule = (index: number, field: string, value: any) => {
    const newRules = [...formData.scoringRules]
    newRules[index] = { ...newRules[index], [field]: value }
    setFormData({ ...formData, scoringRules: newRules })
  }

  const addRankPoint = (ruleIndex: number) => {
    const newRules = [...formData.scoringRules]
    const maxRank = newRules[ruleIndex].rankPoints.length > 0
      ? Math.max(...newRules[ruleIndex].rankPoints.map(rp => rp.rank)) + 1
      : 1
    newRules[ruleIndex].rankPoints.push({ rank: maxRank, points: 0 })
    setFormData({ ...formData, scoringRules: newRules })
  }

  const removeRankPoint = (ruleIndex: number, pointIndex: number) => {
    const newRules = [...formData.scoringRules]
    newRules[ruleIndex].rankPoints = newRules[ruleIndex].rankPoints.filter((_, i) => i !== pointIndex)
    setFormData({ ...formData, scoringRules: newRules })
  }

  const updateRankPoint = (ruleIndex: number, pointIndex: number, field: 'rank' | 'points', value: number) => {
    const newRules = [...formData.scoringRules]
    newRules[ruleIndex].rankPoints[pointIndex][field] = value
    setFormData({ ...formData, scoringRules: newRules })
  }

  const handleSubmitForm = async () => {
    if (!formData.name || formData.scoringRules.length === 0) {
      toast.error('Vui lòng điền tên và thêm ít nhất một quy tắc điểm')
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

    for (const rule of formData.scoringRules) {
      if (!rule.minParticipants || !rule.maxParticipants || rule.rankPoints.length === 0) {
        toast.error('Mỗi quy tắc phải có số người tối thiểu, tối đa và ít nhất một điểm hạng')
        return
      }
      if (rule.maxParticipants < rule.minParticipants) {
        toast.error('Số người tối đa phải lớn hơn hoặc bằng số người tối thiểu')
        return
      }
    }

    try {
      if (editingConfig) {
        await api.put(`/competition-ranking/admin/scoring-configs/${editingConfig._id}`, formData)
        toast.success('Cập nhật cấu hình thành công!')
      } else {
        await api.post('/competition-ranking/admin/scoring-configs', formData)
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
                <Target className="w-6 h-6" />
             </div>
             Logic tính điểm
          </h1>
          <p className="text-gray-500 font-medium">Cấu hình hệ thống tính điểm Rank dựa trên quy mô phòng thi và thứ hạng đạt được.</p>
        </div>
        
        <Button onClick={handleCreateNew} className="chinese-gradient h-11 px-6 rounded-xl font-black text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-1">
          <Plus className="mr-2 h-4 w-4" /> Khởi tạo kịch bản điểm
        </Button>
      </div>

      {/* Configs List Rendering */}
      {configs.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-gray-100 shadow-sm text-center space-y-6">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <Award className="w-10 h-10" />
           </div>
           <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900">Chưa có logic điểm</h3>
              <p className="text-gray-500 font-medium">Thiết lập logic đầu tiên để bắt đầu tính toán bảng xếp hạng học viên.</p>
           </div>
           <Button onClick={handleCreateNew} className="chinese-gradient h-12 px-8 rounded-xl font-black text-white">Khởi tạo ngay</Button>
        </div>
      ) : (
        <div className="grid gap-8">
          {configs.map((config) => (
            <div key={config._id} className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               
               <div className="relative z-10 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                     <div className="space-y-4 flex-1">
                        <h2 className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors">{config.name}</h2>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-2xl">{config.description || 'Không có mô tả cho cấu hình này.'}</p>
                        {(config.effectiveFrom || config.effectiveTo) && (
                          <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                             <span className="flex items-center"><Plus className="w-3 h-3 mr-1" /> {config.effectiveFrom ? new Date(config.effectiveFrom).toLocaleDateString('vi-VN') : 'Always'}</span>
                             <span className="text-gray-300">→</span>
                             <span className="flex items-center"><X className="w-3 h-3 mr-1" /> {config.effectiveTo ? new Date(config.effectiveTo).toLocaleDateString('vi-VN') : 'Never Expire'}</span>
                          </div>
                        )}
                     </div>

                     <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(config)} className="h-9 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-primary">Chỉnh sửa</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteConfig(config._id)} className="w-9 h-9 rounded-xl hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {config.scoringRules.map((rule, rIdx) => (
                      <div key={rIdx} className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 space-y-4 hover:bg-white hover:shadow-md transition-all">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                               <Users className="w-4 h-4 text-primary" />
                               <span className="text-[10px] font-black uppercase text-gray-400">Quy mô: {rule.minParticipants}-{rule.maxParticipants}</span>
                            </div>
                            <Badge className="bg-primary/5 text-primary border-none rounded-lg text-[8px] font-black">Rule #{rIdx + 1}</Badge>
                         </div>
                         <div className="space-y-2">
                            {rule.rankPoints.map((rp, pIdx) => (
                              <div key={pIdx} className="flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-gray-50">
                                 <span className="text-xs font-bold text-gray-500">TOP {rp.rank}</span>
                                 <span className="text-sm font-black text-gray-900">+{rp.points} pts</span>
                              </div>
                            ))}
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center space-y-4 mb-8">
             <DialogTitle className="text-3xl font-black text-gray-900">{editingConfig ? 'Hiệu chỉnh logic điểm' : 'Tạo kịch bản tính điểm'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Tên cấu hình</Label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary font-bold" placeholder="Ví dụ: Logic điểm mặc định" />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Mô tả</Label>
                  <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary font-bold" placeholder="Mô tả về logic điểm này" />
               </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Thời gian hiệu lực</Label>
                  <div className="flex gap-2">
                     <Input type="datetime-local" value={formData.effectiveFrom} onChange={e => setFormData({ ...formData, effectiveFrom: e.target.value })} className="h-12 text-xs" />
                     <Input type="datetime-local" value={formData.effectiveTo} onChange={e => setFormData({ ...formData, effectiveTo: e.target.value })} className="h-12 text-xs" />
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Quy tắc phân tầng quy mô</Label>
                  <Button type="button" onClick={addRule} variant="outline" size="sm" className="rounded-lg font-black text-[8px] uppercase border-gray-200">
                     <Plus className="w-3 h-3 mr-1" /> Thêm quy tắc
                  </Button>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                  {formData.scoringRules.map((rule, idx) => (
                    <div key={idx} className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 space-y-6 relative group">
                       <Button type="button" variant="ghost" size="icon" onClick={() => removeRule(idx)} className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                       </Button>
                       <div className="flex items-center gap-3">
                          <div className="flex-1 space-y-1">
                             <span className="text-[8px] font-black uppercase text-gray-400">Min Players</span>
                             <Input type="number" value={rule.minParticipants} onChange={e => updateRule(idx, 'minParticipants', parseInt(e.target.value))} className="h-8 font-black" />
                          </div>
                          <div className="flex-1 space-y-1">
                             <span className="text-[8px] font-black uppercase text-gray-400">Max Players</span>
                             <Input type="number" value={rule.maxParticipants} onChange={e => updateRule(idx, 'maxParticipants', parseInt(e.target.value))} className="h-8 font-black" />
                          </div>
                       </div>
                       
                       <div className="space-y-3">
                          <div className="flex justify-between items-center">
                             <span className="text-[8px] font-black uppercase text-gray-400">Điểm theo thứ hạng</span>
                             <button type="button" onClick={() => addRankPoint(idx)} className="text-[8px] font-black uppercase text-primary hover:underline">+ Thêm Rank</button>
                          </div>
                          <div className="space-y-2">
                             {rule.rankPoints.map((rp, pi) => (
                               <div key={pi} className="flex items-center gap-2">
                                  <div className="flex-1 space-y-1">
                                     <span className="text-[8px] font-black uppercase text-gray-400">TOP</span>
                                     <Input type="number" min="1" value={rp.rank} onChange={e => updateRankPoint(idx, pi, 'rank', parseInt(e.target.value) || 1)} className="h-8 font-black" />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                     <span className="text-[8px] font-black uppercase text-gray-400">Điểm</span>
                                     <Input type="number" min="0" value={rp.points} onChange={e => updateRankPoint(idx, pi, 'points', parseInt(e.target.value) || 0)} className="h-8 font-black text-primary" />
                                  </div>
                                  <button type="button" onClick={() => removeRankPoint(idx, pi)} className="text-gray-300 hover:text-red-500 mt-4"><X className="w-3 h-3" /></button>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <DialogFooter className="mt-10 gap-3">
            <Button variant="ghost" onClick={() => setShowFormDialog(false)} className="rounded-xl font-bold text-gray-400">Hủy bỏ</Button>
            <Button onClick={handleSubmitForm} className="chinese-gradient px-8 rounded-xl font-black text-white shadow-lg">Lưu cấu hình</Button>
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
            <DialogDescription className="text-sm font-medium text-gray-500">Hành động này không thể hoàn tác.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-8">
            <Button onClick={confirmDelete} className="h-12 rounded-xl font-black text-white shadow-lg bg-red-500 hover:bg-red-600">Xác nhận</Button>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} className="h-12 rounded-xl font-bold text-gray-400">Hủy</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}