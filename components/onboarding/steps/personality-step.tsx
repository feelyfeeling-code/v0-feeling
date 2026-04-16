'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FeelyMascot } from '@/components/feely-mascot'
import { ArrowLeft, ArrowUp, ArrowDown, Check, Clock } from 'lucide-react'
import { toast } from 'sonner'
import type { OnboardingData } from '../onboarding-flow'

interface PersonalityStepProps {
  data: OnboardingData['personality']
  onUpdate: (updates: Partial<OnboardingData['personality']>) => void
  onNext: () => void
  onPrev: () => void
}

const AVAILABLE_TRAITS: { value: string; label: string }[] = [
  { value: 'curious', label: 'Curieux' },
  { value: 'rigorous', label: 'Rigoureux' },
  { value: 'empathetic', label: 'Empathique' },
  { value: 'creative', label: 'Créatif' },
  { value: 'leader', label: 'Leadership' },
  { value: 'autonomous', label: 'Autonome' },
  { value: 'analytical', label: 'Analytique' },
  { value: 'communicator', label: 'Communicant' },
  { value: 'resilient', label: 'Résilient' },
  { value: 'organized', label: 'Organisé' },
  { value: 'collaborative', label: 'Collaboratif' },
  { value: 'adaptable', label: 'Adaptable' },
]

const TEST_TYPES: { value: string; label: string }[] = [
  { value: 'mbti', label: 'MBTI (16 personnalités)' },
  { value: 'disc', label: 'DISC' },
  { value: 'big_five', label: 'Big Five / OCEAN' },
  { value: 'enneagram', label: 'Ennéagramme' },
  { value: 'other', label: 'Autre' },
]

const MAX_TRAITS = 3
const TRAIT_WEIGHTS = ['50%', '30%', '20%']

const INTEGRATED_TEST_QUESTIONS: { id: string; text: string }[] = [
  { id: 'q1', text: 'Je me présente sans stress devant une salle que je ne connais pas.' },
  { id: 'q2', text: 'J\'avance mieux avec un cadre posé qu\'en improvisant au fil de l\'eau.' },
  { id: 'q3', text: 'Je tranche vite, même quand il me manque des infos.' },
  { id: 'q4', text: 'J\'ai besoin de collègues autour de moi pour donner le meilleur.' },
  { id: 'q5', text: 'Je m\'intéresse à des sujets qui n\'ont rien à voir avec mes études.' },
  { id: 'q6', text: 'Quand la pression monte (deadline, imprévu), je garde la tête froide.' },
  { id: 'q7', text: 'Je dis quand je ne suis pas d\'accord, même à quelqu\'un plus haut placé que moi.' },
  { id: 'q8', text: 'Je fais plus confiance à un process établi qu\'à mon intuition.' },
  { id: 'q9', text: 'Un problème que personne n\'a encore résolu me donne envie de m\'y coller.' },
  { id: 'q10', text: 'Un échec me secoue, mais je rebondis vite.' },
]

const LIKERT_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Pas du tout d\'accord' },
  { value: 2, label: 'Pas d\'accord' },
  { value: 3, label: 'Neutre' },
  { value: 4, label: 'D\'accord' },
  { value: 5, label: 'Tout à fait d\'accord' },
]

type SubStep = 'traits' | 'test-question' | 'test-intro' | 'test-questions'

function getTraitLabel(value: string): string {
  return AVAILABLE_TRAITS.find((t) => t.value === value)?.label ?? value
}

function initialSubStep(data: OnboardingData['personality']): SubStep {
  // Si l'utilisateur avait déjà commencé le test intégré, on reprend dedans.
  const answeredCount = Object.keys(data.test_answers ?? {}).length
  if (answeredCount > 0 && !data.has_taken_test) return 'test-questions'
  if ((data.traits ?? []).length === MAX_TRAITS) return 'test-question'
  return 'traits'
}

function firstUnansweredIndex(
  answers: Record<string, number> | undefined
): number {
  const safe = answers ?? {}
  const idx = INTEGRATED_TEST_QUESTIONS.findIndex(
    (q) => safe[q.id] === undefined
  )
  return idx === -1 ? INTEGRATED_TEST_QUESTIONS.length - 1 : idx
}

