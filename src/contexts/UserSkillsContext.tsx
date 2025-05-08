
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Skill {
  id: string;
  name: string;
  category: string;
  type: 'teach' | 'learn';
}

interface UserSkillsContextType {
  skillsOffered: Skill[];
  skillsWanted: Skill[];
  isLoading: boolean;
  fetchUserSkills: () => Promise<void>;
  handleDeleteSkill: (skillId: string, type: 'teach' | 'learn') => Promise<void>;
  handleAddSkill: (newSkill: { name: string; category: string; type: 'teach' | 'learn' }) => Promise<void>;
}

const UserSkillsContext = createContext<UserSkillsContextType | undefined>(undefined);

export const useUserSkills = () => {
  const context = useContext(UserSkillsContext);
  if (context === undefined) {
    throw new Error('useUserSkills must be used within a UserSkillsProvider');
  }
  return context;
};

export const UserSkillsProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [skillsOffered, setSkillsOffered] = useState<Skill[]>([]);
  const [skillsWanted, setSkillsWanted] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserSkills = async () => {
    if (!authUser) return;
    
    setIsLoading(true);
    try {
      // Fetch user skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('user_skills')
        .select(`
          id,
          type,
          skill:skills (
            id,
            name,
            category
          )
        `)
        .eq('user_id', authUser.id);

      if (skillsError) throw skillsError;

      const teachingSkills = skillsData
        .filter(s => s.type === 'teach')
        .map(s => ({
          id: s.skill.id,
          name: s.skill.name,
          category: s.skill.category,
          type: 'teach' as const
        }));

      const learningSkills = skillsData
        .filter(s => s.type === 'learn')
        .map(s => ({
          id: s.skill.id,
          name: s.skill.name,
          category: s.skill.category,
          type: 'learn' as const
        }));

      setSkillsOffered(teachingSkills);
      setSkillsWanted(learningSkills);
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast({
        title: "Error",
        description: "Failed to load skills data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSkill = async (skillId: string, type: 'teach' | 'learn') => {
    try {
      const { error } = await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', authUser?.id)
        .eq('skill_id', skillId)
        .eq('type', type);

      if (error) throw error;

      if (type === 'teach') {
        setSkillsOffered(prev => prev.filter(skill => skill.id !== skillId));
      } else {
        setSkillsWanted(prev => prev.filter(skill => skill.id !== skillId));
      }

      toast({
        title: "Success",
        description: "Skill removed successfully"
      });
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast({
        title: "Error",
        description: "Failed to remove skill",
        variant: "destructive"
      });
    }
  };

  const handleAddSkill = async (newSkill: { name: string; category: string; type: 'teach' | 'learn' }) => {
    if (!authUser || !newSkill.name || !newSkill.category) {
      toast({
        title: "Error",
        description: "Please fill in all skill fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // First, check if skill exists
      let { data: existingSkill, error: skillError } = await supabase
        .from('skills')
        .select('id')
        .eq('name', newSkill.name)
        .single();

      if (skillError && skillError.code !== 'PGRST116') {
        throw skillError;
      }

      let skillId;
      if (!existingSkill) {
        // Create new skill if it doesn't exist
        const { data: newSkillData, error: createError } = await supabase
          .from('skills')
          .insert({
            name: newSkill.name,
            category: newSkill.category
          })
          .select()
          .single();

        if (createError) throw createError;
        skillId = newSkillData.id;
      } else {
        skillId = existingSkill.id;
      }

      // Add skill to user_skills
      const { error: userSkillError } = await supabase
        .from('user_skills')
        .insert({
          user_id: authUser.id,
          skill_id: skillId,
          type: newSkill.type
        });

      if (userSkillError) throw userSkillError;

      // Refresh skills list
      await fetchUserSkills();
      
      toast({
        title: "Success",
        description: "Skill added successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error adding skill:', error);
      toast({
        title: "Error",
        description: "Failed to add skill",
        variant: "destructive"
      });
      return false;
    }
  };

  // Fetch skills when the authenticated user changes
  useEffect(() => {
    if (authUser) {
      fetchUserSkills();
    }
  }, [authUser]);

  // Set up realtime subscription to detect skill changes
  useEffect(() => {
    if (!authUser) return;
    
    const channel = supabase
      .channel('user_skills_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for inserts, updates, and deletes
          schema: 'public',
          table: 'user_skills',
          filter: `user_id=eq.${authUser.id}`,
        } as any,
        () => {
          fetchUserSkills();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser]);

  const value = {
    skillsOffered,
    skillsWanted,
    isLoading,
    fetchUserSkills,
    handleDeleteSkill,
    handleAddSkill
  };

  return (
    <UserSkillsContext.Provider value={value}>
      {children}
    </UserSkillsContext.Provider>
  );
};
