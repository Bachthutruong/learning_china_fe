import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { 
  ArrowLeft,
  Plus, 
  Trash2, 
  Save,
  Brain,
//   Target,
//   Award,
  ChevronDown,
  ChevronRight,
  X,
  Settings,
  Crown
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

interface Level {
  _id: string
  level?: number
  number: number
  name: string
  description: string
  requiredExperience: number
  color: string
  icon?: string
}


interface SubBranchFormData {
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
  subBranches?: SubBranchFormData[]
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
  subBranches?: SubBranchFormData[]
}

export const ProficiencyConfigForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [expandedBranches, setExpandedBranches] = useState<Set<number>>(new Set())
  const [expandedSubBranches, setExpandedSubBranches] = useState<Set<string>>(new Set())
  const [expandedSubSubBranches, setExpandedSubSubBranches] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: 50000,
    initialQuestions: [{ level: 1, count: 5 }],
    branches: [] as BranchFormData[]
  })

  useEffect(() => {
    fetchLevels()
    if (isEdit) {
      fetchConfig()
    } else {
      setLoading(false)
    }
  }, [id, isEdit])

  const fetchLevels = async () => {
    try {
      const response = await api.get('/admin/levels')
      setLevels(response.data || [])
    } catch (error) {
      console.error('Error fetching levels:', error)
      toast.error('Không thể tải danh sách cấp độ')
    }
  }

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/proficiency-configs/${id}`)
      const config = response.data.config
      setFormData({
        name: config.name,
        description: config.description,
        cost: config.cost,
        initialQuestions: config.initialQuestions,
        branches: config.branches
      })
    } catch (error) {
      console.error('Error fetching config:', error)
      toast.error('Không thể tải cấu hình')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên cấu hình')
      return
    }

    if (formData.initialQuestions.length === 0) {
      toast.error('Vui lòng thêm ít nhất một câu hỏi ban đầu')
      return
    }

    try {
      setFormLoading(true)
      
      if (isEdit) {
        await api.put(`/admin/proficiency-configs/${id}`, formData)
        toast.success('Cập nhật cấu hình thành công!')
      } else {
        await api.post('/admin/proficiency-configs', formData)
        toast.success('Tạo cấu hình thành công!')
      }
      
      navigate('/admin/proficiency-config')
    } catch (error: any) {
      console.error('Error saving config:', error)
      toast.error(error.response?.data?.message || 'Không thể lưu cấu hình')
    } finally {
      setFormLoading(false)
    }
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
      initialQuestions: prev.initialQuestions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
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
        nextQuestions: [],
        subBranches: []
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

  const addBranchNextQuestion = (branchIndex: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { ...branch, nextQuestions: [...branch.nextQuestions, { level: 1, count: 1 }] }
          : branch
      )
    }))
  }

  const removeBranchNextQuestion = (branchIndex: number, questionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { ...branch, nextQuestions: branch.nextQuestions.filter((_, j) => j !== questionIndex) }
          : branch
      )
    }))
  }

  const updateBranchNextQuestion = (branchIndex: number, questionIndex: number, field: 'level' | 'count', value: number) => {
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

  // Sub-branch functions
  const addSubBranch = (branchIndex: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { 
              ...branch, 
              subBranches: [...(branch.subBranches || []), {
                name: '',
                condition: {
                  correctRange: [0, 0],
                  fromPhase: 'initial'
                },
                nextQuestions: [],
                subBranches: []
              }]
            }
          : branch
      )
    }))
  }

  const removeSubBranch = (branchIndex: number, subBranchIndex: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { 
              ...branch, 
              subBranches: branch.subBranches?.filter((_, j) => j !== subBranchIndex) || []
            }
          : branch
      )
    }))
  }

  const updateSubBranch = (branchIndex: number, subBranchIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { 
              ...branch, 
              subBranches: branch.subBranches?.map((subBranch, j) => 
                j === subBranchIndex ? { ...subBranch, [field]: value } : subBranch
              ) || []
            }
          : branch
      )
    }))
  }

  const addSubBranchNextQuestion = (branchIndex: number, subBranchIndex: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { 
              ...branch, 
              subBranches: branch.subBranches?.map((subBranch, j) => 
                j === subBranchIndex 
                  ? { ...subBranch, nextQuestions: [...subBranch.nextQuestions, { level: 1, count: 1 }] }
                  : subBranch
              ) || []
            }
          : branch
      )
    }))
  }

  const removeSubBranchNextQuestion = (branchIndex: number, subBranchIndex: number, questionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { 
              ...branch, 
              subBranches: branch.subBranches?.map((subBranch, j) => 
                j === subBranchIndex 
                  ? { ...subBranch, nextQuestions: subBranch.nextQuestions.filter((_, k) => k !== questionIndex) }
                  : subBranch
              ) || []
            }
          : branch
      )
    }))
  }

  const updateSubBranchNextQuestion = (branchIndex: number, subBranchIndex: number, questionIndex: number, field: 'level' | 'count', value: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { 
              ...branch, 
              subBranches: branch.subBranches?.map((subBranch, j) => 
                j === subBranchIndex 
                  ? { 
                      ...subBranch, 
                      nextQuestions: subBranch.nextQuestions.map((q, k) => 
                        k === questionIndex ? { ...q, [field]: value } : q
                      )
                    }
                  : subBranch
              ) || []
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

  const toggleSubBranchExpansion = (branchIndex: number, subBranchIndex: number) => {
    const key = `${branchIndex}-${subBranchIndex}`
    const newExpanded = new Set(expandedSubBranches)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedSubBranches(newExpanded)
  }

  // Sub-Sub-Branch functions for unlimited recursion
  const addSubSubBranch = (branchIndex: number, subBranchIndex: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { 
              ...branch, 
              subBranches: branch.subBranches?.map((subBranch, j) => 
                j === subBranchIndex 
                  ? { 
                      ...subBranch, 
                      subBranches: [...(subBranch.subBranches || []), {
                        name: '',
                        condition: {
                          correctRange: [0, 0],
                          fromPhase: 'initial'
                        },
                        nextQuestions: [],
                        subBranches: []
                      }]
                    }
                  : subBranch
              ) || []
            }
          : branch
      )
    }))
  }

  const removeSubSubBranch = (branchIndex: number, subBranchIndex: number, subSubBranchIndex: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { 
              ...branch, 
              subBranches: branch.subBranches?.map((subBranch, j) => 
                j === subBranchIndex 
                  ? { 
                      ...subBranch, 
                      subBranches: subBranch.subBranches?.filter((_, k) => k !== subSubBranchIndex) || []
                    }
                  : subBranch
              ) || []
            }
          : branch
      )
    }))
  }

  const updateSubSubBranch = (branchIndex: number, subBranchIndex: number, subSubBranchIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { 
              ...branch, 
              subBranches: branch.subBranches?.map((subBranch, j) => 
                j === subBranchIndex 
                  ? { 
                      ...subBranch, 
                      subBranches: subBranch.subBranches?.map((subSubBranch, k) => 
                        k === subSubBranchIndex ? { ...subSubBranch, [field]: value } : subSubBranch
                      ) || []
                    }
                  : subBranch
              ) || []
            }
          : branch
      )
    }))
  }

  const addSubSubBranchNextQuestion = (branchIndex: number, subBranchIndex: number, subSubBranchIndex: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { 
              ...branch, 
              subBranches: branch.subBranches?.map((subBranch, j) => 
                j === subBranchIndex 
                  ? { 
                      ...subBranch, 
                      subBranches: subBranch.subBranches?.map((subSubBranch, k) => 
                        k === subSubBranchIndex 
                          ? { ...subSubBranch, nextQuestions: [...subSubBranch.nextQuestions, { level: 1, count: 1 }] }
                          : subSubBranch
                      ) || []
                    }
                  : subBranch
              ) || []
            }
          : branch
      )
    }))
  }

  const removeSubSubBranchNextQuestion = (branchIndex: number, subBranchIndex: number, subSubBranchIndex: number, questionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { 
              ...branch, 
              subBranches: branch.subBranches?.map((subBranch, j) => 
                j === subBranchIndex 
                  ? { 
                      ...subBranch, 
                      subBranches: subBranch.subBranches?.map((subSubBranch, k) => 
                        k === subSubBranchIndex 
                          ? { ...subSubBranch, nextQuestions: subSubBranch.nextQuestions.filter((_, l) => l !== questionIndex) }
                          : subSubBranch
                      ) || []
                    }
                  : subBranch
              ) || []
            }
          : branch
      )
    }))
  }

  const updateSubSubBranchNextQuestion = (branchIndex: number, subBranchIndex: number, subSubBranchIndex: number, questionIndex: number, field: 'level' | 'count', value: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === branchIndex 
          ? { 
              ...branch, 
              subBranches: branch.subBranches?.map((subBranch, j) => 
                j === subBranchIndex 
                  ? { 
                      ...subBranch, 
                      subBranches: subBranch.subBranches?.map((subSubBranch, k) => 
                        k === subSubBranchIndex 
                          ? { 
                              ...subSubBranch, 
                              nextQuestions: subSubBranch.nextQuestions.map((q, l) => 
                                l === questionIndex ? { ...q, [field]: value } : q
                              )
                            }
                          : subSubBranch
                      ) || []
                    }
                  : subBranch
              ) || []
            }
          : branch
      )
    }))
  }

  const toggleSubSubBranchExpansion = (branchIndex: number, subBranchIndex: number, subSubBranchIndex: number) => {
    const key = `${branchIndex}-${subBranchIndex}-${subSubBranchIndex}`
    const newExpanded = new Set(expandedSubSubBranches)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedSubSubBranches(newExpanded)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/proficiency-config')}
              className="mb-6 bg-white/50 hover:bg-white/70 border-2 border-blue-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Quay lại
            </Button>
            
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {isEdit ? '✏️ Chỉnh sửa cấu hình' : '➕ Tạo cấu hình mới'}
                </h1>
                <div className="absolute -top-2 -right-2">
                  <Settings className="h-8 w-8 text-blue-400 animate-bounce" />
                </div>
                <div className="absolute -bottom-2 -left-2">
                  <Brain className="h-6 w-6 text-purple-400 animate-pulse" />
                </div>
              </div>
              <p className="text-xl text-gray-700 font-medium">
                {isEdit ? 'Chỉnh sửa cấu hình test năng lực' : 'Tạo cấu hình test năng lực mới'}
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-white/20 rounded-full">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <span>{isEdit ? 'Chỉnh sửa cấu hình' : 'Tạo cấu hình mới'}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Crown className="h-4 w-4 text-yellow-300" />
                    <span className="text-sm text-blue-100">Test năng lực</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên cấu hình *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ví dụ: Cấu hình Test Năng lực Cơ bản"
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, cost: parseInt(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                      Thêm câu hỏi
                    </Button>
                  </div>
                  {formData.initialQuestions.map((question, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg bg-blue-50">
                      <div className="flex-1">
                        <Label>Cấp độ</Label>
                        <select
                          className="w-full p-2 border rounded-lg"
                          value={question.level}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateInitialQuestion(index, 'level', parseInt(e.target.value))}
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
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInitialQuestion(index, 'count', parseInt(e.target.value))}
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
                    <Card key={branchIndex} className="border border-purple-200 bg-purple-50">
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBranch(branchIndex, 'name', e.target.value)}
                                placeholder="Ví dụ: Đúng 1-4 câu"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Giai đoạn</Label>
                              <select
                                className="w-full p-2 border rounded-lg"
                                value={branch.condition.fromPhase}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateBranch(branchIndex, 'condition', {
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBranch(branchIndex, 'condition', {
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBranch(branchIndex, 'condition', {
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
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateBranch(branchIndex, 'resultLevel', 
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
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateBranch(branchIndex, 'nextPhase', 
                                  e.target.value || undefined
                                )}
                              >
                                <option value="">Kết thúc</option>
                                <option value="followup">Theo dõi</option>
                                <option value="final">Cuối cùng</option>
                              </select>
                            </div>
                          </div>

                          {/* Branch Next Questions */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Câu hỏi tiếp theo</Label>
                              <Button
                                type="button"
                                onClick={() => addBranchNextQuestion(branchIndex)}
                                size="sm"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Thêm
                              </Button>
                            </div>
                            {branch.nextQuestions.map((question, questionIndex) => (
                              <div key={questionIndex} className="flex items-center gap-4 p-3 border rounded-lg bg-white">
                                <div className="flex-1">
                                  <Label>Cấp độ</Label>
                                  <select
                                    className="w-full p-2 border rounded-lg"
                                    value={question.level}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateBranchNextQuestion(branchIndex, questionIndex, 'level', parseInt(e.target.value))}
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
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBranchNextQuestion(branchIndex, questionIndex, 'count', parseInt(e.target.value))}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeBranchNextQuestion(branchIndex, questionIndex)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          {/* Sub Branches */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-lg font-semibold">Nhánh con</Label>
                              <Button
                                type="button"
                                onClick={() => addSubBranch(branchIndex)}
                                size="sm"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Thêm nhánh con
                              </Button>
                            </div>
                            {(branch.subBranches || []).map((subBranch, subBranchIndex) => (
                              <Card key={subBranchIndex} className="border border-blue-200 bg-blue-50">
                                <CardHeader>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleSubBranchExpansion(branchIndex, subBranchIndex)}
                                      >
                                        {expandedSubBranches.has(`${branchIndex}-${subBranchIndex}`) ? 
                                          <ChevronDown className="h-4 w-4" /> : 
                                          <ChevronRight className="h-4 w-4" />
                                        }
                                      </Button>
                                      <Label className="text-lg font-semibold">Nhánh con {subBranchIndex + 1}</Label>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeSubBranch(branchIndex, subBranchIndex)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardHeader>
                                {expandedSubBranches.has(`${branchIndex}-${subBranchIndex}`) && (
                                  <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>Tên nhánh con</Label>
                                        <Input
                                          value={subBranch.name}
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSubBranch(branchIndex, subBranchIndex, 'name', e.target.value)}
                                          placeholder="Ví dụ: Đúng 1-3 câu con"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Giai đoạn</Label>
                                        <select
                                          className="w-full p-2 border rounded-lg"
                                          value={subBranch.condition.fromPhase}
                                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSubBranch(branchIndex, subBranchIndex, 'condition', {
                                            ...subBranch.condition,
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
                                          value={subBranch.condition.correctRange[0]}
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSubBranch(branchIndex, subBranchIndex, 'condition', {
                                            ...subBranch.condition,
                                            correctRange: [parseInt(e.target.value), subBranch.condition.correctRange[1]]
                                          })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Số câu đúng tối đa</Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          value={subBranch.condition.correctRange[1]}
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSubBranch(branchIndex, subBranchIndex, 'condition', {
                                            ...subBranch.condition,
                                            correctRange: [subBranch.condition.correctRange[0], parseInt(e.target.value)]
                                          })}
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>Kết quả cuối (cấp độ)</Label>
                                        <select
                                          className="w-full p-2 border rounded-lg"
                                          value={subBranch.resultLevel || ''}
                                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSubBranch(branchIndex, subBranchIndex, 'resultLevel', 
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
                                          value={subBranch.nextPhase || ''}
                                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSubBranch(branchIndex, subBranchIndex, 'nextPhase', 
                                            e.target.value || undefined
                                          )}
                                        >
                                          <option value="">Kết thúc</option>
                                          <option value="followup">Theo dõi</option>
                                          <option value="final">Cuối cùng</option>
                                        </select>
                                      </div>
                                    </div>

                                    {/* Sub Branch Next Questions */}
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label>Câu hỏi tiếp theo</Label>
                                        <Button
                                          type="button"
                                          onClick={() => addSubBranchNextQuestion(branchIndex, subBranchIndex)}
                                          size="sm"
                                        >
                                          <Plus className="h-4 w-4 mr-1" />
                                          Thêm
                                        </Button>
                                      </div>
                                      {subBranch.nextQuestions.map((question, questionIndex) => (
                                        <div key={questionIndex} className="flex items-center gap-4 p-3 border rounded-lg bg-white">
                                          <div className="flex-1">
                                            <Label>Cấp độ</Label>
                                            <select
                                              className="w-full p-2 border rounded-lg"
                                              value={question.level}
                                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSubBranchNextQuestion(branchIndex, subBranchIndex, questionIndex, 'level', parseInt(e.target.value))}
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
                                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSubBranchNextQuestion(branchIndex, subBranchIndex, questionIndex, 'count', parseInt(e.target.value))}
                                            />
                                          </div>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeSubBranchNextQuestion(branchIndex, subBranchIndex, questionIndex)}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Sub Sub Branches - Recursive */}
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-lg font-semibold">Nhánh con</Label>
                                        <Button
                                          type="button"
                                          onClick={() => addSubSubBranch(branchIndex, subBranchIndex)}
                                          size="sm"
                                        >
                                          <Plus className="h-4 w-4 mr-1" />
                                          Thêm nhánh con
                                        </Button>
                                      </div>
                                      {(subBranch.subBranches || []).map((subSubBranch, subSubBranchIndex) => (
                                        <Card key={subSubBranchIndex} className="border border-green-200 bg-green-50">
                                          <CardHeader>
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => toggleSubSubBranchExpansion(branchIndex, subBranchIndex, subSubBranchIndex)}
                                                >
                                                  {expandedSubSubBranches.has(`${branchIndex}-${subBranchIndex}-${subSubBranchIndex}`) ? 
                                                    <ChevronDown className="h-4 w-4" /> : 
                                                    <ChevronRight className="h-4 w-4" />
                                                  }
                                                </Button>
                                                <Label className="text-lg font-semibold">Nhánh con {subSubBranchIndex + 1}</Label>
                                              </div>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeSubSubBranch(branchIndex, subBranchIndex, subSubBranchIndex)}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </CardHeader>
                                          {expandedSubSubBranches.has(`${branchIndex}-${subBranchIndex}-${subSubBranchIndex}`) && (
                                            <CardContent className="space-y-4">
                                              <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                  <Label>Tên nhánh con</Label>
                                                  <Input
                                                    value={subSubBranch.name}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSubSubBranch(branchIndex, subBranchIndex, subSubBranchIndex, 'name', e.target.value)}
                                                    placeholder="Ví dụ: Đúng 1-2 câu con con"
                                                  />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label>Giai đoạn</Label>
                                                  <select
                                                    className="w-full p-2 border rounded-lg"
                                                    value={subSubBranch.condition.fromPhase}
                                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSubSubBranch(branchIndex, subBranchIndex, subSubBranchIndex, 'condition', {
                                                      ...subSubBranch.condition,
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
                                                    value={subSubBranch.condition.correctRange[0]}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSubSubBranch(branchIndex, subBranchIndex, subSubBranchIndex, 'condition', {
                                                      ...subSubBranch.condition,
                                                      correctRange: [parseInt(e.target.value), subSubBranch.condition.correctRange[1]]
                                                    })}
                                                  />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label>Số câu đúng tối đa</Label>
                                                  <Input
                                                    type="number"
                                                    min="0"
                                                    value={subSubBranch.condition.correctRange[1]}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSubSubBranch(branchIndex, subBranchIndex, subSubBranchIndex, 'condition', {
                                                      ...subSubBranch.condition,
                                                      correctRange: [subSubBranch.condition.correctRange[0], parseInt(e.target.value)]
                                                    })}
                                                  />
                                                </div>
                                              </div>

                                              <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                  <Label>Kết quả cuối (cấp độ)</Label>
                                                  <select
                                                    className="w-full p-2 border rounded-lg"
                                                    value={subSubBranch.resultLevel || ''}
                                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSubSubBranch(branchIndex, subBranchIndex, subSubBranchIndex, 'resultLevel', 
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
                                                    value={subSubBranch.nextPhase || ''}
                                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSubSubBranch(branchIndex, subBranchIndex, subSubBranchIndex, 'nextPhase', 
                                                      e.target.value || undefined
                                                    )}
                                                  >
                                                    <option value="">Kết thúc</option>
                                                    <option value="followup">Theo dõi</option>
                                                    <option value="final">Cuối cùng</option>
                                                  </select>
                                                </div>
                                              </div>

                                              {/* Sub Sub Branch Next Questions */}
                                              <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                  <Label>Câu hỏi tiếp theo</Label>
                                                  <Button
                                                    type="button"
                                                    onClick={() => addSubSubBranchNextQuestion(branchIndex, subBranchIndex, subSubBranchIndex)}
                                                    size="sm"
                                                  >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Thêm
                                                  </Button>
                                                </div>
                                                {subSubBranch.nextQuestions.map((question, questionIndex) => (
                                                  <div key={questionIndex} className="flex items-center gap-4 p-3 border rounded-lg bg-white">
                                                    <div className="flex-1">
                                                      <Label>Cấp độ</Label>
                                                      <select
                                                        className="w-full p-2 border rounded-lg"
                                                        value={question.level}
                                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSubSubBranchNextQuestion(branchIndex, subBranchIndex, subSubBranchIndex, questionIndex, 'level', parseInt(e.target.value))}
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
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSubSubBranchNextQuestion(branchIndex, subBranchIndex, subSubBranchIndex, questionIndex, 'count', parseInt(e.target.value))}
                                                      />
                                                    </div>
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => removeSubSubBranchNextQuestion(branchIndex, subBranchIndex, subSubBranchIndex, questionIndex)}
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
                                  </CardContent>
                                )}
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/proficiency-config')}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {isEdit ? 'Cập nhật cấu hình' : 'Tạo cấu hình'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
