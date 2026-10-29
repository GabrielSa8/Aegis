import { useState } from 'react';
import { DEFAULT_CONTEXTS } from './contextConstants';

export function useContextManager({
  contexts,
  currentContextId,
  onSaveContexts,
  onSelectContext,
  onClose
}) {
  const [editingList, setEditingList] = useState(contexts || DEFAULT_CONTEXTS);
  const [selectedId, setSelectedId] = useState(currentContextId || 'general');
  const [errorMsg, setErrorMsg] = useState(null);

  const activeCtx = editingList.find((c) => c.id === selectedId) || editingList[0] || {
    id: 'nuevo',
    label: 'Nuevo Contexto',
    path: '',
    effort: 'low',
    skills: []
  };

  const handleUpdateActive = (key, value) => {
    setEditingList((prev) =>
      prev.map((item) => (item.id === selectedId ? { ...item, [key]: value } : item))
    );
  };

  const handleToggleSkill = (skill) => {
    const currentSkills = activeCtx.skills || [];
    const nextSkills = currentSkills.includes(skill)
      ? currentSkills.filter((s) => s !== skill)
      : [...currentSkills, skill];
    handleUpdateActive('skills', nextSkills);
  };

  const handleAddNew = () => {
    const newId = 'ctx_' + Date.now();
    const newCtx = {
      id: newId,
      label: 'Nuevo Proyecto',
      path: '',
      effort: 'low',
      skills: []
    };
    setEditingList((prev) => [...prev, newCtx]);
    setSelectedId(newId);
    setErrorMsg(null);
  };

  const handleDelete = (id) => {
    if (editingList.length <= 1) {
      setErrorMsg('Debe existir al menos un contexto activo.');
      return;
    }
    const remaining = editingList.filter((c) => c.id !== id);
    setEditingList(remaining);
    if (selectedId === id) {
      setSelectedId(remaining[0].id);
    }
    setErrorMsg(null);
  };

  const handleSaveAll = () => {
    onSaveContexts(editingList);
    onSelectContext(selectedId);
    onClose();
  };

  return {
    editingList,
    selectedId,
    setSelectedId,
    activeCtx,
    errorMsg,
    setErrorMsg,
    handleUpdateActive,
    handleToggleSkill,
    handleAddNew,
    handleDelete,
    handleSaveAll
  };
}
