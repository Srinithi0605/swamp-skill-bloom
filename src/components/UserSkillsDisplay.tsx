
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Skill {
  id: string;
  name: string;
  category: string;
  type: 'teach' | 'learn';
}

interface UserSkillsDisplayProps {
  skills: Skill[];
  className?: string;
}

const UserSkillsDisplay = ({ skills, className = '' }: UserSkillsDisplayProps) => {
  const teachSkills = skills.filter(skill => skill.type === 'teach');
  const learnSkills = skills.filter(skill => skill.type === 'learn');

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold mb-3 dark:text-white">Skills I Can Teach</h3>
        {teachSkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachSkills.map(skill => (
              <div key={skill.id} className="border rounded-lg p-4 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <h4 className="font-medium dark:text-white">{skill.name}</h4>
                <Badge variant="secondary" className="mt-2">
                  {skill.category}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No teaching skills listed</p>
        )}
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3 dark:text-white">Skills I Want to Learn</h3>
        {learnSkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learnSkills.map(skill => (
              <div key={skill.id} className="border rounded-lg p-4 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <h4 className="font-medium dark:text-white">{skill.name}</h4>
                <Badge variant="outline" className="mt-2 dark:text-gray-300">
                  {skill.category}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No learning skills listed</p>
        )}
      </div>
    </div>
  );
};

export default UserSkillsDisplay;
