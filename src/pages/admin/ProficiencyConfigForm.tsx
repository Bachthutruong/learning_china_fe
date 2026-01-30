import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { ArrowLeft, Plus, Trash2, Save, Brain, Loader2, ChevronRight, Settings, Crown, X } from 'lucide-react'
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

  // Sub-Sub-Branch functions
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

  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10" /></div>

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/proficiency-config')} className="w-10 h-10 rounded-xl bg-white border border-gray-100"><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-3xl font-black">{isEdit ? 'Hiệu chỉnh' : 'Thiết lập'} kịch bản</h1>
        </div>
        <Button onClick={handleSubmit} disabled={formLoading} className="chinese-gradient h-11 px-8 rounded-xl font-black text-white">{formLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Lưu cấu hình</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* General Info */}
          <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-xl space-y-6">
            <h3 className="text-xl font-black flex items-center"><div className="w-2 h-6 chinese-gradient rounded-full mr-3" /> Thông tin chung</h3>
            <div className="space-y-4">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Tên kịch bản</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-12 rounded-xl" required /></div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Mô tả thuật toán</Label><Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="min-h-[100px] rounded-2xl" /></div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Lệ phí (Xu)</Label><Input type="number" value={formData.cost} onChange={e => setFormData({ ...formData, cost: parseInt(e.target.value) })} className="h-12 rounded-xl text-amber-500 font-black" /></div>
            </div>
          </div>

          {/* Initial Questions */}
          <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black">Giai đoạn Initial</h3>
              <Button type="button" onClick={addInitialQuestion} variant="outline" size="sm" className="rounded-xl font-black text-[10px]"><Plus className="w-3 h-3 mr-1" /> Thêm cấp độ</Button>
            </div>
            <div className="space-y-4">
              {formData.initialQuestions.map((q, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 group">
                  <div className="flex-1"><Label className="text-[8px] font-black uppercase text-gray-400">HSK</Label><select className="w-full h-10 px-3 bg-white border rounded-xl font-bold" value={q.level} onChange={e => updateInitialQuestion(idx, 'level', parseInt(e.target.value))}>{levels.map(l => <option key={l._id} value={l.level || l.number}>Level {l.level || l.number}</option>)}</select></div>
                  <div className="flex-1"><Label className="text-[8px] font-black uppercase text-gray-400">Số lượng</Label><Input type="number" value={q.count} onChange={e => updateInitialQuestion(idx, 'count', parseInt(e.target.value))} className="h-10 rounded-xl" /></div>
                  <Button type="button" variant="ghost" onClick={() => removeInitialQuestion(idx)} className="mt-4 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </div>

          {/* Branches */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black">Cấu trúc phân nhánh</h3>
              <Button type="button" onClick={addBranch} className="chinese-gradient h-9 px-5 rounded-xl font-black text-[10px] text-white">Tạo nhánh</Button>
            </div>
            {formData.branches.map((branch, bIdx) => (
              <div key={bIdx} className="bg-white rounded-[3rem] border overflow-hidden">
                <div className="p-6 bg-gray-50/50 flex items-center justify-between border-b">
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => toggleBranchExpansion(bIdx)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${expandedBranches.has(bIdx) ? 'chinese-gradient text-white rotate-90' : 'bg-white text-gray-400'}`}><ChevronRight className="w-5 h-5" /></button>
                    <span className="text-sm font-black">Nhánh #{bIdx + 1}: {branch.name || '(Chưa đặt tên)'}</span>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => removeBranch(bIdx)} className="hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                </div>
                {expandedBranches.has(bIdx) && (
                  <div className="p-8 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Tên nhánh</Label><Input value={branch.name} onChange={e => updateBranch(bIdx, 'name', e.target.value)} className="h-11 rounded-xl" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Giai đoạn kích hoạt</Label><select className="w-full h-11 px-3 bg-gray-50 border rounded-xl font-bold text-xs" value={branch.condition.fromPhase} onChange={e => updateBranch(bIdx, 'condition', { ...branch.condition, fromPhase: e.target.value })}><option value="initial">Initial</option><option value="followup">Follow-up</option><option value="final">Final</option></select></div>
                    </div>
                    <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Điều kiện (Số câu đúng)</Label><div className="flex gap-4"><Input type="number" value={branch.condition.correctRange[0]} onChange={e => updateBranch(bIdx, 'condition', { ...branch.condition, correctRange: [parseInt(e.target.value), branch.condition.correctRange[1]] })} className="h-10 text-center" /><Input type="number" value={branch.condition.correctRange[1]} onChange={e => updateBranch(bIdx, 'condition', { ...branch.condition, correctRange: [branch.condition.correctRange[0], parseInt(e.target.value)] })} className="h-10 text-center" /></div></div>
                    <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                      <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Cấp độ kết luận</Label><select className="w-full h-11 bg-gray-50 border rounded-xl text-primary font-bold" value={branch.resultLevel || ''} onChange={e => updateBranch(bIdx, 'resultLevel', e.target.value ? parseInt(e.target.value) : undefined)}><option value="">Tiếp tục khảo sát</option>{levels.map(l => <option key={l._id} value={l.level || l.number}>Level {l.level || l.number}</option>)}</select></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Giai đoạn tiếp theo</Label><select className="w-full h-11 bg-gray-50 border rounded-xl font-bold" value={branch.nextPhase || ''} onChange={e => updateBranch(bIdx, 'nextPhase', e.target.value || undefined)}><option value="">Kết thúc</option><option value="followup">Follow-up</option><option value="final">Final</option></select></div>
                    </div>

                    {/* Branch Next Questions */}
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black text-gray-400 uppercase">Câu hỏi tiếp theo</Label>
                        <Button type="button" onClick={() => addBranchNextQuestion(bIdx)} variant="outline" size="sm" className="rounded-xl font-black text-[10px]"><Plus className="w-3 h-3 mr-1" /> Thêm</Button>
                      </div>
                      {branch.nextQuestions.map((question, qIdx) => (
                        <div key={qIdx} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                          <div className="flex-1"><Label className="text-[8px] font-black uppercase text-gray-400">Cấp độ</Label><select className="w-full h-10 px-3 bg-white border rounded-xl font-bold" value={question.level} onChange={e => updateBranchNextQuestion(bIdx, qIdx, 'level', parseInt(e.target.value))}>{levels.map(l => <option key={l._id} value={l.level || l.number}>Level {l.level || l.number}</option>)}</select></div>
                          <div className="flex-1"><Label className="text-[8px] font-black uppercase text-gray-400">Số câu</Label><Input type="number" min="1" value={question.count} onChange={e => updateBranchNextQuestion(bIdx, qIdx, 'count', parseInt(e.target.value))} className="h-10 rounded-xl" /></div>
                          <Button type="button" variant="ghost" onClick={() => removeBranchNextQuestion(bIdx, qIdx)} className="mt-4 hover:text-red-500"><X className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </div>

                    {/* Sub Branches */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black text-gray-400 uppercase">Nhánh con</Label>
                        <Button type="button" onClick={() => addSubBranch(bIdx)} variant="outline" size="sm" className="rounded-xl font-black text-[10px]"><Plus className="w-3 h-3 mr-1" /> Thêm nhánh con</Button>
                      </div>
                      {(branch.subBranches || []).map((subBranch, sbIdx) => (
                        <div key={sbIdx} className="bg-blue-50/50 rounded-[2rem] border border-blue-100 overflow-hidden">
                          <div className="p-4 bg-blue-50 flex items-center justify-between border-b border-blue-100">
                            <div className="flex items-center gap-3">
                              <button type="button" onClick={() => toggleSubBranchExpansion(bIdx, sbIdx)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${expandedSubBranches.has(`${bIdx}-${sbIdx}`) ? 'bg-blue-500 text-white rotate-90' : 'bg-white text-gray-400'}`}><ChevronRight className="w-4 h-4" /></button>
                              <span className="text-xs font-black">Nhánh con #{sbIdx + 1}: {subBranch.name || '(Chưa đặt tên)'}</span>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeSubBranch(bIdx, sbIdx)} className="hover:text-red-500"><Trash2 className="w-3 h-3" /></Button>
                          </div>
                          {expandedSubBranches.has(`${bIdx}-${sbIdx}`) && (
                            <div className="p-6 space-y-4">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Tên nhánh con</Label><Input value={subBranch.name} onChange={e => updateSubBranch(bIdx, sbIdx, 'name', e.target.value)} className="h-10 rounded-xl" /></div>
                                <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Giai đoạn</Label><select className="w-full h-10 px-3 bg-white border rounded-xl font-bold text-xs" value={subBranch.condition.fromPhase} onChange={e => updateSubBranch(bIdx, sbIdx, 'condition', { ...subBranch.condition, fromPhase: e.target.value })}><option value="initial">Initial</option><option value="followup">Follow-up</option><option value="final">Final</option></select></div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Số câu đúng tối thiểu</Label><Input type="number" min="0" value={subBranch.condition.correctRange[0]} onChange={e => updateSubBranch(bIdx, sbIdx, 'condition', { ...subBranch.condition, correctRange: [parseInt(e.target.value), subBranch.condition.correctRange[1]] })} className="h-10 text-center" /></div>
                                <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Số câu đúng tối đa</Label><Input type="number" min="0" value={subBranch.condition.correctRange[1]} onChange={e => updateSubBranch(bIdx, sbIdx, 'condition', { ...subBranch.condition, correctRange: [subBranch.condition.correctRange[0], parseInt(e.target.value)] })} className="h-10 text-center" /></div>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Cấp độ kết luận</Label><select className="w-full h-10 bg-gray-50 border rounded-xl text-primary font-bold" value={subBranch.resultLevel || ''} onChange={e => updateSubBranch(bIdx, sbIdx, 'resultLevel', e.target.value ? parseInt(e.target.value) : undefined)}><option value="">Tiếp tục khảo sát</option>{levels.map(l => <option key={l._id} value={l.level || l.number}>Level {l.level || l.number}</option>)}</select></div>
                                <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Giai đoạn tiếp theo</Label><select className="w-full h-10 bg-gray-50 border rounded-xl font-bold" value={subBranch.nextPhase || ''} onChange={e => updateSubBranch(bIdx, sbIdx, 'nextPhase', e.target.value || undefined)}><option value="">Kết thúc</option><option value="followup">Follow-up</option><option value="final">Final</option></select></div>
                              </div>

                              {/* Sub Branch Next Questions */}
                              <div className="space-y-3 pt-4 border-t border-blue-100">
                                <div className="flex justify-between items-center">
                                  <Label className="text-[10px] font-black text-gray-400 uppercase">Câu hỏi tiếp theo</Label>
                                  <Button type="button" onClick={() => addSubBranchNextQuestion(bIdx, sbIdx)} variant="outline" size="sm" className="rounded-xl font-black text-[10px]"><Plus className="w-3 h-3 mr-1" /> Thêm</Button>
                                </div>
                                {subBranch.nextQuestions.map((question, qIdx) => (
                                  <div key={qIdx} className="flex items-center gap-4 p-3 rounded-xl bg-white border border-gray-100">
                                    <div className="flex-1"><Label className="text-[8px] font-black uppercase text-gray-400">Cấp độ</Label><select className="w-full h-9 px-3 bg-gray-50 border rounded-lg font-bold text-xs" value={question.level} onChange={e => updateSubBranchNextQuestion(bIdx, sbIdx, qIdx, 'level', parseInt(e.target.value))}>{levels.map(l => <option key={l._id} value={l.level || l.number}>Level {l.level || l.number}</option>)}</select></div>
                                    <div className="flex-1"><Label className="text-[8px] font-black uppercase text-gray-400">Số câu</Label><Input type="number" min="1" value={question.count} onChange={e => updateSubBranchNextQuestion(bIdx, sbIdx, qIdx, 'count', parseInt(e.target.value))} className="h-9 rounded-lg" /></div>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSubBranchNextQuestion(bIdx, sbIdx, qIdx)} className="mt-4 hover:text-red-500"><X className="w-3 h-3" /></Button>
                                  </div>
                                ))}
                              </div>

                              {/* Sub Sub Branches */}
                              <div className="space-y-3 pt-4 border-t border-blue-100">
                                <div className="flex justify-between items-center">
                                  <Label className="text-[10px] font-black text-gray-400 uppercase">Nhánh con</Label>
                                  <Button type="button" onClick={() => addSubSubBranch(bIdx, sbIdx)} variant="outline" size="sm" className="rounded-xl font-black text-[10px]"><Plus className="w-3 h-3 mr-1" /> Thêm nhánh con</Button>
                                </div>
                                {(subBranch.subBranches || []).map((subSubBranch, ssbIdx) => (
                                  <div key={ssbIdx} className="bg-green-50/50 rounded-2xl border border-green-100 overflow-hidden">
                                    <div className="p-3 bg-green-50 flex items-center justify-between border-b border-green-100">
                                      <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => toggleSubSubBranchExpansion(bIdx, sbIdx, ssbIdx)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${expandedSubSubBranches.has(`${bIdx}-${sbIdx}-${ssbIdx}`) ? 'bg-green-500 text-white rotate-90' : 'bg-white text-gray-400'}`}><ChevronRight className="w-3 h-3" /></button>
                                        <span className="text-[10px] font-black">Nhánh con #{ssbIdx + 1}: {subSubBranch.name || '(Chưa đặt tên)'}</span>
                                      </div>
                                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSubSubBranch(bIdx, sbIdx, ssbIdx)} className="hover:text-red-500 h-7 w-7 p-0"><Trash2 className="w-3 h-3" /></Button>
                                    </div>
                                    {expandedSubSubBranches.has(`${bIdx}-${sbIdx}-${ssbIdx}`) && (
                                      <div className="p-5 space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Tên nhánh con</Label><Input value={subSubBranch.name} onChange={e => updateSubSubBranch(bIdx, sbIdx, ssbIdx, 'name', e.target.value)} className="h-9 rounded-xl text-xs" /></div>
                                          <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Giai đoạn</Label><select className="w-full h-9 px-3 bg-white border rounded-xl font-bold text-xs" value={subSubBranch.condition.fromPhase} onChange={e => updateSubSubBranch(bIdx, sbIdx, ssbIdx, 'condition', { ...subSubBranch.condition, fromPhase: e.target.value })}><option value="initial">Initial</option><option value="followup">Follow-up</option><option value="final">Final</option></select></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Số câu đúng tối thiểu</Label><Input type="number" min="0" value={subSubBranch.condition.correctRange[0]} onChange={e => updateSubSubBranch(bIdx, sbIdx, ssbIdx, 'condition', { ...subSubBranch.condition, correctRange: [parseInt(e.target.value), subSubBranch.condition.correctRange[1]] })} className="h-9 text-center" /></div>
                                          <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Số câu đúng tối đa</Label><Input type="number" min="0" value={subSubBranch.condition.correctRange[1]} onChange={e => updateSubSubBranch(bIdx, sbIdx, ssbIdx, 'condition', { ...subSubBranch.condition, correctRange: [subSubBranch.condition.correctRange[0], parseInt(e.target.value)] })} className="h-9 text-center" /></div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Cấp độ kết luận</Label><select className="w-full h-9 bg-gray-50 border rounded-xl text-primary font-bold text-xs" value={subSubBranch.resultLevel || ''} onChange={e => updateSubSubBranch(bIdx, sbIdx, ssbIdx, 'resultLevel', e.target.value ? parseInt(e.target.value) : undefined)}><option value="">Tiếp tục khảo sát</option>{levels.map(l => <option key={l._id} value={l.level || l.number}>Level {l.level || l.number}</option>)}</select></div>
                                          <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400">Giai đoạn tiếp theo</Label><select className="w-full h-9 bg-gray-50 border rounded-xl font-bold text-xs" value={subSubBranch.nextPhase || ''} onChange={e => updateSubSubBranch(bIdx, sbIdx, ssbIdx, 'nextPhase', e.target.value || undefined)}><option value="">Kết thúc</option><option value="followup">Follow-up</option><option value="final">Final</option></select></div>
                                        </div>

                                        {/* Sub Sub Branch Next Questions */}
                                        <div className="space-y-2 pt-3 border-t border-green-100">
                                          <div className="flex justify-between items-center">
                                            <Label className="text-[10px] font-black text-gray-400 uppercase">Câu hỏi tiếp theo</Label>
                                            <Button type="button" onClick={() => addSubSubBranchNextQuestion(bIdx, sbIdx, ssbIdx)} variant="outline" size="sm" className="rounded-lg font-black text-[8px]"><Plus className="w-3 h-3 mr-1" /> Thêm</Button>
                                          </div>
                                          {subSubBranch.nextQuestions.map((question, qIdx) => (
                                            <div key={qIdx} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100">
                                              <div className="flex-1"><Label className="text-[8px] font-black uppercase text-gray-400">Cấp độ</Label><select className="w-full h-8 px-2 bg-gray-50 border rounded-lg font-bold text-xs" value={question.level} onChange={e => updateSubSubBranchNextQuestion(bIdx, sbIdx, ssbIdx, qIdx, 'level', parseInt(e.target.value))}>{levels.map(l => <option key={l._id} value={l.level || l.number}>Level {l.level || l.number}</option>)}</select></div>
                                              <div className="flex-1"><Label className="text-[8px] font-black uppercase text-gray-400">Số câu</Label><Input type="number" min="1" value={question.count} onChange={e => updateSubSubBranchNextQuestion(bIdx, sbIdx, ssbIdx, qIdx, 'count', parseInt(e.target.value))} className="h-8 rounded-lg" /></div>
                                              <Button type="button" variant="ghost" size="sm" onClick={() => removeSubSubBranchNextQuestion(bIdx, sbIdx, ssbIdx, qIdx)} className="mt-4 hover:text-red-500 h-6 w-6 p-0"><X className="w-3 h-3" /></Button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 chinese-gradient opacity-10" />
            <div className="relative z-10 space-y-8 text-center">
              <h3 className="text-xl font-black">Phân tích thuật toán</h3>
              <div className="grid gap-4">
                {[
                  { label: 'Initial Questions', val: formData.initialQuestions.reduce((acc, q) => acc + q.count, 0) + ' Câu', icon: Brain },
                  { label: 'Logical Branches', val: formData.branches.length + ' Nhánh', icon: Settings },
                  { label: 'Access Cost', val: formData.cost.toLocaleString() + ' Xu', icon: Crown }
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 p-5 rounded-[1.5rem] flex items-center justify-between">
                    <div className="flex items-center gap-3"><s.icon className="w-4 h-4 text-primary" /><span className="text-xs font-bold text-gray-400 uppercase">{s.label}</span></div>
                    <span className="text-sm font-black">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
