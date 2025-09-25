import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'

export const AdminSettings = () => {
  const [siteName, setSiteName] = useState('Chinese Learning')
  const [supportEmail, setSupportEmail] = useState('support@example.com')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-600">Cấu hình chung của hệ thống</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình chung</CardTitle>
          <CardDescription>Thiết lập các thông tin cơ bản</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tên hệ thống</Label>
              <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email hỗ trợ</Label>
              <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <Button>Lưu</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


