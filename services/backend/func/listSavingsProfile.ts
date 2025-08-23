import { getData } from "../src/getData";
import { SavingsProfile } from "../src/schema";
import { v4 as uuidv4 } from "uuid";

export function listSavingsProfiles() {
  return getData().savingsProfiles
}

export function listSavingsProfile(profileId: string) {
  const profile = getData().savingsProfiles.find(profile => profile.id === profileId)
  if(!profile) return

  return profile
}

export function createSavingsProfile(info: {
  name: string,
  targetAmount: number,
  targetDate?: number
}) {
  const profile: SavingsProfile = {
    id: uuidv4(),
    name: info.name,
    currentAmount: 0,
    targetAmount: info.targetAmount,
    startDate: new Date().toISOString(),
    targetDate: info.targetDate ? new Date(info.targetDate).toISOString() : undefined,
    category: 'TODO',
  }

  // TODO
}