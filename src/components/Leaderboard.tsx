
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type LeaderboardUser = {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar: string | null;
  avatar_url: string | null;
  avg_mastery: number;
};

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      
      try {
        console.log('Starting leaderboard fetch...');
        
        // First, let's try to use the existing view if it works properly
        const { data: viewData, error: viewError } = await supabase
          .from('leaderboard_top5')
          .select('*')
          .order('avg_mastery', { ascending: false });

        if (!viewError && viewData && viewData.length > 0) {
          console.log('Using view data:', viewData);
          const formattedData = viewData.map(item => ({
            user_id: item.user_id || '',
            username: item.username,
            full_name: null, // View doesn't include full_name
            avatar: item.avatar,
            avatar_url: null, // View doesn't include avatar_url
            avg_mastery: item.avg_mastery || 0
          }));
          setLeaders(formattedData);
          setLoading(false);
          return;
        }

        console.log('View failed or empty, falling back to manual calculation');

        // Fallback: Manual calculation
        // Fetch all profiles without any user filtering
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, avatar, avatar_url');

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setLeaders([]);
          setLoading(false);
          return;
        }

        if (!profiles || profiles.length === 0) {
          console.log('No profiles found');
          setLeaders([]);
          setLoading(false);
          return;
        }

        console.log('Fetched profiles:', profiles);

        // Fetch ALL mastery data without user filtering
        const { data: masteryData, error: masteryError } = await supabase
          .from('user_mastery')
          .select('user_id, mastery_level');

        if (masteryError) {
          console.error('Error fetching mastery data:', masteryError);
          // Continue even if mastery fetch fails
        }

        console.log('Fetched mastery data:', masteryData);

        // Calculate average mastery for each user
        const userMasteryMap = new Map();
        
        // Initialize all users with default values
        profiles.forEach(profile => {
          userMasteryMap.set(profile.user_id, {
            user_id: profile.user_id,
            username: profile.username,
            full_name: profile.full_name,
            avatar: profile.avatar,
            avatar_url: profile.avatar_url,
            total_mastery: 0,
            count: 0,
            avg_mastery: 0
          });
        });

        // Add mastery data if available
        if (masteryData && masteryData.length > 0) {
          masteryData.forEach(item => {
            const user = userMasteryMap.get(item.user_id);
            if (user) {
              user.total_mastery += item.mastery_level;
              user.count += 1;
            }
          });
        }

        // Calculate averages and create final leaderboard
        const leaderboardData = Array.from(userMasteryMap.values())
          .map(user => ({
            user_id: user.user_id,
            username: user.username,
            full_name: user.full_name,
            avatar: user.avatar,
            avatar_url: user.avatar_url,
            avg_mastery: user.count > 0 ? user.total_mastery / user.count : 0
          }))
          .sort((a, b) => b.avg_mastery - a.avg_mastery)
          .slice(0, 5);

        console.log('Final leaderboard data:', leaderboardData);
        setLeaders(leaderboardData);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaders([]);
      }
      
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const getDisplayName = (user: LeaderboardUser) => {
    if (user.full_name && user.full_name.trim()) {
      return user.full_name;
    }
    if (user.username && user.username.trim()) {
      return user.username;
    }
    return "Anonymous User";
  };

  const getAvatarFallback = (user: LeaderboardUser) => {
    if (user.avatar && user.avatar.trim()) {
      return user.avatar;
    }
    // Use first letter of name or a default emoji
    const name = getDisplayName(user);
    if (name !== "Anonymous User") {
      return name.charAt(0).toUpperCase();
    }
    return "👤";
  };

  return (
    <Card className="mb-8 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-2xl flex gap-2 items-center">
          <Crown className="text-yellow-400" size={28} />
          Global Leaderboard
        </CardTitle>
        <div className="text-muted-foreground">
          {leaders.length > 0 ? `Top ${leaders.length} user${leaders.length > 1 ? 's' : ''} by mastery level` : 'Top 5 users by mastery level'}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse text-gray-500 text-center p-4">
            Loading leaderboard...
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            No users found. Be the first to join and start learning!
          </div>
        ) : (
          <>
            <ol className="space-y-3">
              {leaders.map((user, idx) => (
                <li
                  key={user.user_id}
                  className={`flex items-center gap-4 px-2 py-2 rounded-lg ${
                    idx === 0
                      ? "bg-yellow-50 dark:bg-yellow-900/20 font-bold"
                      : "bg-gray-100/80 dark:bg-gray-900/40"
                  }`}
                >
                  <div className="text-xl font-bold w-6 text-center">{idx + 1}</div>
                  <Avatar>
                    {user.avatar_url ? (
                      <AvatarImage 
                        src={user.avatar_url} 
                        alt="Avatar"
                        onError={(e) => {
                          // Fallback to emoji/letter if image fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl">
                      {getAvatarFallback(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <span className="text-base">{getDisplayName(user)}</span>
                    {user.full_name && user.username && (
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    )}
                  </div>
                  <div className="font-mono text-lg text-blue-600 dark:text-blue-300">
                    {(user.avg_mastery * 100).toFixed(1)}%
                  </div>
                </li>
              ))}
            </ol>
            {leaders.length < 5 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                🎯 Invite more users to see a fuller leaderboard!
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
