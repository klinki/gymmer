import { ulid } from 'ulidx';
import { Exercise, Training, TrainingPlan, ExerciseExecution } from '../../src/app/models';

export const generateMockData = () => {
  const exercises: Exercise[] = [];
  const trainingPlans: TrainingPlan[] = [];
  const trainings: Training[] = [];
  const exerciseExecutions: ExerciseExecution[] = [];

  // 1. Generate 50 Exercises
  for (let i = 1; i <= 50; i++) {
    exercises.push({
      id: ulid(),
      name: `Exercise ${i}`,
      hidden: false
    });
  }

  // 2. Generate 20 Training Plans
  // User wanted 20 plans to debug scrolling
  for (let i = 1; i <= 20; i++) {
    // Pick 10 random exercises for the plan
    const shuffled = [...exercises].sort(() => 0.5 - Math.random());
    const planExercises = shuffled.slice(0, 10);

    trainingPlans.push({
      id: ulid(),
      name: `Training Plan ${i}`,
      exercises: planExercises
    });
  }

  // 3. Generate 50 Completed Trainings
  // User wanted 50 completed trainings
  const today = new Date();
  for (let i = 1; i <= 50; i++) {
    const trainingId = ulid();
    // Date: i days ago
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // User wanted 20 exercises per training to debug scrolling
    const shuffled = [...exercises].sort(() => 0.5 - Math.random());
    const selectedExercises = shuffled.slice(0, 20);

    const plan = i % 2 === 0 ? trainingPlans[i % 20] : undefined;

    const trainingExercises: ExerciseExecution[] = [];

    selectedExercises.forEach(ex => {
        const execId = ulid();
        const execution: ExerciseExecution = {
            ...ex,
            id: execId,
            exerciseId: ex.id,
            date: date,
            series: [
                { weight: 20, repetitions: 12 },
                { weight: 20, repetitions: 12 },
                { weight: 20, repetitions: 12 }
            ]
        };
        trainingExercises.push(execution);
        exerciseExecutions.push(execution);
    });

    trainings.push({
        id: trainingId,
        name: plan ? `Training ${i} (${plan.name})` : `Training ${i}`,
        startDate: date,
        endDate: new Date(date.getTime() + 60 * 60 * 1000), // 1 hour later
        exercises: trainingExercises,
        trainingPlanId: plan?.id
    });
  }

  return {
    exercises,
    trainingPlans,
    trainings,
    exerciseExecutions
  };
};
