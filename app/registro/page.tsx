'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const BUSINESS_TYPES = [
  { value: 'barberia',    label: 'Barbería' },
  { value: 'salon',       label: 'Salón de belleza' },
  { value: 'consultorio', label: 'Consultorio médico' },
  { value: 'spa',         label: 'Spa / Estética' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'otro',        label: 'Otro' },
]

export default function RegistroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!businessType) { setError('Selecciona el tipo de negocio'); return }
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // 1. Create auth user
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: nombre } },
      })
      if (authError) throw authError
      if (!data.user) throw new Error('No se pudo crear el usuario')

      // 2. Create business record via server API (uses service_role to bypass RLS)
      const res = await fetch('/api/business/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: data.user.id, name: businessName, type: businessType }),
      })
      if (!res.ok) {
        const { error: bizError } = await res.json()
        throw new Error(bizError ?? 'Error al crear el negocio')
      }

      router.push('/planes')
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Error al registrarse')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-violet-600 text-xl leading-none">✦</span>
            <span className="font-bold text-xl">Agendly</span>
          </Link>
          <p className="text-sm text-gray-500 mt-2">Crea tu cuenta para comenzar</p>
        </div>

        <Card className="shadow-md border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Crear cuenta</CardTitle>
            <CardDescription className="text-xs">
              Completa los datos de tu negocio para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Tu nombre</Label>
                <Input
                  id="nombre"
                  placeholder="Juan García"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                  className="focus-visible:ring-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@minegocio.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="focus-visible:ring-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="focus-visible:ring-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessName">Nombre del negocio</Label>
                <Input
                  id="businessName"
                  placeholder="Barbería El Estilo"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  required
                  className="focus-visible:ring-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Tipo de negocio</Label>
                <Select onValueChange={setBusinessType}>
                  <SelectTrigger className="focus:ring-violet-500">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                disabled={loading}
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </form>

            <p className="text-center text-xs text-gray-500 mt-4">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-violet-600 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          Al registrarte aceptas nuestros términos de servicio.
        </p>
      </div>
    </div>
  )
}
