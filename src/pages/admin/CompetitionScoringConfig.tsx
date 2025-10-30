import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { 
  Plus, 
  Trash2, 
  // Settings,
  Save,
  Loader2,
  Award,
  Users
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

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
  // const navigate = useNavigate()
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

  // Activation no longer needed; using all configs

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

  const addScoringRule = () => {
    setFormData({
      ...formData,
      scoringRules: [
        ...formData.scoringRules,
        { minParticipants: 1, maxParticipants: 10, rankPoints: [{ rank: 1, points: 10 }] }
      ]
    })
  }

  const removeScoringRule = (index: number) => {
    setFormData({
      ...formData,
      scoringRules: formData.scoringRules.filter((_, i) => i !== index)
    })
  }

  const updateScoringRule = (index: number, field: 'minParticipants' | 'maxParticipants', value: number) => {
    const newRules = [...formData.scoringRules]
    newRules[index][field] = value
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
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cấu hình Logic Điểm</h1>
            <p className="text-gray-600">Cấu hình điểm số dựa trên số người tham gia và thứ hạng</p>
          </div>
          <Button onClick={handleCreateNew} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="mr-2 h-4 w-4" />
            Tạo cấu hình mới
          </Button>
        </div>

        {configs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Chưa có cấu hình nào</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {configs.map((config) => (
              <Card key={config._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {config.name}
                      </CardTitle>
                      {config.description && (
                        <CardDescription className="mt-2">{config.description}</CardDescription>
                      )}
                      {(config.effectiveFrom || config.effectiveTo) && (
                        <div className="text-xs text-gray-600 mt-2">
                          Hiệu lực: {config.effectiveFrom ? new Date(config.effectiveFrom).toLocaleString('vi-VN') : '—'} → {config.effectiveTo ? new Date(config.effectiveTo).toLocaleString('vi-VN') : '—'}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(config)}
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteConfig(config._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {config.scoringRules.map((rule, ruleIndex) => (
                      <div key={ruleIndex} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="h-4 w-4 text-gray-600" />
                          <span className="font-semibold">
                            Phòng từ {rule.minParticipants} đến {rule.maxParticipants} người
                          </span>
                        </div>
                        <div className="space-y-2">
                          {rule.rankPoints.map((rp, pointIndex) => (
                            <div key={pointIndex} className="flex items-center gap-2">
                              <span className="w-20 text-sm">TOP {rp.rank}:</span>
                              <span className="text-sm font-medium">{rp.points} điểm</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Chỉnh sửa cấu hình' : 'Tạo cấu hình mới'}
              </DialogTitle>
              <DialogDescription>
                Cấu hình điểm số dựa trên số người tham gia và thứ hạng trong cuộc thi
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <Label>Tên cấu hình *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Logic điểm mặc định"
                />
              </div>
              
              <div>
                <Label>Mô tả</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả về logic điểm này"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Hiệu lực từ</Label>
                  <Input
                    type="datetime-local"
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Hiệu lực đến</Label>
                  <Input
                    type="datetime-local"
                    value={formData.effectiveTo}
                    min={formData.effectiveFrom || undefined}
                    onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Quy tắc điểm số</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addScoringRule}>
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm quy tắc
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.scoringRules.map((rule, ruleIndex) => (
                    <Card key={ruleIndex}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="font-semibold">Quy tắc {ruleIndex + 1}</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeScoringRule(ruleIndex)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Số người tham gia tối thiểu</Label>
                            <Input
                              type="number"
                              min="1"
                              value={rule.minParticipants}
                              onChange={(e) => updateScoringRule(ruleIndex, 'minParticipants', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div>
                            <Label>Số người tham gia tối đa</Label>
                            <Input
                              type="number"
                              min={rule.minParticipants}
                              value={rule.maxParticipants}
                              onChange={(e) => updateScoringRule(ruleIndex, 'maxParticipants', parseInt(e.target.value) || rule.minParticipants)}
                            />
                          </div>
                          <p className="text-xs text-gray-500 md:col-span-2">
                            Áp dụng khi số người trong phòng nằm trong khoảng [{rule.minParticipants} - {rule.maxParticipants}]
                          </p>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label>Điểm theo thứ hạng</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addRankPoint(ruleIndex)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Thêm hạng
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {rule.rankPoints.map((rp, pointIndex) => (
                              <div key={pointIndex} className="flex gap-2 items-center">
                                <div className="flex-1">
                                  <Label className="text-xs">TOP</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={rp.rank}
                                    onChange={(e) => updateRankPoint(ruleIndex, pointIndex, 'rank', parseInt(e.target.value) || 1)}
                                    className="w-full"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label className="text-xs">Điểm</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={rp.points}
                                    onChange={(e) => updateRankPoint(ruleIndex, pointIndex, 'points', parseInt(e.target.value) || 0)}
                                    className="w-full"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeRankPoint(ruleIndex, pointIndex)}
                                  className="text-red-600 mt-6"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFormDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmitForm}>
                <Save className="h-4 w-4 mr-2" />
                {editingConfig ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa cấu hình này? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Xóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

