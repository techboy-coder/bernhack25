import { getData } from "../src/getData";
import { SavingsProfile } from "../src/schema";
import { v4 as uuidv4 } from "uuid";

/**
 * Retrieves all savings profiles from the database
 *
 * @returns {SavingsProfile[]} Array of all savings profiles with their current progress,
 *                            target amounts, dates, and categories
 */
export function listSavingsProfiles() {
  return getData().savingsProfiles;
}

/**
 * Retrieves a specific savings profile by its ID
 *
 * @param {string} profileId - The unique identifier of the savings profile
 * @returns {SavingsProfile | undefined} The savings profile if found, undefined otherwise
 *
 * @example
 * const profile = listSavingsProfile('123e4567-e89b-12d3-a456-426614174000');
 * if (profile) {
 *   console.log(`Progress: ${profile.currentAmount}/${profile.targetAmount}`);
 * }
 */
export function listSavingsProfile(profileId: string) {
  const profile = getData().savingsProfiles.find(
    (profile) => profile.id === profileId
  );
  if (!profile) return;

  return profile;
}

/**
 * Creates a new savings profile with the provided information
 *
 * @param {Object} info - The savings profile information
 * @param {string} info.name - Display name for the savings goal
 * @param {number} info.targetAmount - Target amount to save (must be positive)
 * @param {number} [info.targetDate] - Optional target completion date as timestamp
 * @returns {SavingsProfile} The created savings profile with generated ID and current date
 *
 * @example
 * const newProfile = createSavingsProfile({
 *   name: "Emergency Fund",
 *   targetAmount: 10000,
 *   targetDate: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year from now
 * });
 */
export function createSavingsProfile(info: {
  name: string;
  targetAmount: number;
  targetDate?: number;
}): SavingsProfile {
  const profile: SavingsProfile = {
    id: uuidv4(),
    name: info.name,
    currentAmount: 0,
    targetAmount: info.targetAmount,
    startDate: new Date().toISOString(),
    targetDate: info.targetDate
      ? new Date(info.targetDate).toISOString()
      : undefined,
    category: "TODO",
  };

  // TODO: Add profile to database when persistence is implemented
  return profile;
}
