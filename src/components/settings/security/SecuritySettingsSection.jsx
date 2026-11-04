import { useState } from 'react';
import MasterPasswordCard from './MasterPasswordCard';
import EncryptionPoliciesCard from './EncryptionPoliciesCard';
import AutoLockCard from './AutoLockCard';
import MasterPasswordModal from './MasterPasswordModal';
import DisablePasswordModal from './DisablePasswordModal';

export default function SecuritySettingsSection({
  security,
  onLockVault
}) {
  const {
    status,
    setupMasterPassword,
    changeMasterPassword,
    disableMasterPassword,
    updatePolicies
  } = security;

  const [modalMode, setModalMode] = useState(null); // 'setup' | 'change' | 'disable' | null

  const handleTogglePolicy = (key, val) => {
    updatePolicies({
      encryptCredentials: key === 'encryptCredentials' ? val : status.encryptCredentials,
      encryptDatabase: key === 'encryptDatabase' ? val : status.encryptDatabase,
      autoLockMinutes: status.autoLockMinutes,
      lockOnTrayMinimize: key === 'lockOnTrayMinimize' ? val : status.lockOnTrayMinimize
    });
  };

  const handleChangeAutoLock = (mins) => {
    updatePolicies({
      encryptCredentials: status.encryptCredentials,
      encryptDatabase: status.encryptDatabase,
      autoLockMinutes: mins,
      lockOnTrayMinimize: status.lockOnTrayMinimize
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: 'var(--text-high)' }}>
          Seguridad, Cifrado & Contraseña Maestra
        </h2>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Gestión del enclave de seguridad en reposo con criptografía autenticada AES-256-GCM y derivación Argon2id.
        </p>
      </div>

      <MasterPasswordCard
        status={status}
        onOpenSetupModal={() => setModalMode('setup')}
        onOpenChangeModal={() => setModalMode('change')}
        onOpenDisableModal={() => setModalMode('disable')}
        onLockVault={onLockVault}
      />

      <EncryptionPoliciesCard
        status={status}
        onTogglePolicy={handleTogglePolicy}
        disabled={!status?.masterPasswordEnabled}
      />

      <AutoLockCard
        autoLockMinutes={status?.autoLockMinutes ?? 15}
        onChange={handleChangeAutoLock}
        disabled={!status?.masterPasswordEnabled}
      />

      {/* Modales Tácticos */}
      <MasterPasswordModal
        isOpen={modalMode === 'setup' || modalMode === 'change'}
        onClose={() => setModalMode(null)}
        mode={modalMode === 'change' ? 'change' : 'setup'}
        onSubmit={modalMode === 'change' ? changeMasterPassword : setupMasterPassword}
      />

      <DisablePasswordModal
        isOpen={modalMode === 'disable'}
        onClose={() => setModalMode(null)}
        onConfirm={disableMasterPassword}
      />
    </div>
  );
}
