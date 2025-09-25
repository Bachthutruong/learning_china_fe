import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

export const AdminAnalytics = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Thống kê</h1>
        <p className="text-gray-600">Biểu đồ và số liệu phân tích (đang cập nhật)</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Biểu đồ {i + 1}</CardTitle>
              <CardDescription>Đang cập nhật</CardDescription>
            </CardHeader>
            <CardContent className="h-40 bg-gray-100 rounded" />
          </Card>
        ))}
      </div>
    </div>
  )
}


