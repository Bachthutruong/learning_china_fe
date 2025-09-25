import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

interface ReportItem {
  _id: string
  itemType: string
  itemId: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export const AdminReports = () => {
  const [reports, setReports] = useState<ReportItem[]>([])
  const [rewardXp, setRewardXp] = useState<Record<string, number>>({})
  const [rewardCoins, setRewardCoins] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports/admin/all')
      setReports(res.data?.reports || res.data || [])
    } catch {
      setReports([])
    }
  }

  const updateReport = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const xp = rewardXp[id] || 0
      const coins = rewardCoins[id] || 0
      await api.put(`/reports/admin/${id}`, {
        status,
        rewardExperience: status === 'approved' ? xp : 0,
        rewardCoins: status === 'approved' ? coins : 0
      })
      toast.success('Cập nhật báo cáo thành công')
      fetchReports()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Cập nhật thất bại')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Báo cáo</h1>
          <p className="text-gray-600">Danh sách báo cáo từ người dùng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reports.map((r) => (
          <Card key={r._id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>{r.itemType}</span>
                <Badge variant={r.status === 'pending' ? 'secondary' : 'outline'}>{r.status}</Badge>
              </CardTitle>
              <CardDescription>{new Date(r.createdAt).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 whitespace-pre-wrap">{r.content}</p>
              {r.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="XP"
                    className="w-28"
                    value={rewardXp[r._id] ?? ''}
                    onChange={(e) => setRewardXp({ ...rewardXp, [r._id]: Number(e.target.value) })}
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Xu"
                    className="w-28"
                    value={rewardCoins[r._id] ?? ''}
                    onChange={(e) => setRewardCoins({ ...rewardCoins, [r._id]: Number(e.target.value) })}
                  />
                  <Button onClick={() => updateReport(r._id, 'approved')}>Duyệt</Button>
                  <Button variant="outline" onClick={() => updateReport(r._id, 'rejected')}>Bỏ qua</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {reports.length === 0 && (
          <Card className="lg:col-span-2">
            <CardContent className="py-12 text-center text-gray-500">Chưa có báo cáo</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


