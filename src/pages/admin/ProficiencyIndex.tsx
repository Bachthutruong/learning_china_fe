import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Link } from 'react-router-dom'

export const AdminProficiencyIndex = () => {
  const items: Array<{ level: 'A' | 'B' | 'C'; gradient: string; desc: string }> = [
    { level: 'A', gradient: 'from-emerald-400 to-green-500', desc: 'Quản lý câu hỏi Level A' },
    { level: 'B', gradient: 'from-blue-400 to-indigo-500', desc: 'Quản lý câu hỏi Level B' },
    { level: 'C', gradient: 'from-purple-400 to-fuchsia-500', desc: 'Quản lý câu hỏi Level C' }
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Quản lý Test năng lực (A/B/C)</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {items.map(it => (
          <Card key={it.level} className="overflow-hidden border-0 shadow">
            <div className={`h-1.5 w-full bg-gradient-to-r ${it.gradient}`} />
            <CardHeader>
              <CardTitle>Level {it.level}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{it.desc}</p>
              <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <Link to={`/admin/proficiency/${it.level}`}>Quản lý</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default AdminProficiencyIndex


