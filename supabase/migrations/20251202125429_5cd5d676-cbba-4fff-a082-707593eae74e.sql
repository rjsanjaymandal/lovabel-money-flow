-- Create user_stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for user_stats
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats" ON public.user_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.user_stats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON public.user_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for achievements (Read-only for users)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view achievements" ON public.achievements
    FOR SELECT USING (true);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    achievement_id UUID REFERENCES public.achievements(id) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- Enable RLS for user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (code, name, description, icon, xp_reward) VALUES
('FIRST_STEP', 'First Step', 'Add your first transaction', 'Footprints', 50),
('BUDGET_BOSS', 'Budget Boss', 'Set your first budget', 'Target', 100),
('SAVINGS_STAR', 'Savings Star', 'End the month with income > expenses', 'Star', 200),
('STREAK_7', 'Week Warrior', 'Reach a 7-day streak', 'Flame', 150),
('BIG_SPENDER', 'Big Spender', 'Add a transaction over ₹5000', 'CreditCard', 50)
ON CONFLICT (code) DO NOTHING;