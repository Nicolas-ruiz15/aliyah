'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  Award,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { QuizTopicWithQuestions, QuizResult } from '../../types/global';

interface QuizComponentProps {
  topic: QuizTopicWithQuestions;
  onComplete: (result: QuizResult) => void;
  onExit: () => void;
}

interface QuizState {
  currentQuestion: number;
  selectedAnswers: Record<number, string>;
  timeSpent: number;
  startTime: Date;
  showExplanation: boolean;
  isCompleted: boolean;
  result?: QuizResult;
}

// Función de notificación simple
const showNotification = (title: string, message: string, type: 'success' | 'error' = 'success') => {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
    type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
  }`;
  notification.innerHTML = `
    <div class="font-semibold">${title}</div>
    <div class="text-sm mt-1">${message}</div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 4000);
};

export function QuizComponent({ topic, onComplete, onExit }: QuizComponentProps) {
  const [state, setState] = useState<QuizState>({
    currentQuestion: 0,
    selectedAnswers: {},
    timeSpent: 0,
    startTime: new Date(),
    showExplanation: false,
    isCompleted: false,
  });

  const currentQ = topic.questions[state.currentQuestion];
  const totalQuestions = topic.questions.length;
  const progress = ((state.currentQuestion + 1) / totalQuestions) * 100;
  const isLastQuestion = state.currentQuestion === totalQuestions - 1;
  const hasSelectedAnswer = state.selectedAnswers[state.currentQuestion] !== undefined;

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => ({
        ...prev,
        timeSpent: Math.floor((Date.now() - prev.startTime.getTime()) / 1000)
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formatear tiempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Seleccionar respuesta
  const selectAnswer = (answerId: string) => {
    setState(prev => ({
      ...prev,
      selectedAnswers: {
        ...prev.selectedAnswers,
        [prev.currentQuestion]: answerId,
      },
      showExplanation: true,
    }));
  };

  // Siguiente pregunta
  const nextQuestion = () => {
    if (state.currentQuestion < totalQuestions - 1) {
      setState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        showExplanation: false,
      }));
    }
  };

  // Pregunta anterior
  const prevQuestion = () => {
    if (state.currentQuestion > 0) {
      setState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion - 1,
        showExplanation: !!prev.selectedAnswers[prev.currentQuestion - 1],
      }));
    }
  };

  // Calcular resultado
  const calculateResult = (): QuizResult => {
    let correctAnswers = 0;
    const incorrectAnswers: any[] = [];

    topic.questions.forEach((question, index) => {
      const selectedAnswerId = state.selectedAnswers[index];
      const selectedAnswer = question.answers.find(a => a.id === selectedAnswerId);
      const correctAnswer = question.answers.find(a => a.isCorrect);

      if (selectedAnswer?.isCorrect) {
        correctAnswers++;
      } else {
        incorrectAnswers.push({
          question,
          selectedAnswer,
          correctAnswer,
          explanation: question.explanation,
        });
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);

    return {
      score,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      timeSpent: state.timeSpent,
      passed: score >= topic.requiredScore,
    };
  };

  // Finalizar quiz
  const finishQuiz = async () => {
    const result = calculateResult();
    
    setState(prev => ({
      ...prev,
      isCompleted: true,
      result,
    }));

    // Enviar resultado al servidor
    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: topic.id,
          answers: Object.entries(state.selectedAnswers)
            .map(([questionIndex, answerId]) => {
              const questionIndexNum = parseInt(questionIndex);
              const question = topic.questions[questionIndexNum];
              
              // ✅ Verificación de seguridad
              if (!question) {
                console.warn(`Question not found at index ${questionIndexNum}`);
                return null;
              }
              
              return {
                questionId: question.id,
                answerId,
                timeSpent: Math.floor(state.timeSpent / totalQuestions),
              };
            })
            .filter(Boolean), // ✅ Filtrar elementos null
        }),
      });

      if (!response.ok) {
        throw new Error('Error enviando resultado');
      }

      showNotification(
        result.passed ? '¡Quiz aprobado!' : 'Quiz completado',
        result.passed 
          ? `Obtuviste ${result.score}% - ¡Excelente trabajo!`
          : `Obtuviste ${result.score}%. Sigue practicando.`,
        result.passed ? 'success' : 'error'
      );

      onComplete(result);
    } catch (error) {
      showNotification('Error', 'No se pudo guardar el resultado del quiz', 'error');
    }
  };

  // Reiniciar quiz
  const restartQuiz = () => {
    setState({
      currentQuestion: 0,
      selectedAnswers: {},
      timeSpent: 0,
      startTime: new Date(),
      showExplanation: false,
      isCompleted: false,
    });
  };

  // Vista de resultados
  if (state.isCompleted && state.result) {
    return (
      <QuizResultView 
        result={state.result} 
        topic={topic}
        onRestart={restartQuiz}
        onExit={onExit}
      />
    );
  }

  // Verificar que existe la pregunta actual
  if (!currentQ) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error en el Quiz</h2>
            <p className="text-gray-600 mb-4">No se pudo cargar la pregunta actual.</p>
            <Button onClick={onExit}>Volver a Estudios</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header del quiz */}
      <Card className="mb-6 bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-tekhelet-600" />
                <span>{topic.title}</span>
              </CardTitle>
              <CardDescription>
                Pregunta {state.currentQuestion + 1} de {totalQuestions}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(state.timeSpent)}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onExit}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Salir
              </Button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Pregunta actual */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">
            {currentQ.questionText}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQ.answers.map((answer, index) => {
              const isSelected = state.selectedAnswers[state.currentQuestion] === answer.id;
              const showResult = state.showExplanation;
              const isCorrect = answer.isCorrect;
              
              return (
                <button
                  key={answer.id}
                  onClick={() => !state.showExplanation && selectAnswer(answer.id)}
                  disabled={state.showExplanation}
                  className={cn(
                    'w-full p-4 text-left rounded-lg border-2 transition-all duration-200',
                    'hover:bg-gray-50 disabled:cursor-not-allowed',
                    !showResult && !isSelected && 'border-gray-200 bg-white',
                    !showResult && isSelected && 'border-tekhelet-500 bg-tekhelet-50',
                    showResult && isCorrect && 'border-green-500 bg-green-50',
                    showResult && isSelected && !isCorrect && 'border-red-500 bg-red-50',
                    showResult && !isSelected && !isCorrect && 'border-gray-200 bg-gray-50'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'h-6 w-6 rounded-full border-2 flex items-center justify-center text-sm font-medium',
                      !showResult && !isSelected && 'border-gray-300 bg-white text-gray-600',
                      !showResult && isSelected && 'border-tekhelet-500 bg-tekhelet-500 text-white',
                      showResult && isCorrect && 'border-green-500 bg-green-500 text-white',
                      showResult && isSelected && !isCorrect && 'border-red-500 bg-red-500 text-white',
                      showResult && !isSelected && !isCorrect && 'border-gray-300 bg-gray-100 text-gray-500'
                    )}>
                      {showResult ? (
                        isCorrect ? <CheckCircle className="h-4 w-4" /> :
                        isSelected ? <XCircle className="h-4 w-4" /> :
                        String.fromCharCode(65 + index)
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </div>
                    <span className="flex-1">{answer.answerText}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explicación */}
          {state.showExplanation && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Explicación</h4>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navegación */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevQuestion}
          disabled={state.currentQuestion === 0}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Anterior</span>
        </Button>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>
            {Object.keys(state.selectedAnswers).length} de {totalQuestions} respondidas
          </span>
        </div>

        {isLastQuestion ? (
          <Button
            onClick={finishQuiz}
            disabled={!hasSelectedAnswer}
            className="flex items-center space-x-2 bg-tekhelet-950 text-white px-6 py-3 rounded-lg hover:bg-tekhelet-800 transition-colors duration-200 font-medium"
          >
            <Award className="h-4 w-4" />
            <span>Finalizar Quiz</span>
          </Button>
        ) : (
          <Button
            onClick={nextQuestion}
            disabled={!hasSelectedAnswer}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Componente para mostrar resultados
function QuizResultView({ 
  result, 
  topic, 
  onRestart, 
  onExit 
}: {
  result: QuizResult;
  topic: QuizTopicWithQuestions;
  onRestart: () => void;
  onExit: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Resultado principal */}
      <Card className={`mb-6 ${result.passed ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {result.passed ? (
              <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            ) : (
              <div className="h-16 w-16 bg-orange-500 rounded-full flex items-center justify-center">
                <RotateCcw className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          
          <CardTitle className="text-2xl">
            {result.passed ? '¡Quiz Aprobado!' : 'Quiz Completado'}
          </CardTitle>
          
          <CardDescription className="text-lg">
            {result.passed 
              ? '¡Excelente trabajo! Has demostrado un buen conocimiento de la halajá.'
              : 'Sigue estudiando. La práctica te ayudará a mejorar.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-tekhelet-600">
                {result.score}%
              </div>
              <div className="text-sm text-gray-600">Puntuación</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {result.correctAnswers}
              </div>
              <div className="text-sm text-gray-600">Correctas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">
                {result.totalQuestions - result.correctAnswers}
              </div>
              <div className="text-sm text-gray-600">Incorrectas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-600">
                {Math.floor(result.timeSpent / 60)}m
              </div>
              <div className="text-sm text-gray-600">Tiempo</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Respuestas incorrectas */}
      {result.incorrectAnswers.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span>Repaso de Respuestas Incorrectas</span>
            </CardTitle>
            <CardDescription>
              Revisa estas preguntas para mejorar tu comprensión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {result.incorrectAnswers.map((item, index) => (
                <div key={index} className="border-l-4 border-l-orange-500 pl-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {item.question.questionText}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-red-600 font-medium">Tu respuesta:</div>
                      <div className="text-sm bg-red-50 p-2 rounded border-l-2 border-l-red-300">
                        {item.selectedAnswer?.answerText || 'No respondida'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-green-600 font-medium">Respuesta correcta:</div>
                      <div className="text-sm bg-green-50 p-2 rounded border-l-2 border-l-green-300">
                        {item.correctAnswer?.answerText}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 italic">
                    <strong>Explicación:</strong> {item.explanation}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-center space-x-4">
        <Button 
          variant="outline" 
          onClick={onExit}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Volver a Estudios
        </Button>
        
        <Button 
          onClick={onRestart} 
          className="bg-tekhelet-950 text-white px-6 py-3 rounded-lg hover:bg-tekhelet-800 transition-colors duration-200 font-medium"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Repetir Quiz
        </Button>
      </div>
    </div>
  );
}

export default QuizComponent;