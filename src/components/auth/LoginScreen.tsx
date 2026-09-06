import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Lock, Mail, Eye, EyeOff, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Error al iniciar sesión.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al conectar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      {/* Luces y Efectos de Fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Tarjeta Central de Login */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-black/80 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera / Logo */}
        <div className="text-center space-y-3 mb-7">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-500/10">
            <Calendar size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Bitácora Semanal Pro
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-1">
              Portal de Registro de Actividades & Reportes
            </p>
          </div>
        </div>

        {/* Mensaje de Error */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-xl flex items-start space-x-2.5 text-xs text-rose-300">
            <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail size={16} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu_correo@empresa.com"
                required
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-700/80 bg-slate-800/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-700/80 bg-slate-800/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full justify-center gap-2 mt-3 py-2.5 text-xs font-bold shadow-lg shadow-indigo-600/30"
          >
            <LogIn size={16} />
            <span>Ingresar al Sistema</span>
          </Button>
        </form>

        {/* Acceso Protegido */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col items-center space-y-2 text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <ShieldCheck size={13} className="text-indigo-400" />
            <span>Acceso protegido por roles y credenciales</span>
          </div>
        </div>
      </div>

      {/* Footer Inferior */}
      <footer className="mt-6 text-xs text-slate-500 font-medium">
        Bitácora Semanal Pro &copy; {new Date().getFullYear()} — Todos los derechos reservados
      </footer>
    </div>
  );
};
