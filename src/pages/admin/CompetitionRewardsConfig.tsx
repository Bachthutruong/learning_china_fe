import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { 
  Plus, 
  Trash2, 
  Save,
  Loader2,
  Award,
  Coins
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

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
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cấu hình Thưởng Xếp Hạng Toàn Bộ</h1>
            <p className="text-gray-600">Cấu hình xu thưởng cho các vị trí xếp hạng toàn bộ</p>
          </div>
          <Button onClick={handleCreateNew} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="mr-2 h-4 w-4" />
            Tạo cấu hình mới
          </Button>
        </div>

        {configs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Coins className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Chưa có cấu hình nào</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {configs.map((config) => (
              <Card key={config._id} className={config.isActive ? 'ring-2 ring-blue-500' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {config.name}
                        {config.isActive && (
                          <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                            Đang dùng
                          </span>
                        )}
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
                      {!config.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivateConfig(config._id)}
                        >
                          Kích hoạt
                        </Button>
                      )}
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
                  <div className="space-y-2">
                    {config.rankRewards.map((reward, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">TOP {reward.rank}:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium text-purple-600">{reward.coins.toLocaleString()} xu</span>
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Chỉnh sửa cấu hình' : 'Tạo cấu hình mới'}
              </DialogTitle>
              <DialogDescription>
                Cấu hình xu thưởng cho các vị trí xếp hạng toàn bộ
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <Label>Tên cấu hình *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Thưởng xếp hạng tháng 1"
                />
              </div>
              
              <div>
                <Label>Mô tả</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả về cấu hình thưởng này"
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
                  <Label>Phần thưởng theo hạng</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addRankReward}>
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm hạng
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.rankRewards.map((reward, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex gap-3 items-center">
                          <div className="flex-1">
                            <Label className="text-xs">TOP</Label>
                            <Input
                              type="number"
                              min="1"
                              value={reward.rank}
                              onChange={(e) => updateRankReward(index, 'rank', parseInt(e.target.value) || 1)}
                              className="w-full"
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">Số xu</Label>
                            <Input
                              type="number"
                              min="0"
                              value={reward.coins}
                              onChange={(e) => updateRankReward(index, 'coins', parseInt(e.target.value) || 0)}
                              className="w-full"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeRankReward(index)}
                            className="text-red-600 mt-6"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                <Save className="h செய-4 w-4 mr-2" />
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
