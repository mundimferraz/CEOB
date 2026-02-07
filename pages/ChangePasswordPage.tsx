
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, Eye, EyeOff, Save, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useApp } from '../App';
import { dbApi } from '../services/api';
import { AuditAction, AuditEntity } from '../types';

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, notify } = useApp();
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwords.new || passwords.new.length < 4) {
      notify("A nova senha deve ter pelo menos 4 caracteres.", "error");
      return;
    }

    if (passwords.new !== passwords.confirm) {
      notify("As senhas não coincidem.", "error");
      return;
    }

    setLoading(true);
    try {
      await dbApi.updatePassword(currentUser!.id, passwords.new);
      
      // Log de auditoria com nome do executor explícito
      await dbApi.createAuditLog({
        user_id: currentUser!.id,
        user_name: currentUser!.name,
        action: AuditAction.UPDATE,
        entity_type: AuditEntity.USER,
        entity_id: currentUser!.id,
        details: { 
          action: 'Mudança de Senha Self-Service',
          executor: currentUser!.name,
          timestamp: new Date().toISOString()
        }
      });

      notify("Senha alterada com sucesso!", "success");
      navigate('/');
    } catch (err) {
      console.error(err);
      notify("Erro ao atualizar senha. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto w-full animate-in fade-in duration-500">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-2">
            <Lock className="text-blue-600" />
            Segurança da Conta
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Atualização de Credenciais de Acesso</p>
        </div>
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowLeft size={24} />
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
                <ShieldCheck size={28} />
             </div>
             <div>
               <p className="text-sm font-black text-slate-900 leading-tight">{currentUser?.name}</p>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{currentUser?.email || 'Servidor Público'}</p>
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
             <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
             <p className="text-[11px] font-bold text-amber-800 leading-tight">
               Ao alterar sua senha, todos os seus dispositivos precisarão realizar um novo login. Use uma senha forte e fácil de memorizar.
             </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Nova Senha</label>
              <div className="relative">
                <input 
                  type={showPass ? "text" : "password"}
                  className="w-full h-14 pl-5 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-900 transition-all"
                  value={passwords.new}
                  onChange={e => setPasswords({...passwords, new: e.target.value})}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Confirmar Nova Senha</label>
              <input 
                type={showPass ? "text" : "password"}
                className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-900 transition-all"
                value={passwords.confirm}
                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Atualizar Minhas Credenciais
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
