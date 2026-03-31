'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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

const PLAN_INFO: Record<string, { name: string; price: string }> = {
  basic:   { name: 'Básico',  price: '$347 MXN/mes' },
  pro:     { name: 'Pro',     price: '$695 MXN/mes' },
  negocio: { name: 'Negocio', price: '$1,159 MXN/mes' },
}

const BUSINESS_TYPES = [
  { value: 'barberia',    label: 'Barbería' },
  { value: 'salon',       label: 'Salón de belleza' },
  { value: 'consultorio', label: 'Consultorio médico' },
  { value: 'spa',         label: 'Spa / Estética' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'otro',        label: 'Otro' },
]

function RegistroForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') ?? ''

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

    let userId: string | null = null

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
      userId = data.user.id

      // 2. Create business via server API (service_role bypasses RLS)
      const res = await fetch('/api/business/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, name: businessName, type: businessType }),
      })
      if (!res.ok) {
        const { error: bizError } = await res.json()
        throw new Error(bizError ?? 'Error al crear el negocio')
      }

      // 3. If plan selected, go straight to Stripe checkout
      if (plan) {
        const checkoutRes = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan }),
        })
        if (checkoutRes.ok) {
          const { url } = await checkoutRes.json()
          if (url) { window.location.href = url; return }
        }
      }

      router.push('/planes')
    } catch (err: unknown) {
      // Rollback: delete the auth user if business creation failed
      if (userId) {
        await fetch('/api/auth/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        })
      }
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

        {PLAN_INFO[plan] && (
          <div className="mb-4 flex items-center justify-between bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
            <div>
              <p className="text-xs text-violet-500 font-medium uppercase tracking-wide">Plan seleccionado</p>
              <p className="text-sm font-semibold text-violet-800">{PLAN_INFO[plan].name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-violet-700">{PLAN_INFO[plan].price}</p>
              <Link href="/" className="text-xs text-violet-400 hover:underline">Cambiar</Link>
            </div>
          </div>
        )}

        <Card className="shadow-md border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Crear cuenta</CardTitle>
            <CardDescription className="text-xs">
              {PLAN_INFO[plan]
                ? 'Completa tus datos — el siguiente paso es el pago con Stripe'
                : 'Completa los datos de tu negocio para comenzar'}
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
                {loading ? 'Creando cuenta...' : PLAN_INFO[plan] ? 'Crear cuenta e ir al pago' : 'Crear cuenta'}
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

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  )
}
