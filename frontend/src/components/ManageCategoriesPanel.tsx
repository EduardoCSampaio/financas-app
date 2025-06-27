import React, { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Category {
  id: number;
  name: string;
}

const ManageCategoriesPanel: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/categories');
      setCategories(res.data);
    } catch {}
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await api.post('/users/categories', { name: newName });
      setNewName('');
      await fetchCategories();
    } catch {}
    setLoading(false);
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleSave = async (catId: number) => {
    if (!editingName.trim()) return;
    setLoading(true);
    try {
      await api.put(`/users/categories/${catId}`, { name: editingName });
      setEditingId(null);
      setEditingName('');
      await fetchCategories();
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (catId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;
    setLoading(true);
    try {
      await api.delete(`/users/categories/${catId}`);
      await fetchCategories();
    } catch {}
    setLoading(false);
  };

  return (
    <div className="apple-card p-6 mb-8 max-w-xl mx-auto">
      <h2 className="apple-subtitle mb-4">Minhas Categorias</h2>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Nova categoria"
          className="apple-input flex-1"
          disabled={loading}
        />
        <button onClick={handleCreate} className="apple-btn px-4" disabled={loading}>Adicionar</button>
      </div>
      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center gap-2 border-b border-slate-100 pb-2 last:border-b-0">
            {editingId === cat.id ? (
              <>
                <input
                  type="text"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  className="apple-input flex-1"
                  disabled={loading}
                />
                <button onClick={() => handleSave(cat.id)} className="apple-btn-secondary px-3 py-1 text-sm" disabled={loading}>Salvar</button>
                <button onClick={() => { setEditingId(null); setEditingName(''); }} className="text-slate-400 hover:text-slate-600 text-xs">Cancelar</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-slate-800">{cat.name}</span>
                <button onClick={() => handleEdit(cat)} className="apple-btn-secondary px-3 py-1 text-xs" disabled={loading}>Editar</button>
                <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:underline text-xs" disabled={loading}>Excluir</button>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-slate-400 text-center py-8">Nenhuma categoria cadastrada.</div>
        )}
      </div>
    </div>
  );
};

export default ManageCategoriesPanel; 