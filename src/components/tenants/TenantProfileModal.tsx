import React from 'react';
import { Tenant } from '../../types';

export const TenantProfileModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onNavigate?: (view: string, id?: string) => void;
}> = () => null;
