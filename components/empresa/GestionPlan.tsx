import React, { useState, useEffect, useRef } from 'react';
import type { Empresa, Plan } from '@/types';
import Modal from '@components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { apiService } from '@/services/api';

interface GestionPlanProps {
    empresa: Empresa;
    onRechargeComplete: () => void;
}

const planDetails: Record<Plan, { name: string; price: string; features: string[] }> = {
    freemium: { name: "Freemium", price: "$0/mes", features: ["5 leads gratis", "Compra individual después"] },
    basico: { name: "Básico", price: "$100,000/mes", features: ["Precio preferencial por lead", "Soporte por email"] },
    profesional: { name: "Profesional", price: "$300,000/mes", features: ["Mayor descuento", "Filtros automáticos", "Soporte prioritario"] },
    empresarial: { name: "Empresarial", price: "Personalizado", features: ["Máximo descuento", "Acceso API", "Manager de cuenta"] }
};

const LOW_BALANCE_THRESHOLD = 50000;
const MIN_RECHARGE = 10000;
const MAX_RECHARGE = 10000000;

// --- CONFIGURACIÓN DE PRODUCCIÓN ---
// Se utiliza la llave pública de producción directamente desde el dashboard del usuario.
const WOMPI_PROD_PUBLIC_KEY = 'pub_prod_y09XX0vDVnv1A25FWQcrtCGCQPyng8DHQ';
// El secreto de integridad ha sido movido a una función de backend segura (create-wompi-checkout).

