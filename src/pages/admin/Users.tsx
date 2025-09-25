import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { api } from '../../services/api'

interface UserItem {
  _id: string
  name: string
  email: string
  level: number
  coins: number
  role?: string
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserItem[]>([])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users')
      setUsers(res.data?.users || res.data || [])
    } catch {
      setUsers([])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Người dùng</h1>
        <p className="text-gray-600">Danh sách người dùng hệ thống</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => (
          <Card key={u._id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{u.name}</span>
                <Badge variant="secondary">Lv.{u.level}</Badge>
              </CardTitle>
              <CardDescription>{u.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">{u.coins} xu • {u.role || 'user'}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


