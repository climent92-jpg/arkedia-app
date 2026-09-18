'use client';

import { useState } from 'react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ScheduleModal({ isOpen, onClose }: ScheduleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
        >
          ✕
        </button>
        <h2 className="text-lg font-bold mb-2 text-gray-800">Gestió d'Horaris</h2>
        <p className="text-sm text-gray-600 mb-4">
          La gestió de franges s'ha integrat directament al panell principal d'horaris.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-blue-700 text-white py-2 rounded-lg font-medium text-sm hover:bg-blue-800"
        >
          Tancar
        </button>
      </div>
    </div>
  );
}