const GestionPlan: React.FC<GestionPlanProps> = ({ empresa, onRechargeComplete }) => {
    const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
    const [rechargeAmount, setRechargeAmount] = useState(50000);
    const [amountError, setAmountError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { addToast } = useToast();
    const verificationInProgress = useRef(false);

    // This effect robustly handles the user's return from the Wompi payment gateway.
    // It's designed to provide clear feedback regardless of webhook delays.
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const wompiId = urlParams.get('id');

        // The effect runs only if a Wompi transaction ID is in the URL and we haven't already started verification.
        if (wompiId && !verificationInProgress.current) {
            verificationInProgress.current = true;

            // Clean the URL to prevent re-triggering the effect on a page refresh.
            window.history.replaceState({}, document.title, window.location.pathname);
            
            addToast('Verificando tu pago, por favor espera...', 'info');
            const initialSaldo = empresa.saldo;
            
            let pollingInterval: number | null = null;
            const cleanup = () => {
                if (pollingInterval) clearInterval(pollingInterval);
            };

            let attempts = 0;
            const maxAttempts = 8; // Poll for ~16 seconds (8 attempts * 2 seconds)

            // We start polling to check for a balance update. This is the most reliable client-side
            // method to confirm a successful payment, as it depends on the secure backend webhook
            // having successfully processed and updated the database.
            pollingInterval = window.setInterval(async () => {
                attempts++;
                const freshData = await apiService.getEmpresaForUser(empresa.user_id);

                // SUCCESS: The balance has increased.
                if (freshData && freshData.saldo > initialSaldo) {
                    cleanup();
                    addToast('¡Recarga exitosa! Tu nuevo saldo ha sido acreditado.', 'success');
                    onRechargeComplete(); // Trigger a final render with the latest data.
                
                // TIMEOUT: The balance hasn't changed after several attempts.
                } else if (attempts >= maxAttempts) {
                    cleanup();
                    // This message is intentionally neutral. It covers cases where the webhook is delayed,
                    // the payment is PENDING (e.g., Nequi), or the payment was DECLINED/ERRORED.
                    // It manages user expectations without giving false confirmation.
                    addToast('No pudimos confirmar tu pago instantáneamente. Si fue aprobado, tu saldo se actualizará en breve.', 'warning');
                    onRechargeComplete(); // Refresh to show the current (likely unchanged) balance.
                }
            }, 2000);

            return () => cleanup(); // Cleanup on component unmount.
        }
    }, [empresa.saldo, empresa.user_id, onRechargeComplete, addToast]);


    useEffect(() => {
        if (empresa.saldo < LOW_BALANCE_THRESHOLD) {
            addToast(`¡Atención! Tu saldo es bajo: $${empresa.saldo.toLocaleString('es-CO')}. Considera recargar pronto.`, 'warning');
        }
    }, [empresa.saldo, addToast]);
    
    const validateAmount = (amount: number): string => {
        if (amount < MIN_RECHARGE) return `El monto mínimo es de $${MIN_RECHARGE.toLocaleString('es-CO')}.`;
        if (amount > MAX_RECHARGE) return `El monto máximo es de $${MAX_RECHARGE.toLocaleString('es-CO')}.`;
        return '';
    };

    const handleAmountChange = (newAmount: number) => {
        setRechargeAmount(newAmount);
        setAmountError(validateAmount(newAmount));
    };

    const handleRecharge = async () => {
        const error = validateAmount(rechargeAmount);
        if (error) {
            addToast(error, 'error');
            setAmountError(error);
            return;
        }
        
        setIsProcessing(true);
        
        const amountInCents = rechargeAmount * 100;

        try {
            if (!window.WidgetCheckout) {
              throw new Error("El widget de Wompi no se ha cargado.");
            }
            
            // 1. Llamar a la función de backend para obtener la referencia y firma seguras
            const { reference, signature } = await apiService.createWompiCheckout(amountInCents);

            // 2. Inicializar el Widget de Wompi con los datos del backend
            const checkout = new window.WidgetCheckout({
                currency: 'COP',
                amountInCents: amountInCents,
                reference: reference, // Desde el backend
                publicKey: WOMPI_PROD_PUBLIC_KEY,
                'signature:integrity': signature, // Desde el backend
                redirectUrl: window.location.href.split('?')[0], // Redirige a la misma página sin query params
                customerData: {
                    email: empresa.email,
                    fullName: empresa.nombre_empresa,
                    legalId: empresa.nit,
                    legalIdType: 'NIT',
                },
            });

            checkout.open(function(result: any) {
                if (result.error) {
                    console.error("Wompi widget error:", result.error);
                    addToast(`Error en la pasarela: ${result.error.reason || 'Ocurrió un error inesperado.'}`, 'error');
                } else if (result.transaction && (result.transaction.status === 'DECLINED' || result.transaction.status === 'ERROR')) {
                     addToast(`Tu pago fue ${result.transaction.statusMessage}.`, 'error');
                }
                setIsProcessing(false);
            });

        } catch (err) {
            console.error("Error setting up Wompi checkout:", err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            addToast(`Error al iniciar el pago: ${message}`, 'error');
            setIsProcessing(false);
        }
    };
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-brand-text dark:text-white">Mi Plan y Saldo</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-brand-text dark:text-white mb-2">Tu Saldo Actual</h3>
                    <p className={`text-5xl font-bold ${empresa.saldo < LOW_BALANCE_THRESHOLD ? 'text-brand-danger' : 'text-brand-secondary'}`}>
                        ${empresa.saldo.toLocaleString('es-CO')}
                    </p>
                    <p className="text-sm text-brand-gray-500 dark:text-gray-400 mt-2">Este saldo se usa para comprar leads en el marketplace.</p>
                     <button
                        onClick={() => setIsRechargeModalOpen(true)}
                        className="mt-6 w-full bg-brand-primary text-white py-2.5 rounded-lg font-semibold hover:bg-brand-primary-dark transition-colors"
                    >
                        Recargar Saldo
                    </button>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-brand-text dark:text-white mb-2">Tu Plan Actual</h3>
                    <p className="text-3xl font-bold text-brand-primary capitalize">{empresa.plan}</p>
                    <ul className="mt-4 space-y-2 text-sm text-brand-gray-600 dark:text-gray-300">
                        {planDetails[empresa.plan].features.map(feature => (
                           <li key={feature} className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                {feature}
                           </li> 
                        ))}
                    </ul>
                </div>
            </div>
             <Modal
                isOpen={isRechargeModalOpen}
                onClose={() => setIsRechargeModalOpen(false)}
                title="Recargar Saldo"
                size="md"
                footer={
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setIsRechargeModalOpen(false)} className="bg-brand-gray-200 text-brand-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-brand-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                        <button onClick={handleRecharge} disabled={isProcessing || !!amountError} className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-primary-dark flex items-center justify-center w-48 disabled:bg-opacity-50">
                            {isProcessing ? 'Procesando...' : 'Pagar con Wompi'}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-brand-gray-600 dark:text-gray-300">Selecciona o ingresa el monto que deseas recargar en tu cuenta.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[50000, 100000, 250000, 500000, 1000000].map(amount => (
                            <button key={amount} onClick={() => handleAmountChange(amount)} className={`p-3 rounded-lg border-2 text-center font-semibold ${rechargeAmount === amount ? 'bg-brand-primary border-brand-primary text-white' : 'bg-white dark:bg-gray-700 border-brand-gray-200 dark:border-gray-600 hover:border-brand-primary'}`}>
                                ${amount.toLocaleString('es-CO')}
                            </button>
                        ))}
                    </div>
                    <div>
                        <label htmlFor="custom-amount" className="block text-sm font-medium text-brand-text dark:text-white">O ingresa un monto personalizado (COP):</label>
                        <input
                            id="custom-amount"
                            type="number"
                            value={rechargeAmount}
                            onChange={e => handleAmountChange(Number(e.target.value))}
                            className={`mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white ${amountError ? 'border-red-500' : 'border-brand-gray-300'}`}
                            placeholder="Ej: 75000"
                            min={MIN_RECHARGE}
                            max={MAX_RECHARGE}
                        />
                        {amountError && <p className="text-xs text-red-500 mt-1">{amountError}</p>}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default GestionPlan;
