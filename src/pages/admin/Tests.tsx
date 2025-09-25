import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { api } from '../../services/api'

interface TestItem {
  _id: string
  title: string
  description: string
  level: number
  timeLimit: number
  questions: any[]
}

export const AdminTests = () => {
  const [tests, setTests] = useState<TestItem[]>([])

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      const res = await api.get('/admin/tests')
      const data = res.data?.tests || res.data || []
      setTests(data)
    } catch {
      setTests([])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bài test</h1>
          <p className="text-gray-600">Quản lý các bài test</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((t) => (
          <Card key={t._id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t.title}</span>
                <Badge variant="secondary">Cấp {t.level}</Badge>
              </CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">{t.questions.length} câu hỏi • {t.timeLimit} phút</div>
            </CardContent>
          </Card>
        ))}
        {tests.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="py-12 text-center text-gray-500">Chưa có bài test</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


