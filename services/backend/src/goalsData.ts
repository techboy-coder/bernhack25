import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Path to the goals JSON file
const goalsFilePath = path.join(__dirname, "../db/goals.json");

// Types for our goals data
export interface SavingsGoal {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  startDate: string;
  targetDate?: string;
  category: string;
}

// Interface for the database file structure
interface GoalsDatabase {
  goals: SavingsGoal[];
}

// Read goals from the JSON file
export function readGoals(): SavingsGoal[] {
  try {
    const data = fs.readFileSync(goalsFilePath, "utf-8");
    const db: GoalsDatabase = JSON.parse(data);
    return db.goals;
  } catch (error) {
    console.error("Error reading goals file:", error);
    return [];
  }
}

// Write goals to the JSON file
export function writeGoals(goals: SavingsGoal[]): void {
  try {
    const db: GoalsDatabase = { goals };
    fs.writeFileSync(goalsFilePath, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error("Error writing goals file:", error);
  }
}

// Create a new savings goal
export function createGoal(goalData: Omit<SavingsGoal, "id">): SavingsGoal {
  const goals = readGoals();
  const newGoal: SavingsGoal = {
    id: uuidv4(),
    ...goalData,
  };

  goals.push(newGoal);
  writeGoals(goals);
  return newGoal;
}

// Get all savings goals
export function getAllGoals(): SavingsGoal[] {
  return readGoals();
}

// Get a specific goal by ID
export function getGoalById(id: string): SavingsGoal | undefined {
  const goals = readGoals();
  return goals.find((goal) => goal.id === id);
}

// Update a savings goal
export function updateGoal(
  id: string,
  updatedData: Partial<Omit<SavingsGoal, "id">>
): SavingsGoal | undefined {
  const goals = readGoals();
  const goalIndex = goals.findIndex((goal) => goal.id === id);

  if (goalIndex === -1) {
    return undefined;
  }

  // Update the goal with new data while preserving the id
  goals[goalIndex] = {
    ...goals[goalIndex],
    ...updatedData,
  };

  writeGoals(goals);
  return goals[goalIndex];
}

// Delete a savings goal
export function deleteGoal(id: string): boolean {
  const goals = readGoals();
  const initialLength = goals.length;

  const filteredGoals = goals.filter((goal) => goal.id !== id);

  if (filteredGoals.length === initialLength) {
    return false;
  }

  writeGoals(filteredGoals);
  return true;
}
