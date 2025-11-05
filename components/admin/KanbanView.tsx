import React, { useState } from 'react';
import type { Lead, LeadEstado } from '@/types';

interface KanbanViewProps {
    leads: Lead[];
    onStatusChange: (leadId: string, newStatus: LeadEstado) => void;
}

const KANBAN_COLUMNS: LeadEstado[] = ['ofertado', 'reservado', 'vendido', 'rechazado'];

const KanbanColumn: React.FC<{
    status: LeadEstado;
    leads: Lead[];
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, status: LeadEstado) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, lead: Lead) => void;
}> = ({ status, leads, onDragOver, onDrop, onDragStart }) => (
    <div 
        className="w-72 bg-brand-gray-100 dark:bg-gray-700/50 rounded-lg p-3 flex-shrink-0"
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, status)}
    >
        <h3 className="font-semibold text-brand-text dark:text-white mb-3 px-1 capitalize">{status} ({leads.length})</h3>
        <div className="space-y-3 h-full overflow-y-auto">
            {leads.map(lead => (
                <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, lead)}
                    className="bg-white dark:bg-gray-800 p-3 rounded-md shadow cursor-grab active:cursor-grabbing border-l-4 border-brand-primary"
                >
                    <p className="font-semibold text-sm text-brand-text dark:text-white">{lead.nombre}</p>
                    <p className="text-xs text-brand-gray-500 dark:text-gray-400">{lead.vertical}</p>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-bold text-brand-secondary">${lead.precio.toLocaleString()}</span>
                        <span className="text-xs text-brand-gray-500 dark:text-gray-400">Score: {lead.score}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);


const KanbanView: React.FC<KanbanViewProps> = ({ leads, onStatusChange }) => {
    const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, lead: Lead) => {
        setDraggedLead(lead);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: LeadEstado) => {
        e.preventDefault();
        if (draggedLead && draggedLead.estado !== newStatus) {
            onStatusChange(draggedLead.id, newStatus);
        }
        setDraggedLead(null);
    };

    const leadsByStatus = KANBAN_COLUMNS.reduce((acc, status) => {
        acc[status] = leads.filter(lead => lead.estado === status);
        return acc;
    }, {} as Record<LeadEstado, Lead[]>);

    return (
        <div className="flex space-x-4 overflow-x-auto pb-4">
            {KANBAN_COLUMNS.map(status => (
                <KanbanColumn
                    key={status}
                    status={status}
                    leads={leadsByStatus[status]}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragStart={handleDragStart}
                />
            ))}
        </div>
    );
};

export default KanbanView;