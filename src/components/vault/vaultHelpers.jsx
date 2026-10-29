import React from 'react';

/**
 * Plantillas predefinidas para nuevas notas en la Bóveda.
 */
export const NOTE_TEMPLATES = {
  basic: {
    label: 'Nota General',
    desc: 'Encabezado con etiquetas básicas y fecha',
    getContent: (title) => `---
tags:
  - nota
tipo: Nota
fecha_actualizacion: ${new Date().toISOString().split('T')[0]}
---

# ${title}

`
  },
  sop: {
    label: 'SOP Operativo',
    desc: 'Procedimiento operativo estándar con pasos de verificación',
    getContent: (title) => `---
tags:
  - sop
  - operaciones
tipo: Procedimiento
estado: Activo
fecha_actualizacion: ${new Date().toISOString().split('T')[0]}
---

# 📋 SOP — ${title}

> [!ABSTRACT] Objetivo
> Descripción del procedimiento y contexto operativo.

---

## 🛠️ Pasos de Ejecución
- [ ] Paso 1: 
- [ ] Paso 2: 
- [ ] Paso 3: 

---
*Navegación:* [[INICIO]]
`
  },
  project: {
    label: 'Proyecto de Software',
    desc: 'Arquitectura, stack, repositorio y checklist de hitos',
    getContent: (title) => `---
aliases:
  - ${title}
tags:
  - proyectos/software
tipo: Proyecto
estado: En Desarrollo
fecha_actualizacion: ${new Date().toISOString().split('T')[0]}
---

# 🛡️ ${title}

> [!ABSTRACT] Resumen
> Arquitectura y objetivos técnicos del sistema.

---

## 📍 Datos del Repositorio
* **Ruta Local:** 
* **Stack:** 

---

## 🏗️ Hitos y Tareas
- [ ] Fase 1: Arquitectura base y entorno
- [ ] Fase 2: Implementación de componentes core

---
*Navegación:* [[INICIO]]
`
  },
  study: {
    label: 'Estudio y Flashcards',
    desc: 'Objetivos de aprendizaje y tarjetas de repetición espaciada',
    getContent: (title) => `---
tags:
  - estudios
  - certificaciones
tipo: Materia
estado: En Curso
fecha_actualizacion: ${new Date().toISOString().split('T')[0]}
---

# 📚 ${title}

## 🎯 Objetivos de Aprendizaje
- [ ] Concepto 1
- [ ] Concepto 2

---

## ⚡ Flashcards & Conceptos Clave
Q:: ¿Concepto 1?
A:: Explicación atómica.

---
*Navegación:* [[INICIO]]
`
  }
};

/**
 * Resaltador de términos coincidentes en snippets de búsqueda profunda.
 */
export function highlightMatch(text, query) {
  if (!query || !query.trim()) return text;
  const cleanQ = query.trim();
  const escaped = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    part.toLowerCase() === cleanQ.toLowerCase() ? (
      <mark
        key={i}
        style={{
          background: 'rgba(16, 185, 129, 0.35)',
          color: '#34d399',
          fontWeight: 700,
          padding: '0 2px',
          borderRadius: '2px'
        }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

/**
 * Construcción recursiva del árbol de carpetas estilo Obsidian.
 */
export function buildVaultTree(notesList) {
  const root = { path: '', name: 'root', folders: {}, files: [] };

  notesList.forEach((note) => {
    const parts = note.relative_path.split('/');
    if (parts.length === 1) {
      root.files.push(note);
    } else {
      let current = root;
      let accumulatedPath = '';
      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${folderName}` : folderName;
        if (!current.folders[folderName]) {
          current.folders[folderName] = {
            path: accumulatedPath,
            name: folderName,
            folders: {},
            files: []
          };
        }
        current = current.folders[folderName];
      }
      current.files.push(note);
    }
  });

  return root;
}

/**
 * Conteo total de notas dentro de una carpeta y sus subcarpetas.
 */
export function getFolderFileCount(node) {
  let count = node.files.length;
  Object.values(node.folders).forEach((sub) => {
    count += getFolderFileCount(sub);
  });
  return count;
}

/**
 * Resuelve dinámicamente las subcarpetas existentes bajo un Hub específico.
 */
export function resolveAvailableSubfolders(vaultFolders, notes, hub) {
  if (!hub) return [];
  const prefix = `${hub}/`;
  const folderSet = new Set();

  if (Array.isArray(vaultFolders)) {
    vaultFolders.forEach((f) => {
      if (f.startsWith(prefix)) {
        folderSet.add(f.substring(prefix.length));
      }
    });
  }

  if (Array.isArray(notes)) {
    notes.forEach((n) => {
      if (n.relative_path && n.relative_path.startsWith(prefix)) {
        const parts = n.relative_path.substring(prefix.length).split('/');
        if (parts.length > 1) {
          let acc = '';
          for (let i = 0; i < parts.length - 1; i++) {
            acc = acc ? `${acc}/${parts[i]}` : parts[i];
            folderSet.add(acc);
          }
        }
      }
    });
  }

  return Array.from(folderSet).sort();
}
