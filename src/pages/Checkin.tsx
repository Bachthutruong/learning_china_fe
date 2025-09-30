import { useEffect, useState } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { CheckCircle2, Flame, Gift, Sparkles } from 'lucide-react'

type Status = {
  learnedTodayCount: number
  requiredToCheckin: number
  checkedInToday: boolean
  streak: number
  daysToBonus: number
  eligible: boolean
}

export function Checkin() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStatus = async () => {
    try {
      const res = await api.get('/checkin/status')
      setStatus(res.data)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Lỗi tải trạng thái điểm danh')
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleCheckin = async () => {
    if (!status?.eligible) return
    setLoading(true)
    try {
      const res = await api.post('/checkin')
      toast.success(res.data?.message || 'Điểm danh thành công')
      await fetchStatus()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Điểm danh thất bại')
    } finally {
      setLoading(false)
    }
  }

  const progress = status ? Math.min((status.learnedTodayCount / status.requiredToCheckin) * 100, 100) : 0

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-pink-500 text-white text-xs shadow">
          <Sparkles className="w-3 h-3" />
          <span>Năng lượng học tập mỗi ngày</span>
        </div>
        <h1 className="text-3xl font-extrabold mt-2 bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
          Điểm danh hằng ngày
        </h1>
      </div>
      {!status ? (
        <div className="animate-pulse bg-white/60 backdrop-blur rounded-2xl p-6 shadow border border-white/50">Đang tải...</div>
      ) : (
        <div className="space-y-6">
          {/* Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 backdrop-blur shadow">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 via-fuchsia-50 to-pink-50" />
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Tiến độ hôm nay</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {status.learnedTodayCount}/{status.requiredToCheckin} từ vựng
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Flame className="w-4 h-4 text-orange-500 mr-1" />
                  Chuỗi: <span className="font-semibold ml-1">{status.streak}</span> ngày
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-gray-200 rounded mt-4 overflow-hidden">
                <div
                  className={`h-3 rounded bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-pink-500 transition-all duration-700`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Rewards row */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 rounded-lg bg-indigo-50 text-indigo-700 px-3 py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Học đủ 3 từ để điểm danh</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 text-emerald-700 px-3 py-2">
                  <Gift className="w-4 h-4" />
                  <span>+30 XP, +30 xu</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 text-amber-700 px-3 py-2">
                  <Flame className="w-4 h-4" />
                  <span>7 ngày liên tiếp: +50 XP, +50 xu</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleCheckin}
            disabled={!status.eligible || status.checkedInToday || loading}
            className={`w-full py-4 rounded-xl text-white font-semibold shadow-lg transition transform active:scale-[0.99] ${
              status.checkedInToday
                ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                : status.eligible
                ? 'bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-pink-600 hover:brightness-110'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {status.checkedInToday ? 'Đã điểm danh hôm nay' : status.eligible ? 'Điểm danh ngay' : 'Học đủ 3 từ để điểm danh'}
          </button>

          {/* Bonus hint */}
          {!status.checkedInToday && (
            <div className="text-center text-xs text-gray-500">
              Còn <span className="font-semibold">{status.daysToBonus}</span> ngày để nhận thưởng chuỗi.
            </div>
          )}
        </div>
      )}
    </div>
  )
}


