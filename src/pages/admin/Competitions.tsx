import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { api } from '../../services/api'

interface CompetitionItem {
  _id: string
  title: string
  description: string
  status: 'active' | 'upcoming' | 'ended'
  level: string
  participants: number
}

export const AdminCompetitions = () => {
  const [items, setItems] = useState<CompetitionItem[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await api.get('/competitions')
      setItems(res.data?.competitions || [])
    } catch {
      setItems([])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cuộc thi</h1>
        <p className="text-gray-600">Quản lý và theo dõi cuộc thi</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((c) => (
          <Card key={c._id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{c.title}</span>
                <Badge>{c.status}</Badge>
              </CardTitle>
              <CardDescription>{c.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">{c.participants} người tham gia • Cấp {c.level}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


