// ===========================================================================
// IMF TURISMO — guarda de rotas (seção 6.2 do PRODUCT.md)
// <ProtectedRoute /> redireciona para /login (ou /admin/login) sem sessão.
// <AdminRoute /> exige ainda papel ADMIN, senão retorna 403 local.
// ===========================================================================

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

export function ProtectedRoute({ children }) {
  const { autenticado } = useAuth()
  const location = useLocation()
  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

export function AdminRoute({ children }) {
  const { autenticado, ehAdmin } = useAuth()
  if (!autenticado) {
    return <Navigate to="/admin/login" replace />
  }
  if (!ehAdmin) {
    return <Navigate to="/" replace />
  }
  return children
}

export function ClienteRoute({ children }) {
  const { autenticado, ehAdmin } = useAuth()
  const location = useLocation()
  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  // Administrador não tem perfil de cliente: volta para o painel.
  if (ehAdmin) {
    return <Navigate to="/admin/dashboard" replace />
  }
  return children
}
