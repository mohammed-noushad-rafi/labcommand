import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const LabContext = createContext();

export function LabProvider({ children }) {
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState('all');

  useEffect(() => {
    api.get('/labs').then(r => setLabs(r.data.data || [])).catch(() => {});
  }, []);

  const selectedLabName = selectedLab === 'all'
    ? 'All labs'
    : labs.find(l => l.id === parseInt(selectedLab))?.name || 'All labs';

  return (
    <LabContext.Provider value={{ labs, selectedLab, setSelectedLab, selectedLabName }}>
      {children}
    </LabContext.Provider>
  );
}

export const useLab = () => useContext(LabContext);