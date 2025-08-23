import { create, deleteById, getAll, getById, mapDatabaseOperation, updateById } from "./dataHelpers";

export const createGoal = mapDatabaseOperation(create, 'SavingsProfile')
export const getAllGoals = mapDatabaseOperation(getAll, 'SavingsProfile')
export const getGoalById = mapDatabaseOperation(getById, 'SavingsProfile')
export const updateGoal = mapDatabaseOperation(updateById, 'SavingsProfile')
export const deleteGoal = mapDatabaseOperation(deleteById, 'SavingsProfile')