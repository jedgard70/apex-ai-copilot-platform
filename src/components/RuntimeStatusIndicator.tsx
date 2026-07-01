import React, { useState, useEffect } from 'react';
import { Cpu, ServerOff } from 'lucide-react';

type RuntimeStatus = 'running' | 'down' | 'unknown';

export const RuntimeStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<RuntimeStatus>('unknown');

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/copilot/runtime-status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status === 'running' ? 'running' : 'down');
      } else {
        setStatus('down');
      }
    } catch (error) {
      setStatus('down');
    }
  };

  useEffect(() => {
    checkStatus();
    const intervalId = setInterval(checkStatus, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'running':
        return 'Local AI Runtime: Running';
      case 'down':
        return 'Local AI Runtime: Down';
      default:
        return 'Local AI Runtime: Status Unknown';
    }
  };

  return (
    <div className="flex items-center" title={getStatusTitle()}>
      {status === 'running' ? (
        <Cpu size={18} className={`mr-2 ${getStatusColor()}`} />
      ) : (
        <ServerOff size={18} className={`mr-2 ${getStatusColor()}`} />
      )}
    </div>
  );
};
