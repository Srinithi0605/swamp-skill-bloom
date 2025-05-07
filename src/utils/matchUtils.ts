
interface UserSkill {
  id: string;
  type: string;
  skill: {
    id: string;
    name: string;
    category: string;
  };
}

interface User {
  id: string;
  skillsTeach: UserSkill[];
  skillsLearn: UserSkill[];
  skills: UserSkill[];
}

/**
 * Calculate match percentage between two users based on skill compatibility
 * @param currentUser Current logged in user
 * @param otherUser Other user to calculate match with
 * @returns Match percentage (0-100)
 */
export const calculateMatchPercentage = (currentUser: User, otherUser: User): number => {
  if (!currentUser || !otherUser) return 0;
  
  // Extract skill IDs that current user wants to learn and other user can teach
  const currentUserWantsToLearn = new Set(
    currentUser.skills
      .filter(skill => skill.type === 'learn')
      .map(skill => skill.skill.id)
  );
  
  const otherUserCanTeach = new Set(
    otherUser.skills
      .filter(skill => skill.type === 'teach')
      .map(skill => skill.skill.id)
  );
  
  // Extract skill IDs that current user can teach and other user wants to learn
  const currentUserCanTeach = new Set(
    currentUser.skills
      .filter(skill => skill.type === 'teach')
      .map(skill => skill.skill.id)
  );
  
  const otherUserWantsToLearn = new Set(
    otherUser.skills
      .filter(skill => skill.type === 'learn')
      .map(skill => skill.skill.id)
  );
  
  // Calculate match score based on skill overlaps
  let matchCount = 0;
  
  // Count skills other user can teach that current user wants to learn
  currentUserWantsToLearn.forEach(skillId => {
    if (otherUserCanTeach.has(skillId)) {
      matchCount++;
    }
  });
  
  // Count skills current user can teach that other user wants to learn
  currentUserCanTeach.forEach(skillId => {
    if (otherUserWantsToLearn.has(skillId)) {
      matchCount++;
    }
  });
  
  // Calculate total possible matches (max of skills each user has)
  const totalPossibleMatches = Math.max(
    currentUserWantsToLearn.size + currentUserCanTeach.size, 
    otherUserWantsToLearn.size + otherUserCanTeach.size
  );
  
  // Avoid division by zero
  if (totalPossibleMatches === 0) return 0;
  
  // Calculate percentage (0-100)
  const percentage = Math.round((matchCount / totalPossibleMatches) * 100);
  
  return percentage;
};

/**
 * Get skill matches between two users
 * @param currentUser Current logged in user
 * @param otherUser Other user to find matches with
 * @returns Object containing matched skills in both directions
 */
export const getSkillMatches = (currentUser: User, otherUser: User) => {
  if (!currentUser || !otherUser) {
    return { theyCanTeachMe: [], iCanTeachThem: [] };
  }
  
  // Skills the other user can teach that current user wants to learn
  const theyCanTeachMe = otherUser.skills
    .filter(skill => skill.type === 'teach')
    .filter(skill => 
      currentUser.skills
        .filter(mySkill => mySkill.type === 'learn')
        .some(mySkill => mySkill.skill.id === skill.skill.id)
    )
    .map(skill => skill.skill);
  
  // Skills the current user can teach that other user wants to learn
  const iCanTeachThem = currentUser.skills
    .filter(skill => skill.type === 'teach')
    .filter(skill => 
      otherUser.skills
        .filter(theirSkill => theirSkill.type === 'learn')
        .some(theirSkill => theirSkill.skill.id === skill.skill.id)
    )
    .map(skill => skill.skill);
  
  return { theyCanTeachMe, iCanTeachThem };
};