export function PersonalityStep({
  data,
  onUpdate,
  onNext,
  onPrev,
}: PersonalityStepProps) {
  // Garde-fous : si l'état hydraté depuis localStorage est corrompu, on retombe
  // sur des valeurs par défaut plutôt que de crasher.
  const traitsList = data.traits ?? []
  const testAnswers = data.test_answers ?? {}
  const testType = data.test_type ?? ''
  const testResult = data.test_result ?? ''
  const hasTakenTest = data.has_taken_test === true

  const [subStep, setSubStep] = useState<SubStep>(() => initialSubStep(data))
  const [questionIndex, setQuestionIndex] = useState<number>(() =>
    firstUnansweredIndex(data.test_answers)
  )

  // -------------------- Sub-step : traits --------------------

  const toggleTrait = (value: string) => {
    if (traitsList.includes(value)) {
      onUpdate({ traits: traitsList.filter((t) => t !== value) })
      return
    }
    if (traitsList.length >= MAX_TRAITS) {
      toast.error(
        `Tu as atteint le maximum de ${MAX_TRAITS} traits. Retire-en un pour en choisir un autre.`
      )
      return
    }
    onUpdate({ traits: [...traitsList, value] })
  }

  const moveTrait = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= traitsList.length) return
    const next = [...traitsList]
    ;[next[index], next[target]] = [next[target], next[index]]
    onUpdate({ traits: next })
  }

  const canContinueTraits = traitsList.length === MAX_TRAITS

  // -------------------- Sub-step : test-question (Oui/Non) --------------------

  // L'utilisateur peut avancer vers Valeurs uniquement si :
  // - il a répondu "Oui" et rempli le type et le résultat du test, OU
  // - il a répondu "Non" (on ira alors vers l'intro du mini-test intégré).
  const canContinueTestQuestion = hasTakenTest
    ? testType.trim().length > 0 && testResult.trim().length > 0
    : true

  // -------------------- Sub-step : test-questions (10 questions Likert) --------------------

  const currentQuestion = INTEGRATED_TEST_QUESTIONS[questionIndex]
  const answeredCount = useMemo(
    () => Object.keys(testAnswers).length,
    [testAnswers]
  )
  const testProgress = ((questionIndex + 1) / INTEGRATED_TEST_QUESTIONS.length) * 100

  const selectAnswer = (value: number) => {
    // Sélection visuelle uniquement — l'avancée se fait via le bouton Suivant.
    onUpdate({
      test_answers: { ...testAnswers, [currentQuestion.id]: value },
    })
  }

  const isLastQuestion = questionIndex === INTEGRATED_TEST_QUESTIONS.length - 1
  const currentAnswer =
    currentQuestion !== undefined ? testAnswers[currentQuestion.id] : undefined
  const canContinueTestQuestions = currentAnswer !== undefined

  // -------------------- Navigation --------------------

  const handlePrev = () => {
    switch (subStep) {
      case 'traits':
        onPrev()
        break
      case 'test-question':
        setSubStep('traits')
        break
      case 'test-intro':
        setSubStep('test-question')
        break
      case 'test-questions':
        if (questionIndex > 0) {
          setQuestionIndex(questionIndex - 1)
        } else {
          setSubStep('test-intro')
        }
        break
    }
  }

  const handleNext = () => {
    switch (subStep) {
      case 'traits':
        setSubStep('test-question')
        break
      case 'test-question':
        // "Oui" + champs remplis (déjà validé via canContinueTestQuestion)
        //  → on saute intro et questions et on va directement à Valeurs & Culture.
        // "Non" → on propose le mini-test intégré (écran d'intro).
        if (hasTakenTest) {
          onNext()
        } else {
          setSubStep('test-intro')
        }
        break
      case 'test-intro':
        setQuestionIndex(firstUnansweredIndex(testAnswers))
        setSubStep('test-questions')
        break
      case 'test-questions':
        if (!isLastQuestion) {
          setQuestionIndex(questionIndex + 1)
        } else {
          // Question 10 validée → on sort de l'étape personnalité vers Valeurs.
          onNext()
        }
        break
    }
  }

  // -------------------- Render --------------------

  return (
    <div className="max-w-xl mx-auto py-8 relative">
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Retour"
        className="absolute left-0 top-8 w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="text-center mb-8">
        <FeelyMascot variant="purple" size="lg" className="mx-auto mb-4" />
        {subStep === 'traits' && (
          <>
            <h1 className="text-2xl md:text-3xl font-bold">
              Choisis tes 3 traits de
              <br />
              personnalité dominants
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Puis classe-les par ordre d&apos;importance
            </p>
          </>
        )}
        {subStep === 'test-question' && (
          <h1 className="text-2xl md:text-3xl font-bold">
            As-tu déjà passé un test
            <br />
            de personnalité&nbsp;?
          </h1>
        )}
        {subStep === 'test-intro' && (
          <h1 className="text-2xl md:text-3xl font-bold">
            Mini-test de
            <br />
            personnalité
          </h1>
        )}
        {subStep === 'test-questions' && (
          <h1 className="text-xl md:text-2xl font-bold">
            Question {questionIndex + 1} / {INTEGRATED_TEST_QUESTIONS.length}
          </h1>
        )}
      </div>

      {/* -------- TRAITS -------- */}
      {subStep === 'traits' && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {traitsList.length}/{MAX_TRAITS} sélectionné
              {traitsList.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {AVAILABLE_TRAITS.map((trait) => {
              const rank = traitsList.indexOf(trait.value)
              const isSelected = rank !== -1
              return (
                <button
                  key={trait.value}
                  type="button"
                  onClick={() => toggleTrait(trait.value)}
                  aria-pressed={isSelected}
                  className={`relative p-4 rounded-2xl border-2 text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-foreground text-xs font-bold flex items-center justify-center border-2 border-background">
                      {rank + 1}
                    </div>
                  )}
                  {trait.label}
                </button>
              )
            })}
          </div>

          {traitsList.length > 0 && (
            <div className="mt-8">
              <p className="text-sm font-semibold mb-3">Ton classement :</p>
              <div className="space-y-2">
                {traitsList.map((value, index) => (
                  <div
                    key={value}
                    className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary/40 bg-primary/10"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">
                        {getTraitLabel(value)}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveTrait(index, -1)}
                        disabled={index === 0}
                        aria-label="Monter"
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTrait(index, 1)}
                        disabled={index === traitsList.length - 1}
                        aria-label="Descendre"
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* -------- TEST QUESTION (Oui/Non) -------- */}
      {subStep === 'test-question' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onUpdate({ has_taken_test: true })}
              aria-pressed={hasTakenTest}
              className={`p-6 rounded-2xl border-2 font-semibold transition-all ${
                hasTakenTest
                  ? 'border-primary bg-primary/20'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              Oui
              {hasTakenTest && <Check className="w-5 h-5 mx-auto mt-2" />}
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  has_taken_test: false,
                  test_type: '',
                  test_result: '',
                })
              }
              aria-pressed={!hasTakenTest}
              className={`p-6 rounded-2xl border-2 font-semibold transition-all ${
                !hasTakenTest
                  ? 'border-primary bg-primary/20'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              Non
              {!hasTakenTest && <Check className="w-5 h-5 mx-auto mt-2" />}
            </button>
          </div>

          {hasTakenTest && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="test-type">Quel test&nbsp;?</Label>
                <Select
                  value={testType}
                  onValueChange={(value) => onUpdate({ test_type: value })}
                >
                  <SelectTrigger id="test-type" className="w-full !h-12 rounded-full">
                    <SelectValue placeholder="Sélectionner un test" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_TYPES.map((test) => (
                      <SelectItem key={test.value} value={test.value}>
                        {test.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-result">Ton résultat :</Label>
                <Input
                  id="test-result"
                  placeholder="Ex : INTJ, Type D, 5w4..."
                  value={testResult}
                  onChange={(e) => onUpdate({ test_result: e.target.value })}
                  className="h-12 rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------- TEST INTRO -------- */}
      {subStep === 'test-intro' && (
        <div className="space-y-6">
          <div className="bg-muted/50 rounded-2xl p-6 space-y-4">
            <p className="text-sm">
              Ce mini-test va nous aider à mieux cerner comment tu fonctionnes
              au travail : ta manière de prendre des décisions, de collaborer,
              de gérer le stress et d&apos;aborder la nouveauté.
            </p>
            <p className="text-sm">
              Il comporte <strong>{INTEGRATED_TEST_QUESTIONS.length} questions</strong>{' '}
              simples — réponds spontanément, il n&apos;y a pas de bonne ou
              mauvaise réponse.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
              <Clock className="w-4 h-4" />
              <span>Environ 2 minutes</span>
            </div>
            {answeredCount > 0 && (
              <p className="text-xs text-primary font-medium">
                Tu avais déjà commencé — tu reprendras à la question{' '}
                {firstUnansweredIndex(testAnswers) + 1}.
              </p>
            )}
          </div>
        </div>
      )}

      {/* -------- TEST QUESTIONS -------- */}
      {subStep === 'test-questions' && currentQuestion && (
        <div className="space-y-6">
          <div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${testProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-muted/50 rounded-2xl p-6">
            <p className="text-lg font-medium text-center">
              {currentQuestion.text}
            </p>
          </div>

          <div className="space-y-3">
            {LIKERT_OPTIONS.map((option) => {
              const isSelected = currentAnswer === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectAnswer(option.value)}
                  aria-pressed={isSelected}
                  className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-background" />
                      )}
                    </div>
                    {option.label}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* -------- BOUTON SUIVANT / ENREGISTRER -------- */}
      <div className="mt-10">
        <Button
          onClick={handleNext}
          disabled={
            (subStep === 'traits' && !canContinueTraits) ||
            (subStep === 'test-question' && !canContinueTestQuestion) ||
            (subStep === 'test-questions' && !canContinueTestQuestions)
          }
          className="w-full h-14 rounded-full bg-primary text-foreground hover:bg-primary/90 text-base font-bold disabled:opacity-60"
        >
          {subStep === 'test-intro'
            ? 'Commencer le test'
            : subStep === 'test-questions' && isLastQuestion
              ? 'Enregistrer le résultat'
              : 'Suivant'}
        </Button>
      </div>
    </div>
  )
}
