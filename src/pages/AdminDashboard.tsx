import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserPlus, 
  Settings, 
  BarChart3, 
  Shield,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar
} from 'lucide-react'

interface User {
  _id: string
  name: string
  email: string
  role: string
  phone?: string
  address?: string
  company?: string
  createdAt: string
}

interface SystemStats {
  totalUsers: number
  usersByRole: Array<{
    _id: string
    count: number
  }>
  recentUsers: User[]
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSystemStats()
  }, [])

  const fetchSystemStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch system statistics')
      }

      const data = await response.json()
      setStats(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      farmer: 'bg-green-100 text-green-800',
      retailer: 'bg-yellow-100 text-yellow-800',
      transporter: 'bg-purple-100 text-purple-800',
      regulator: 'bg-gray-100 text-gray-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Erreur: {error}</p>
              <Button onClick={fetchSystemStats} className="mt-4">
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600">Gestion du système SupplyLink Analytics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-red-600" />
          <span className="text-sm font-medium text-gray-700">Administrateur</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Utilisateurs enregistrés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.usersByRole.find(r => r._id === 'admin')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Comptes administrateur
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.usersByRole.find(r => r._id === 'manager')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Responsables de projet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agriculteurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.usersByRole.find(r => r._id === 'farmer')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Utilisateurs agricoles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users by Role */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Rôle</CardTitle>
          <CardDescription>Distribution des utilisateurs selon leur rôle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats?.usersByRole.map((role) => (
              <div key={role._id} className="text-center">
                <Badge className={getRoleColor(role._id)}>
                  {role._id.charAt(0).toUpperCase() + role._id.slice(1)}
                </Badge>
                <div className="text-2xl font-bold mt-2">{role.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs Récents</CardTitle>
          <CardDescription>Derniers utilisateurs enregistrés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentUsers.map((user) => (
              <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="h-3 w-3" />
                      <span>{user.email}</span>
                    </div>
                    {user.company && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building className="h-3 w-3" />
                        <span>{user.company}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getRoleColor(user.role)}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard
