'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle,
  FileText,
  FileImage,
  Download,
  Eye
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';
import { FileCategory } from '../../types/global';

interface FileUploadProps {
  onFilesUploaded?: (files: UploadedFileInfo[]) => void;
  maxFiles?: number;
  maxSize?: number; // en bytes
  allowedTypes?: string[];
  category?: FileCategory;
  className?: string;
  disabled?: boolean;
}

interface UploadedFileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  category: FileCategory;
  uploadedAt: Date;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
  id?: string;
}

// Función auxiliar para formatear tamaño de archivo
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Componente de notificación simple (reemplaza toast)
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
  }`;
  notification.textContent = message;
  
  // Agregar al DOM
  document.body.appendChild(notification);
  
  // Remover después de 3 segundos
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 3000);
};

export function FileUpload({
  onFilesUploaded,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB por defecto
  allowedTypes = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
  category = FileCategory.DOCUMENT,
  className,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;

    // Verificar límite de archivos
    if (files.length + acceptedFiles.length > maxFiles) {
      showNotification(`Máximo ${maxFiles} archivos permitidos`, 'error');
      return;
    }

    // Validar cada archivo
    const validFiles: File[] = [];
    
    for (const file of acceptedFiles) {
      // Verificar tamaño
      if (file.size > maxSize) {
        showNotification(`${file.name} excede el límite de ${formatFileSize(maxSize)}`, 'error');
        continue;
      }

      // Verificar tipo
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension && !allowedTypes.includes(fileExtension)) {
        showNotification(`${file.name} no es un tipo de archivo válido`, 'error');
        continue;
      }

      validFiles.push(file);
    }

    // Agregar archivos válidos al estado
    const newFiles: FileWithProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Subir archivos
    for (let i = 0; i < newFiles.length; i++) {
      const fileToUpload = newFiles[i];
      if (fileToUpload) {
        await uploadFile(fileToUpload, i + files.length);
      }
    }
  }, [files, maxFiles, maxSize, allowedTypes, disabled]);

  const uploadFile = async (fileData: FileWithProgress, index: number) => {
    try {
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('category', category);

      // Simular progreso de subida
      const updateProgress = (progress: number) => {
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, progress } : f
        ));
      };

      // Simular subida con progreso
      for (let progress = 0; progress <= 90; progress += 10) {
        updateProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error subiendo archivo');
      }

      const result = await response.json();

      // Completar progreso
      updateProgress(100);

      // Actualizar estado del archivo
      setFiles(prev => prev.map((f, i) => 
        i === index ? {
          ...f,
          status: 'completed',
          url: result.url,
          id: result.id,
        } : f
      ));

      // Notificar archivo subido
      if (onFilesUploaded) {
        const uploadedFile: UploadedFileInfo = {
          id: result.id,
          name: fileData.file.name,
          size: fileData.file.size,
          type: fileData.file.type,
          url: result.url,
          category,
          uploadedAt: new Date(),
        };

        onFilesUploaded([uploadedFile]);
      }

      showNotification(`${fileData.file.name} se subió correctamente`, 'success');

    } catch (error) {
      console.error('Error subiendo archivo:', error);
      
      setFiles(prev => prev.map((f, i) => 
        i === index ? {
          ...f,
          status: 'error',
          error: 'Error al subir archivo',
          progress: 0,
        } : f
      ));

      showNotification(`No se pudo subir ${fileData.file.name}`, 'error');
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles,
    maxSize,
  });

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <FileImage className="h-8 w-8 text-blue-600" />;
    }
    
    return <FileText className="h-8 w-8 text-red-600" />;
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Zona de drop */}
      <Card className={cn(
        'border-2 border-dashed transition-colors duration-200',
        isDragActive && 'border-tekhelet-500 bg-tekhelet-50',
        disabled && 'opacity-50 cursor-not-allowed',
        !isDragActive && !disabled && 'border-gray-300 hover:border-tekhelet-400'
      )}>
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={cn(
              'text-center cursor-pointer',
              disabled && 'cursor-not-allowed'
            )}
          >
            <input {...getInputProps()} />
            
            <Upload className={cn(
              'h-12 w-12 mx-auto mb-4',
              isDragActive ? 'text-tekhelet-600' : 'text-gray-400'
            )} />
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Suelta los archivos aquí' : 'Subir archivos'}
            </h3>
            
            <p className="text-gray-600 mb-4">
              Arrastra y suelta archivos aquí, o{' '}
              <span className="text-tekhelet-600 font-medium">
                haz clic para seleccionar
              </span>
            </p>
            
            <div className="text-sm text-gray-500 space-y-1">
              <p>Máximo {maxFiles} archivos</p>
              <p>Tamaño máximo: {formatFileSize(maxSize)}</p>
              <p>Tipos permitidos: {allowedTypes.join(', ').toUpperCase()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de archivos */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Archivos ({files.length}/{maxFiles})
          </h4>
          
          {files.map((fileData, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  {/* Icono del archivo */}
                  <div className="flex-shrink-0">
                    {getFileIcon(fileData.file.name)}
                  </div>
                  
                  {/* Información del archivo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileData.file.name}
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        {/* Estado del archivo */}
                        {fileData.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        
                        {fileData.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        
                        {/* Botones de acción */}
                        {fileData.status === 'completed' && fileData.url && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(fileData.url, '_blank')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = fileData.url!;
                                link.download = fileData.file.name;
                                link.click();
                              }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        
                        {/* Botón eliminar */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatFileSize(fileData.file.size)}</span>
                      
                      {fileData.status === 'error' && (
                        <span className="text-red-600">{fileData.error}</span>
                      )}
                    </div>
                    
                    {/* Barra de progreso */}
                    {fileData.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={fileData.progress} className="h-1" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}