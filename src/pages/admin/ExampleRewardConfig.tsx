import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Loader2, Save, Coins } from 'lucide-react'
import toast from 'react-hot-toast'

export const ExampleRewardConfig = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    rewardContributor: 0,
    rewardReviewer: 0
  })

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const res = await api.get('/vocabulary-examples/admin/config')
      if (res.data && res.data.config) {
        setConfig({
          rewardContributor: res.data.config.rewardContributor || 0,
          rewardReviewer: res.data.config.rewardReviewer || 0
        })
      }
    } catch (error) {
      console.error('Fetch config error:', error)
      toast.error('Không thể tải cấu hình thưởng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.put('/vocabulary-examples/admin/config', config)
      toast.success('Cập nhật cấu hình thưởng thành công')
    } catch (error) {
      console.error('Update config error:', error)
      toast.error('Cập nhật cấu hình thưởng thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
            <Coins className="h-6 w-6" />
          </div>
          Cấu hình thưởng đóng góp
        </h2>
        <p className="text-gray-500 font-medium mt-2">Thiết lập số lượng xu thưởng cho người đóng góp và người duyệt ví dụ.</p>
      </div>

      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100">
          <CardTitle className="text-xl font-bold text-indigo-900">Thiết lập Xu Thưởng</CardTitle>
          <CardDescription>Số xu này sẽ được cộng tự động khi một ví dụ được duyệt.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <Coins className="h-5 w-5" />
                  </div>
                  <Label htmlFor="rewardContributor" className="text-lg font-bold text-gray-700">Người đóng góp</Label>
                </div>
                <Input
                  id="rewardContributor"
                  type="number"
                  min="0"
                  value={config.rewardContributor}
                  onChange={(e) => setConfig({ ...config, rewardContributor: Number(e.target.value) })}
                  className="h-12 text-lg font-medium border-gray-200 focus:ring-primary focus:border-primary rounded-xl"
                  placeholder="Nhập số xu thưởng..."
                />
                <p className="text-sm text-gray-400">Số xu được cộng cho thành viên gửi ví dụ khi được phê duyệt.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Coins className="h-5 w-5" />
                  </div>
                  <Label htmlFor="rewardReviewer" className="text-lg font-bold text-gray-700">Người kiểm duyệt</Label>
                </div>
                <Input
                  id="rewardReviewer"
                  type="number"
                  min="0"
                  value={config.rewardReviewer}
                  onChange={(e) => setConfig({ ...config, rewardReviewer: Number(e.target.value) })}
                  className="h-12 text-lg font-medium border-gray-200 focus:ring-primary focus:border-primary rounded-xl"
                  placeholder="Nhập số xu thưởng..."
                />
                <p className="text-sm text-gray-400">Số xu được cộng cho người thực hiện thao tác duyệt ví dụ.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <Button 
                type="submit" 
                disabled={saving}
                className="h-12 px-8 rounded-xl chinese-gradient font-bold text-white shadow-lg hover:scale-105 transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Lưu cấu hình
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
        <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
          <Coins className="h-5 w-5" /> Lưu ý về hệ thống thưởng
        </h4>
        <ul className="text-amber-800 text-sm space-y-1 ml-7 list-disc">
          <li>Xu thưởng sẽ được cộng ngay lập tức khi trạng thái đóng góp chuyển sang "Đã duyệt".</li>
          <li>Thành viên có thể xem lịch sử nhận xu trong phần Lịch sử giao dịch.</li>
          <li>Việc chỉnh sửa số xu thưởng chỉ áp dụng cho các lượt duyệt sau khi lưu.</li>
        </ul>
      </div>
    </div>
  )
}
