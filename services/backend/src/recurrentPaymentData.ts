import { create, deleteById, getAll, getById, mapDatabaseOperation, updateById } from "./dataHelpers";

export const createRecurrentPayment = mapDatabaseOperation(create, 'RecurrentPayment')
export const getAllRecurrentPayments = mapDatabaseOperation(getAll, 'RecurrentPayment')
export const getRecurrentPaymentById = mapDatabaseOperation(getById, 'RecurrentPayment')
export const updateRecurrentPayment = mapDatabaseOperation(updateById, 'RecurrentPayment')
export const deleteRecurrentPayment = mapDatabaseOperation(deleteById, 'RecurrentPayment')