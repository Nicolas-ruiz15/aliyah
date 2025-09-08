'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, User, Star, Heart, Check } from 'lucide-react';

interface FormData {
  // Paso 1: Información personal
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  
  // Paso 2: Información judía
  jewishStatus: string;
  familyStatus: string;
  
  // Paso 3: Motivación
  motivation: string;
  hebrewLevel: number;
  halajaKnowledge: number;
  
  // Paso 4: Términos
  acceptsTerms: boolean;
  acceptsPrivacy: boolean;
  acceptsDataProcessing: boolean;
}

interface RegistrationFormProps {
  onSuccess?: (data: FormData) => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    jewishStatus: 'NOT_SPECIFIED',
    familyStatus: 'SINGLE',
    motivation: '',
    hebrewLevel: 0,
    halajaKnowledge: 0,
    acceptsTerms: false,
    acceptsPrivacy: false,
    acceptsDataProcessing: false,
  });

  const steps = [
    { id: 1, title: 'Información Personal', icon: User },
    { id: 2, title: 'Información Judía', icon: Star },
    { id: 3, title: 'Motivación', icon: Heart },
    { id: 4, title: 'Términos', icon: Check },
  ];

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.email) newErrors.email = 'Email requerido';
      if (!formData.email.includes('@')) newErrors.email = 'Email inválido';
      if (!formData.password) newErrors.password = 'Contraseña requerida';
      if (formData.password.length < 8) newErrors.password = 'Mínimo 8 caracteres';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
      if (!formData.firstName) newErrors.firstName = 'Nombre requerido';
      if (!formData.lastName) newErrors.lastName = 'Apellido requerido';
    }

    if (step === 3) {
      if (!formData.motivation || formData.motivation.length < 50) {
        newErrors.motivation = 'Mínimo 50 caracteres';
      }
    }

    if (step === 4) {
      if (!formData.acceptsTerms) newErrors.acceptsTerms = 'Debes aceptar los términos';
      if (!formData.acceptsPrivacy) newErrors.acceptsPrivacy = 'Debes aceptar la política';
      if (!formData.acceptsDataProcessing) newErrors.acceptsDataProcessing = 'Debes autorizar el procesamiento';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(4)) return;
    
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular API call
      
      showNotification('¡Registro exitoso!', 'success');
      onSuccess?.(formData);
    } catch (error) {
      showNotification('Error en el registro', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const progress = (currentStep / 4) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Registro de Usuario</h1>
          <div className="text-sm text-gray-500">Paso {currentStep} de 4</div>
        </div>
        
        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Indicadores de pasos */}
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted ? 'bg-green-500 text-white' :
                  isCurrent ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-12 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              {React.createElement(steps[currentStep - 1]?.icon || User, { className: "h-5 w-5" })}
              <span>{steps[currentStep - 1]?.title}</span>
            </h2>
          </div>
          
          <div className="space-y-6">
            {/* Paso 1: Información Personal */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="tu@email.com"
                  />
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Apellido *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Contraseña *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Confirmar Contraseña *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {/* Paso 2: Información Judía */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">¿Cuál es tu estatus judío?</label>
                  <div className="space-y-3">
                    {[
                      { value: 'BORN_JEWISH', label: 'Judío de nacimiento' },
                      { value: 'CONVERTED_ORTHODOX', label: 'Convertido ortodoxo' },
                      { value: 'CONVERTED_CONSERVATIVE', label: 'Convertido conservador' },
                      { value: 'IN_CONVERSION_PROCESS', label: 'En proceso de conversión' },
                      { value: 'NOT_JEWISH', label: 'No judío' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          value={option.value}
                          checked={formData.jewishStatus === option.value}
                          onChange={(e) => updateFormData('jewishStatus', e.target.value)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Estado familiar</label>
                  <select
                    value={formData.familyStatus}
                    onChange={(e) => updateFormData('familyStatus', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="SINGLE">Soltero/a</option>
                    <option value="MARRIED">Casado/a</option>
                    <option value="DIVORCED">Divorciado/a</option>
                    <option value="WIDOWED">Viudo/a</option>
                    <option value="ENGAGED">Comprometido/a</option>
                  </select>
                </div>
              </div>
            )}

            {/* Paso 3: Motivación */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Motivación para hacer aliá *</label>
                  <textarea
                    value={formData.motivation}
                    onChange={(e) => updateFormData('motivation', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe tu motivación para mudarte a Israel..."
                  />
                  {errors.motivation && <p className="text-red-600 text-sm mt-1">{errors.motivation}</p>}
                  <p className="text-sm text-gray-500 mt-1">{formData.motivation.length}/50 caracteres mínimo</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nivel de hebreo (0-10): {formData.hebrewLevel}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={formData.hebrewLevel}
                      onChange={(e) => updateFormData('hebrewLevel', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Conocimiento de halajá (0-10): {formData.halajaKnowledge}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={formData.halajaKnowledge}
                      onChange={(e) => updateFormData('halajaKnowledge', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 4: Términos */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Términos y Condiciones</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.acceptsTerms}
                        onChange={(e) => updateFormData('acceptsTerms', e.target.checked)}
                        className="mt-1 h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm">
                        Acepto los términos y condiciones de la plataforma.
                      </span>
                    </label>
                    {errors.acceptsTerms && <p className="text-red-600 text-sm">{errors.acceptsTerms}</p>}

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.acceptsPrivacy}
                        onChange={(e) => updateFormData('acceptsPrivacy', e.target.checked)}
                        className="mt-1 h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm">
                        Acepto la política de privacidad y el manejo de mis datos personales.
                      </span>
                    </label>
                    {errors.acceptsPrivacy && <p className="text-red-600 text-sm">{errors.acceptsPrivacy}</p>}

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.acceptsDataProcessing}
                        onChange={(e) => updateFormData('acceptsDataProcessing', e.target.checked)}
                        className="mt-1 h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm">
                        Autorizo el procesamiento de mis datos para el proceso de aliá.
                      </span>
                    </label>
                    {errors.acceptsDataProcessing && <p className="text-red-600 text-sm">{errors.acceptsDataProcessing}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navegación */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Anterior</span>
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              <span>Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Procesando...
                </div>
              ) : (
                <>
                  <span>Completar Registro</span>
                  <Check className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default RegistrationForm;