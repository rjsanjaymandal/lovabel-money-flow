-- Migration to add has_drawn_this_turn and updated_at trigger to uno_game_states

-- 1. Add has_drawn_this_turn column
ALTER TABLE uno_game_states 
ADD COLUMN IF NOT EXISTS has_drawn_this_turn boolean NOT NULL DEFAULT false;

-- 2. Create updated_at trigger if doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_uno_game_states_updated_at ON uno_game_states;
CREATE TRIGGER update_uno_game_states_updated_at
    BEFORE UPDATE ON uno_game_states
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 3. Add unique constraint to uno_rooms.code to prevent collisions
ALTER TABLE uno_rooms
ADD CONSTRAINT uno_rooms_code_key UNIQUE (code);
