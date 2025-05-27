
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Brain, Trophy, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
}

interface Evaluation {
  score: number;
  feedback: string;
  correction: string;
}

interface AdaptiveQuizProps {
  topicId: string;
  topicTitle: string;
  onComplete: (newMastery: number) => void;
}

const AdaptiveQuiz = ({ topicId, topicTitle, onComplete }: AdaptiveQuizProps) => {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [mastery, setMastery] = useState(0.0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizLevel, setQuizLevel] = useState('easy');

  useEffect(() => {
    fetchUserMastery();
  }, [topicId, user]);

  const fetchUserMastery = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_mastery')
        .select('mastery_level')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching mastery:', error);
      }

      const currentMastery = data?.mastery_level || 0.0;
      setMastery(currentMastery);
      generateQuestion(currentMastery);
    } catch (error) {
      console.error('Error:', error);
      generateQuestion(0.0);
    }
  };

  const generateQuestion = async (masteryLevel: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('adaptive-quiz', {
        body: {
          action: 'generate_question',
          topic: topicTitle,
          mastery: masteryLevel
        }
      });

      if (error) throw error;

      if (data.success) {
        setCurrentQuestion(data.question);
        setQuizLevel(data.level);
        console.log(`Generated ${data.level} question for mastery ${masteryLevel}`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error generating question:', error);
      toast.error('Failed to generate question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion || !user) {
      toast.error('Please select an answer');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('adaptive-quiz', {
        body: {
          action: 'evaluate_answer',
          question: currentQuestion.question,
          answer: selectedAnswer,
          topic: topicTitle,
          userId: user.id,
          topicId: topicId
        }
      });

      if (error) throw error;

      if (data.success) {
        setEvaluation(data.evaluation);
        setMastery(data.newMastery);
        setShowResult(true);
        setQuestionsAnswered(prev => prev + 1);

        if (data.evaluation.score >= 0.7) {
          toast.success(`🎉 ${data.evaluation.feedback}`);
        } else {
          toast.error(`📚 ${data.evaluation.feedback}`);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      toast.error('Failed to evaluate answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (questionsAnswered >= 5) {
      onComplete(mastery);
      return;
    }
    
    setSelectedAnswer('');
    setEvaluation(null);
    setShowResult(false);
    generateQuestion(mastery);
  };

  const getMasteryColor = (level: number) => {
    if (level < 0.3) return 'bg-red-500';
    if (level < 0.7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getMasteryLabel = (level: number) => {
    if (level < 0.3) return 'Beginner';
    if (level < 0.7) return 'Intermediate';
    return 'Advanced';
  };

  if (loading && !currentQuestion) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Mastery Progress */}
      <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Brain className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-bold">Mastery Level</h3>
                <p className="text-purple-100">{getMasteryLabel(mastery)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round(mastery * 100)}%</div>
              <div className="text-sm text-purple-100">Current Level: {quizLevel}</div>
            </div>
          </div>
          <Progress value={mastery * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Quiz Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-orange-500" />
            Adaptive Quiz - Question {questionsAnswered + 1} of 5
          </CardTitle>
          <CardDescription>
            Difficulty automatically adjusts based on your performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={(questionsAnswered / 5) * 100} className="mb-4" />
        </CardContent>
      </Card>

      {/* Question Card */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <CardTitle>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                quizLevel === 'easy' ? 'bg-green-100 text-green-800' :
                quizLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {quizLevel.charAt(0).toUpperCase() + quizLevel.slice(1)} Level
              </span>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentQuestion.question}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {evaluation && showResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border-2 ${
                  evaluation.score >= 0.7
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <h4 className={`font-bold mb-2 ${
                  evaluation.score >= 0.7 ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                }`}>
                  Score: {Math.round(evaluation.score * 100)}%
                </h4>
                <p className={`mb-2 ${
                  evaluation.score >= 0.7 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                }`}>
                  {evaluation.feedback}
                </p>
                {evaluation.correction !== "None needed" && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Correction:</strong> {evaluation.correction}
                  </p>
                )}
              </motion.div>
            )}

            <div className="flex gap-3">
              {!showResult ? (
                <Button
                  onClick={submitAnswer}
                  disabled={!selectedAnswer || loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {loading ? 'Evaluating...' : 'Submit Answer'}
                </Button>
              ) : (
                <Button
                  onClick={nextQuestion}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  {questionsAnswered >= 5 ? (
                    <>
                      <Trophy className="mr-2 h-4 w-4" />
                      Complete Quiz
                    </>
                  ) : (
                    'Next Question'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default AdaptiveQuiz;
