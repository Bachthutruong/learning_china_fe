import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { api } from '../../services/api'
import { ArrowLeft, BarChart3, Users, Trophy, Clock } from 'lucide-react'

interface LeaderRow { rank: number; name: string; score: number; timeSpent: number; rewards?: { xp: number; coins: number } }

export const AdminCompetitionStats = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  console.log('id', id, loading)
  const [comp, setComp] = useState<any>(null)
  const [rows, setRows] = useState<LeaderRow[]>([])

  useEffect(() => { fetchAll() }, [id])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [compRes, lbRes] = await Promise.all([
        api.get(`/competition/${id}`),
        api.get(`/competition/${id}/leaderboard`)
      ])
      setComp(compRes.data)
      setRows(lbRes.data?.leaderboard || [])
    } catch (e) {
      setRows([])
    } finally { setLoading(false) }
  }

  const stats = useMemo(() => {
    const count = rows.length
    const avg = count ? rows.reduce((s, r) => s + r.score, 0) / count : 0
    const max = rows.reduce((m, r) => Math.max(m, r.score || 0), 0)
    const min = rows.reduce((m, r) => Math.min(m, r.score || 100), 100)
    // buckets: 0-49, 50-69, 70-79, 80-89, 90-100
    const buckets = [0,0,0,0,0]
    rows.forEach(r => {
      const s = r.score || 0
      if (s < 50) buckets[0]++
      else if (s < 70) buckets[1]++
      else if (s < 80) buckets[2]++
      else if (s < 90) buckets[3]++
      else buckets[4]++
    })
    return { count, avg, max, min, buckets }
  }, [rows])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/competitions')}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-2xl font-bold">Thống kê cuộc thi</h1>
        </div>
        {comp && <Badge>{comp.status}</Badge>}
      </div>

      {comp && (
        <Card className="border-0 shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{comp.title}</span>
              <span className="text-sm text-gray-500">{new Date(comp.startDate).toLocaleString()} → {new Date(comp.endDate).toLocaleString()}</span>
            </CardTitle>
            <CardDescription>{comp.description}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-700 flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" /> Người tham dự</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-blue-700">{stats.count}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-700 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-emerald-600" /> Điểm trung bình</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-emerald-700">{Math.round(stats.avg)}%</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border-0">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-700 flex items-center gap-2"><Trophy className="h-4 w-4 text-fuchsia-600" /> Cao nhất</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-fuchsia-700">{Math.round(stats.max)}%</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-0">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-700 flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600" /> Thấp nhất</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-amber-700">{Math.round(stats.min)}%</div></CardContent>
        </Card>
      </div>

      {/* Distribution Bar Chart (simple) */}
      <Card>
        <CardHeader>
          <CardTitle>Phân bố điểm</CardTitle>
          <CardDescription>0-49 • 50-69 • 70-79 • 80-89 • 90-100</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 h-40">
            {stats.buckets.map((v, i) => {
              const colors = ['bg-red-400','bg-orange-400','bg-yellow-400','bg-blue-400','bg-emerald-500']
              const height = stats.count ? Math.max(6, Math.round((v / stats.count) * 140)) : 6
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className={`${colors[i]} w-10 rounded-t`} style={{ height }} />
                  <div className="text-xs text-gray-600 mt-2">{v}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader><CardTitle>Bảng xếp hạng</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Người tham dự</th>
                  <th className="py-2 pr-4">Điểm</th>
                  <th className="py-2 pr-4">Thời gian (s)</th>
                  <th className="py-2 pr-4">Phần thưởng</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2 pr-4 font-semibold">{r.rank}</td>
                    <td className="py-2 pr-4">{r.name}</td>
                    <td className="py-2 pr-4">{Math.round(r.score)}%</td>
                    <td className="py-2 pr-4">{r.timeSpent}</td>
                    <td className="py-2 pr-4">{r.rewards ? `+${r.rewards.xp} XP • +${r.rewards.coins} Xu` : '-'}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-gray-500">Chưa có người tham dự</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminCompetitionStats


