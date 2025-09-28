import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

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
  }[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface BranchFormData {
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
}

export const AdminProficiencyConfig = () => {
  const [configs, setConfigs] = useState<ProficiencyConfig[]>([])
  const [levels, setLevels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingConfig, setEditingConfig] = useState<ProficiencyConfig | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: 50000,
    initialQuestions: [{ level: 1, count: 2 }],
    branches: [] as BranchFormData[]
  })
  const [formLoading, setFormLoading] = useState(false)
  const [expandedBranches, setExpandedBranches] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchConfigs()
    fetchLevels()
  }, [])

  const fetchLevels = async () => {
    try {
      const response = await api.get('/admin/levels')
      console.log('Levels response:', response.data)
      setLevels(response.data.levels || [])
    } catch (error) {
      console.error('Error fetching levels:', error)
      toast.error('Không thể tải danh sách cấp độ')
    }
  }

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/proficiency-configs')
      const configs = response.data.configs || []
      
      // If no configs exist, create a default one
      if (configs.length === 0) {
        await createDefaultConfig()
        // Fetch again after creating default
        const newResponse = await api.get('/admin/proficiency-configs')
        setConfigs(newResponse.data.configs || [])
      } else {
        setConfigs(configs)
      }
    } catch (error) {
      console.error('Error fetching proficiency configs:', error)
      toast.error('Không thể tải cấu hình test năng lực')
    } finally {
      setLoading(false)
    }
  }

  const createDefaultConfig = async () => {
    try {
      // Get available levels for default config
      const availableLevels = levels.length > 0 ? levels : [
        { level: 1, name: 'Cơ bản' },
        { level: 2, name: 'Trung cấp' },
        { level: 3, name: 'Nâng cao' }
      ]
      
      const defaultConfig = {
        name: 'Cấu hình Test Năng lực Mặc định',
        description: 'Cấu hình test năng lực mặc định với logic phân nhánh dựa trên cấp độ',
        cost: 50000,
        initialQuestions: [
          { level: availableLevels[0]?.level || 1, count: 2 },
          { level: availableLevels[1]?.level || 2, count: 3 },
          { level: availableLevels[2]?.level || 3, count: 3 }
        ],
        branches: [
          {
            name: 'Đúng 1-4 câu (Cấp thấp)',
            condition: { correctRange: [1, 4], fromPhase: 'initial' },
            nextQuestions: [{ level: availableLevels[0]?.level || 1, count: 8 }],
            nextPhase: 'followup'
          },
          {
            name: 'Đúng 5-6 câu (Cấp trung bình)',
            condition: { correctRange: [5, 6], fromPhase: 'initial' },
            nextQuestions: [{ level: availableLevels[1]?.level || 2, count: 8 }],
            nextPhase: 'followup'
          },
          {
            name: 'Đúng 7-8 câu (Cấp cao)',
            condition: { correctRange: [7, 8], fromPhase: 'initial' },
            nextQuestions: [{ level: availableLevels[2]?.level || 3, count: 14 }],
            nextPhase: 'final'
          },
          {
            name: 'Đúng 0 câu (Cấp mới bắt đầu)',
            condition: { correctRange: [0, 0], fromPhase: 'initial' },
            nextQuestions: [{ level: availableLevels[0]?.level || 1, count: 14 }],
            nextPhase: 'final'
          },
          {
            name: 'Đúng 1-6 câu A (A1)',
            condition: { correctRange: [1, 6], fromPhase: 'followup' },
            nextQuestions: [],
            resultLevel: availableLevels[0]?.level || 1,
            nextPhase: 'final'
          },
          {
            name: 'Đúng 7-14 câu A (A2)',
            condition: { correctRange: [7, 14], fromPhase: 'followup' },
            nextQuestions: [],
            resultLevel: availableLevels[1]?.level || 2,
            nextPhase: 'final'
          },
          {
            name: 'Đúng 1-6 câu B (B1)',
            condition: { correctRange: [1, 6], fromPhase: 'followup' },
            nextQuestions: [],
            resultLevel: availableLevels[1]?.level || 2,
            nextPhase: 'final'
          },
          {
            name: 'Đúng 7-14 câu B (B2)',
            condition: { correctRange: [7, 14], fromPhase: 'followup' },
            nextQuestions: [],
            resultLevel: availableLevels[2]?.level || 3,
            nextPhase: 'final'
          },
          {
            name: 'Đúng 1-9 câu C (C1)',
            condition: { correctRange: [1, 9], fromPhase: 'final' },
            nextQuestions: [],
            resultLevel: availableLevels[2]?.level || 3,
            nextPhase: 'final'
          },
          {
            name: 'Đúng 10-14 câu C (C2)',
            condition: { correctRange: [10, 14], fromPhase: 'final' },
            nextQuestions: [],
            resultLevel: availableLevels[2]?.level || 3,
            nextPhase: 'final'
          }
        ]
      }
      
      await api.post('/admin/proficiency-configs', defaultConfig)
      toast.success('Đã tạo cấu hình mặc định!')
    } catch (error) {
      console.error('Error creating default config:', error)
      toast.error('Không thể tạo cấu hình mặc định')
    }
  }

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên cấu hình')
      return
    }

    if (formData.cost < 0) {
      toast.error('Chi phí không được âm')
      return
    }

    try {
      setFormLoading(true)
      await api.post('/admin/proficiency-configs', formData)
      
      toast.success('Tạo cấu hình thành công!')
      setShowCreateDialog(false)
      resetForm()
      fetchConfigs()
    } catch (error: any) {
      console.error('Error creating config:', error)
      toast.error(error.response?.data?.message || 'Không thể tạo cấu hình')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditConfig = (config: ProficiencyConfig) => {
    setEditingConfig(config)
    setFormData({
      name: config.name,
      description: config.description || '',
      cost: config.cost,
      initialQuestions: config.initialQuestions,
      branches: config.branches.map((branch, index) => ({
        ...branch,
        id: `branch-${index}` // Add unique ID for form handling
      }))
    })
    setShowEditDialog(true)
  }

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingConfig) return
    
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên cấu hình')
      return
    }

    if (formData.cost < 0) {
      toast.error('Chi phí không được âm')
      return
    }

    try {
      setFormLoading(true)
      await api.put(`/admin/proficiency-configs/${editingConfig._id}`, formData)
      toast.success('Cập nhật cấu hình thành công!')
      setShowEditDialog(false)
      setEditingConfig(null)
      resetForm()
      fetchConfigs()
    } catch (error: any) {
      console.error('Error updating config:', error)
      toast.error(error.response?.data?.message || 'Không thể cập nhật cấu hình')
    } finally {
      setFormLoading(false)
    }
  }


  const handleDeleteConfig = (id: string) => {
    setDeletingId(id)
    setShowDeleteDialog(true)
  }

  const confirmDeleteConfig = async () => {
    if (!deletingId) return
    try {
      await api.delete(`/admin/proficiency-configs/${deletingId}`)
      toast.success('Xóa cấu hình thành công!')
      setShowDeleteDialog(false)
      setDeletingId(null)
      fetchConfigs()
    } catch (error: any) {
      console.error('Error deleting config:', error)
      toast.error(error.response?.data?.message || 'Không thể xóa cấu hình')
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      cost: 50000,
      initialQuestions: [{ level: 1, count: 2 }],
      branches: []
    })
  }


  const addInitialQuestion = () => {
    setFormData(prev => ({
      ...prev,
      initialQuestions: [...prev.initialQuestions, { level: 1, count: 1 }]
    }))
  }

  const removeInitialQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      initialQuestions: prev.initialQuestions.filter((_, i) => i !== index)
    }))
  }

  const updateInitialQuestion = (index: number, field: 'level' | 'count', value: number) => {
    setFormData(prev => ({
      ...prev,
      initialQuestions: prev.initialQuestions.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const addBranch = () => {
    setFormData(prev => ({
      ...prev,
      branches: [...prev.branches, {
        name: '',
        condition: {
          correctRange: [0, 0],
          fromPhase: 'initial'
        },
        nextQuestions: [{ level: 1, count: 1 }]
      }]
    }))
  }

  const removeBranch = (index: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.filter((_, i) => i !== index)
    }))
  }

  const updateBranch = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === index ? { ...branch, [field]: value } : branch
      )
    }))
  }

  const addNextQuestion = (branchIndex: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { ...branch, nextQuestions: [...branch.nextQuestions, { level: 1, count: 1 }] }
          : branch
      )
    }))
  }

  const removeNextQuestion = (branchIndex: number, questionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { ...branch, nextQuestions: branch.nextQuestions.filter((_, j) => j !== questionIndex) }
          : branch
      )
    }))
  }

  const updateNextQuestion = (branchIndex: number, questionIndex: number, field: 'level' | 'count', value: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { 
              ...branch, 
              nextQuestions: branch.nextQuestions.map((q, j) => 
                j === questionIndex ? { ...q, [field]: value } : q
              )
            }
          : branch
      )
    }))
  }

  const toggleBranchExpansion = (index: number) => {
    const newExpanded = new Set(expandedBranches)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedBranches(newExpanded)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Cấu hình Test Năng lực</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cấu hình Test Năng lực</h1>
          <p className="text-gray-600">Quản lý logic và cấu hình test năng lực</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Tạo cấu hình mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo cấu hình test năng lực</DialogTitle>
              <DialogDescription>
                Cấu hình logic và nhánh cho test năng lực
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateConfig} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên cấu hình *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Cấu hình test năng lực mặc định"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Chi phí (xu) *</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả về cấu hình test năng lực..."
                  rows={3}
                />
              </div>

              {/* Initial Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Câu hỏi ban đầu</Label>
                  <Button type="button" onClick={addInitialQuestion} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm
                  </Button>
                </div>
                {formData.initialQuestions.map((question, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label>Cấp độ</Label>
                      <select
                        className="w-full p-2 border rounded-lg"
                        value={question.level}
                        onChange={(e) => updateInitialQuestion(index, 'level', parseInt(e.target.value))}
                      >
                        <option value="">Chọn cấp độ...</option>
                        {levels.map((level) => (
                          <option key={level._id} value={level.level || level.number}>
                            Cấp {level.level || level.number}: {level.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <Label>Số câu</Label>
                      <Input
                        type="number"
                        min="1"
                        value={question.count}
                        onChange={(e) => updateInitialQuestion(index, 'count', parseInt(e.target.value))}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeInitialQuestion(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Branches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Nhánh logic</Label>
                  <Button type="button" onClick={addBranch} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm nhánh
                  </Button>
                </div>
                {formData.branches.map((branch, branchIndex) => (
                  <Card key={branchIndex} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBranchExpansion(branchIndex)}
                          >
                            {expandedBranches.has(branchIndex) ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </Button>
                          <Label className="text-lg font-semibold">Nhánh {branchIndex + 1}</Label>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeBranch(branchIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    {expandedBranches.has(branchIndex) && (
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Tên nhánh</Label>
                            <Input
                              value={branch.name}
                              onChange={(e) => updateBranch(branchIndex, 'name', e.target.value)}
                              placeholder="Ví dụ: Đúng 1-4 câu"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Giai đoạn</Label>
                            <select
                              className="w-full p-2 border rounded-lg"
                              value={branch.condition.fromPhase}
                              onChange={(e) => updateBranch(branchIndex, 'condition', {
                                ...branch.condition,
                                fromPhase: e.target.value as 'initial' | 'followup' | 'final'
                              })}
                            >
                              <option value="initial">Ban đầu</option>
                              <option value="followup">Theo dõi</option>
                              <option value="final">Cuối cùng</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Số câu đúng tối thiểu</Label>
                            <Input
                              type="number"
                              min="0"
                              value={branch.condition.correctRange[0]}
                              onChange={(e) => updateBranch(branchIndex, 'condition', {
                                ...branch.condition,
                                correctRange: [parseInt(e.target.value), branch.condition.correctRange[1]]
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Số câu đúng tối đa</Label>
                            <Input
                              type="number"
                              min="0"
                              value={branch.condition.correctRange[1]}
                              onChange={(e) => updateBranch(branchIndex, 'condition', {
                                ...branch.condition,
                                correctRange: [branch.condition.correctRange[0], parseInt(e.target.value)]
                              })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Kết quả cuối (cấp độ)</Label>
                            <select
                              className="w-full p-2 border rounded-lg"
                              value={branch.resultLevel || ''}
                              onChange={(e) => updateBranch(branchIndex, 'resultLevel', 
                                e.target.value ? parseInt(e.target.value) : undefined
                              )}
                            >
                              <option value="">Không có kết quả cuối</option>
                              {levels.map((level) => (
                                <option key={level._id} value={level.level || level.number}>
                                  Cấp {level.level || level.number}: {level.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Giai đoạn tiếp theo</Label>
                            <select
                              className="w-full p-2 border rounded-lg"
                              value={branch.nextPhase || ''}
                              onChange={(e) => updateBranch(branchIndex, 'nextPhase', 
                                e.target.value || undefined
                              )}
                            >
                              <option value="">Kết thúc</option>
                              <option value="followup">Theo dõi</option>
                              <option value="final">Cuối cùng</option>
                            </select>
                          </div>
                        </div>

                        {/* Next Questions */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Câu hỏi tiếp theo</Label>
                            <Button
                              type="button"
                              onClick={() => addNextQuestion(branchIndex)}
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Thêm
                            </Button>
                          </div>
                          {branch.nextQuestions.map((question, questionIndex) => (
                            <div key={questionIndex} className="flex items-center gap-4 p-3 border rounded-lg">
                              <div className="flex-1">
                                <Label>Cấp độ</Label>
                                <select
                                  className="w-full p-2 border rounded-lg"
                                  value={question.level}
                                  onChange={(e) => updateNextQuestion(branchIndex, questionIndex, 'level', parseInt(e.target.value))}
                                >
                                  {levels.map((level) => (
                                    <option key={level._id} value={level.level || level.number}>
                                      Cấp {level.level || level.number}: {level.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex-1">
                                <Label>Số câu</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={question.count}
                                  onChange={(e) => updateNextQuestion(branchIndex, questionIndex, 'count', parseInt(e.target.value))}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeNextQuestion(branchIndex, questionIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo cấu hình'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa cấu hình test năng lực</DialogTitle>
              <DialogDescription>
                Cập nhật logic và nhánh cho test năng lực
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateConfig} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Tên cấu hình *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Cấu hình test năng lực mặc định"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cost">Chi phí (xu) *</Label>
                  <Input
                    id="edit-cost"
                    type="number"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Mô tả</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả về cấu hình test năng lực..."
                  rows={3}
                />
              </div>

              {/* Initial Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Câu hỏi ban đầu</Label>
                  <Button type="button" onClick={addInitialQuestion} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm
                  </Button>
                </div>
                {formData.initialQuestions.map((question, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label>Cấp độ</Label>
                      <select
                        className="w-full p-2 border rounded-lg"
                        value={question.level}
                        onChange={(e) => updateInitialQuestion(index, 'level', parseInt(e.target.value))}
                      >
                        <option value="">Chọn cấp độ...</option>
                        {levels.map((level) => (
                          <option key={level._id} value={level.level || level.number}>
                            Cấp {level.level || level.number}: {level.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <Label>Số câu</Label>
                      <Input
                        type="number"
                        min="1"
                        value={question.count}
                        onChange={(e) => updateInitialQuestion(index, 'count', parseInt(e.target.value))}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeInitialQuestion(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Branches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Nhánh logic</Label>
                  <Button type="button" onClick={addBranch} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm nhánh
                  </Button>
                </div>
                {formData.branches.map((branch, branchIndex) => (
                  <Card key={branchIndex} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBranchExpansion(branchIndex)}
                          >
                            {expandedBranches.has(branchIndex) ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </Button>
                          <Label className="text-lg font-semibold">Nhánh {branchIndex + 1}</Label>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeBranch(branchIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    {expandedBranches.has(branchIndex) && (
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Tên nhánh</Label>
                            <Input
                              value={branch.name}
                              onChange={(e) => updateBranch(branchIndex, 'name', e.target.value)}
                              placeholder="Ví dụ: Đúng 1-4 câu"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Giai đoạn</Label>
                            <select
                              className="w-full p-2 border rounded-lg"
                              value={branch.condition.fromPhase}
                              onChange={(e) => updateBranch(branchIndex, 'condition', {
                                ...branch.condition,
                                fromPhase: e.target.value as 'initial' | 'followup' | 'final'
                              })}
                            >
                              <option value="initial">Ban đầu</option>
                              <option value="followup">Theo dõi</option>
                              <option value="final">Cuối cùng</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Số câu đúng tối thiểu</Label>
                            <Input
                              type="number"
                              min="0"
                              value={branch.condition.correctRange[0]}
                              onChange={(e) => updateBranch(branchIndex, 'condition', {
                                ...branch.condition,
                                correctRange: [parseInt(e.target.value), branch.condition.correctRange[1]]
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Số câu đúng tối đa</Label>
                            <Input
                              type="number"
                              min="0"
                              value={branch.condition.correctRange[1]}
                              onChange={(e) => updateBranch(branchIndex, 'condition', {
                                ...branch.condition,
                                correctRange: [branch.condition.correctRange[0], parseInt(e.target.value)]
                              })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Kết quả cuối (cấp độ)</Label>
                            <select
                              className="w-full p-2 border rounded-lg"
                              value={branch.resultLevel || ''}
                              onChange={(e) => updateBranch(branchIndex, 'resultLevel', 
                                e.target.value ? parseInt(e.target.value) : undefined
                              )}
                            >
                              <option value="">Không có kết quả cuối</option>
                              {levels.map((level) => (
                                <option key={level._id} value={level.level || level.number}>
                                  Cấp {level.level || level.number}: {level.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Giai đoạn tiếp theo</Label>
                            <select
                              className="w-full p-2 border rounded-lg"
                              value={branch.nextPhase || ''}
                              onChange={(e) => updateBranch(branchIndex, 'nextPhase', e.target.value as 'followup' | 'final' | 'completed')}
                            >
                              <option value="followup">Theo dõi</option>
                              <option value="final">Cuối cùng</option>
                              <option value="completed">Hoàn thành</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Câu hỏi tiếp theo</Label>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Cấu hình câu hỏi</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addNextQuestion(branchIndex)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Thêm
                              </Button>
                            </div>
                            {branch.nextQuestions.map((question, questionIndex) => (
                              <div key={questionIndex} className="flex items-center gap-4 p-3 border rounded-lg">
                                <div className="flex-1">
                                  <Label>Cấp độ</Label>
                                  <select
                                    className="w-full p-2 border rounded-lg"
                                    value={question.level}
                                    onChange={(e) => updateNextQuestion(branchIndex, questionIndex, 'level', parseInt(e.target.value))}
                                  >
                                    <option value="">Chọn cấp độ...</option>
                                    {levels.map((level) => (
                                      <option key={level._id} value={level.level || level.number}>
                                        Cấp {level.level || level.number}: {level.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex-1">
                                  <Label>Số câu</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={question.count}
                                    onChange={(e) => updateNextQuestion(branchIndex, questionIndex, 'count', parseInt(e.target.value))}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeNextQuestion(branchIndex, questionIndex)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    'Cập nhật cấu hình'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Configs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configs.map((config) => (
          <Card key={config._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {config.name}
                    </CardTitle>
                    <CardDescription>
                      Chi phí: {config.cost.toLocaleString()} xu
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditConfig(config)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteConfig(config._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.description && (
                <p className="text-gray-600 text-sm">
                  {config.description}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Câu hỏi ban đầu:</span>
                  <span className="text-sm text-gray-600">
                    {config.initialQuestions.reduce((sum, q) => sum + q.count, 0)} câu
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Số nhánh:</span>
                  <span className="text-sm text-gray-600">{config.branches.length}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Badge variant={config.isActive ? "default" : "outline"} className="text-xs">
                  {config.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                </Badge>
                {!config.isActive && (
                  <Button
                    size="sm"
                    onClick={() => handleActivateConfig(config._id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Kích hoạt
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa cấu hình</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa cấu hình này?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Hủy</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={confirmDeleteConfig}>Xóa</Button>
          </div>
        </DialogContent>
      </Dialog>

      {configs.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Chưa có cấu hình nào
            </h3>
            <p className="text-gray-500">
              Hãy tạo cấu hình test năng lực đầu tiên
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
