import React, { useState } from 'react';
import { apiService } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

const CodeSnippet: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { addToast } = useToast();
    const textToCopy = React.Children.toArray(children).join('');

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        addToast('¡Copiado al portapapeles!', 'success');
    };

    return (
        <div className="bg-gray-900 text-white rounded-lg relative">
            <pre className="p-4 overflow-x-auto text-sm">
                <code>{children}</code>
            </pre>
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
                title="Copiar código"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
        </div>
    );
};


const APIAccess: React.FC = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const generateKey = async () => {
        setLoading(true);
        const key = await apiService.generateApiKey();
        setApiKey(key);
        setLoading(false);
        addToast('Nueva API Key generada. Guárdala en un lugar seguro.', 'success');
    };
    
    const endpoint = 'https://api.crebit.com/v1';

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-brand-text dark:text-white">Acceso API</h1>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-brand-text dark:text-white mb-2">Tu API Key</h3>
                <p className="text-brand-gray-600 dark:text-gray-300 mb-4">
                    Usa esta clave para autenticar tus solicitudes a la API de CREBIT. Trátala como una contraseña; no la compartas públicamente.
                </p>
                {apiKey ? (
                    <div className="flex items-center space-x-4 bg-brand-gray-100 dark:bg-gray-700 p-3 rounded-md">
                        <span className="font-mono text-brand-text dark:text-gray-200 flex-grow">{apiKey}</span>
                        <button 
                            onClick={() => { navigator.clipboard.writeText(apiKey); addToast('API Key copiada!', 'success'); }}
                            className="text-brand-primary dark:text-indigo-400 font-semibold text-sm hover:underline"
                        >
                            Copiar
                        </button>
                    </div>
                ) : (
                    <p className="text-brand-gray-500 dark:text-gray-400 italic">Aún no has generado una API key.</p>
                )}
                 <button
                    onClick={generateKey}
                    disabled={loading}
                    className="mt-4 bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
                >
                    {loading ? 'Generando...' : (apiKey ? 'Regenerar Key' : 'Generar Key')}
                </button>
                 {apiKey && <p className="text-xs text-red-600 mt-2">Al regenerar la clave, la anterior dejará de funcionar.</p>}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-brand-text dark:text-white mb-4">Documentación Rápida</h3>
                 <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold mb-2 text-brand-text dark:text-white">Obtener Leads Disponibles</h4>
                        <p className="text-sm text-brand-gray-600 dark:text-gray-300 mb-2">
                           Realiza una petición GET a <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-xs">/leads</code> para obtener la lista de leads en el marketplace.
                        </p>
                        <CodeSnippet>
                            {`curl -X GET "${endpoint}/leads" \\
  -H "Authorization: Bearer ${apiKey || 'TU_API_KEY'}"`}
                        </CodeSnippet>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2 text-brand-text dark:text-white">Comprar un Lead</h4>
                         <p className="text-sm text-brand-gray-600 dark:text-gray-300 mb-2">
                           Realiza una petición POST a <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-xs">/purchase</code> con el ID del lead.
                        </p>
                        <CodeSnippet>
                            {`curl -X POST "${endpoint}/purchase" \\
  -H "Authorization: Bearer ${apiKey || 'TU_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{"lead_id": "lead-123-abc"}'`}
                        </CodeSnippet>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default APIAccess;