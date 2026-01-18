-- 1. Freelancer Teams (Team Up)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS looking_for_team boolean DEFAULT false;

-- 2. Project Kanban Board
CREATE TABLE IF NOT EXISTS projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_members (
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    role text DEFAULT 'member', -- 'owner', 'member'
    joined_at timestamptz DEFAULT now(),
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS kanban_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    status text DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
    assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS Policies for Projects

-- Projects: Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM project_members WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid()));
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update projects" ON projects FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete projects" ON projects FOR DELETE USING (auth.uid() = owner_id);

-- Project Members: Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view project members" ON project_members FOR SELECT USING (EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid()));
CREATE POLICY "Owners can manage members" ON project_members FOR ALL USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.owner_id = auth.uid()));

-- Kanban Tasks: Enable RLS
ALTER TABLE kanban_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view tasks" ON kanban_tasks FOR SELECT USING (EXISTS (SELECT 1 FROM project_members WHERE project_members.project_id = kanban_tasks.project_id AND project_members.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM projects WHERE projects.id = kanban_tasks.project_id AND projects.owner_id = auth.uid()));
CREATE POLICY "Members can manage tasks" ON kanban_tasks FOR ALL USING (EXISTS (SELECT 1 FROM project_members WHERE project_members.project_id = kanban_tasks.project_id AND project_members.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM projects WHERE projects.id = kanban_tasks.project_id AND projects.owner_id = auth.uid()));


-- 3. Feedback Form Table
CREATE TABLE IF NOT EXISTS user_feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    message text NOT NULL,
    rating integer, -- 1-5 optional
    page_url text,
    created_at timestamptz DEFAULT now()
);

-- RLS for Feedback
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit feedback" ON user_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view feedback" ON user_feedback FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
