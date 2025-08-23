import { RecurrentPayment, SavingsProfile } from "./schema"
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from "uuid";

type TypeMap = {
  'SavingsProfile': SavingsProfile,
  'RecurrentPayment': RecurrentPayment
}

const DatabaseFileMap = {
  'SavingsProfile': 'savings.json',
  'RecurrentPayment': 'recurrent_payments.json'
} as const

type TypeList = keyof TypeMap

export function mapDatabaseOperation<T extends TypeList, Args extends Array<any>, ReturnType>(func: (type: T, ...args: Args) => ReturnType, type: T) {
  return (...args: Args) => func(type, ...args)
}

function readAll<T extends TypeList>(type: T): TypeMap[T][] {
  type Type = TypeMap[T]

  try {
    const databaseFile = path.join(__dirname, "../db/" + DatabaseFileMap[type])
    const data = fs.readFileSync(databaseFile, "utf-8");
    const items: Type[] = JSON.parse(data);
    return items;
  } catch (error) {
    console.error(`Error reading ${DatabaseFileMap[type]} file:`, error);
    return [];
  }
}

function writeAll<T extends TypeList>(type: T, items: TypeMap[T][]): void {
  try {
    const databaseFile = path.join(__dirname, "../db/" + DatabaseFileMap[type])
    fs.writeFileSync(databaseFile, JSON.stringify(items, null, 2));
  } catch (error) {
    console.error(`Error writing ${DatabaseFileMap[type]} file:`, error);
  }
}

export function create<T extends TypeList>(type: T, data: Omit<TypeMap[T], "id">): TypeMap[T] {
  type Type = TypeMap[T]

  const items = readAll(type);
  const newItem = {
    id: uuidv4(),
    ...data,
  } as Type;

  items.push(newItem);
  writeAll(type, items);
  return newItem;
}

export function getAll<T extends TypeList>(type: T): TypeMap[T][] {
  return readAll(type);
}

export function getById<T extends TypeList>(type: T, id: string): TypeMap[T] | undefined {
  const items = readAll(type);
  return items.find((item) => item.id === id);
}

export function updateById<T extends TypeList>(
  type: T,
  id: string,
  updatedData: Partial<Omit<TypeMap[T], "id">>
): TypeMap[T] | undefined {
  const items = readAll(type);
  const itemIndex = items.findIndex((item) => item.id === id);

  if (itemIndex === -1) {
    return undefined;
  }

  items[itemIndex] = {
    ...items[itemIndex],
    ...updatedData,
  };

  writeAll(type, items);
  return items[itemIndex];
}

export function deleteById<T extends TypeList>(type: T, id: string): boolean {
  const items = readAll(type);
  const initialLength = items.length;

  const filteredItems = items.filter((item) => item.id !== id);

  if (filteredItems.length === initialLength) {
    return false;
  }

  writeAll(type, filteredItems);
  return true;
}
