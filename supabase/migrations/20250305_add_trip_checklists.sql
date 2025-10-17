-- Create checklists table to support personal and group trip lists
CREATE TABLE IF NOT EXISTS public.checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('personal', 'group')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT checklists_owner_type_check CHECK (
        (type = 'personal' AND owner_id IS NOT NULL) OR
        (type = 'group' AND owner_id IS NULL)
    )
);

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

-- Ensure one personal checklist per user/trip and one shared group checklist per trip
CREATE UNIQUE INDEX IF NOT EXISTS checklists_trip_owner_personal_idx
    ON public.checklists (trip_id, owner_id)
    WHERE type = 'personal';

CREATE UNIQUE INDEX IF NOT EXISTS checklists_trip_group_unique_idx
    ON public.checklists (trip_id)
    WHERE type = 'group';

-- Keep updated_at column fresh on updates
DROP TRIGGER IF EXISTS update_checklists_updated_at ON public.checklists;
CREATE TRIGGER update_checklists_updated_at
    BEFORE UPDATE ON public.checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Policies for checklist access
CREATE POLICY "Users can view accessible checklists"
    ON public.checklists
    FOR SELECT
    USING (
        (type = 'personal' AND owner_id = auth.uid()) OR
        (
            type = 'group' AND EXISTS (
                SELECT 1
                FROM public.trips t
                WHERE t.id = public.checklists.trip_id
                  AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
            )
        )
    );

CREATE POLICY "Users can insert personal or group checklists"
    ON public.checklists
    FOR INSERT
    WITH CHECK (
        (
            type = 'personal'
            AND owner_id = auth.uid()
            AND EXISTS (
                SELECT 1
                FROM public.trips t
                WHERE t.id = public.checklists.trip_id
                  AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
            )
        ) OR (
            type = 'group'
            AND owner_id IS NULL
            AND EXISTS (
                SELECT 1
                FROM public.trips t
                WHERE t.id = public.checklists.trip_id
                  AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
            )
        )
    );

CREATE POLICY "Users can update accessible checklists"
    ON public.checklists
    FOR UPDATE
    USING (
        (type = 'personal' AND owner_id = auth.uid()) OR
        (
            type = 'group' AND EXISTS (
                SELECT 1
                FROM public.trips t
                WHERE t.id = public.checklists.trip_id
                  AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
            )
        )
    )
    WITH CHECK (
        (type = 'personal' AND owner_id = auth.uid()) OR
        (
            type = 'group' AND EXISTS (
                SELECT 1
                FROM public.trips t
                WHERE t.id = public.checklists.trip_id
                  AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
            )
        )
    );

CREATE POLICY "Users can delete accessible checklists"
    ON public.checklists
    FOR DELETE
    USING (
        (type = 'personal' AND owner_id = auth.uid()) OR
        (
            type = 'group' AND EXISTS (
                SELECT 1
                FROM public.trips t
                WHERE t.id = public.checklists.trip_id
                  AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
            )
        )
    );

COMMENT ON TABLE public.checklists IS 'Stores personal and group checklists for trips.';
COMMENT ON COLUMN public.checklists.owner_id IS 'Owner for personal checklists; NULL for group checklists.';

-- Checklist items table
CREATE TABLE IF NOT EXISTS public.checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_checked BOOLEAN NOT NULL DEFAULT false,
    item_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS checklist_items_order_idx
    ON public.checklist_items (checklist_id, item_order);

CREATE INDEX IF NOT EXISTS checklist_items_checklist_id_idx
    ON public.checklist_items (checklist_id);

DROP TRIGGER IF EXISTS update_checklist_items_updated_at ON public.checklist_items;
CREATE TRIGGER update_checklist_items_updated_at
    BEFORE UPDATE ON public.checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Policies for checklist items leverage checklist ownership rules
CREATE POLICY "Users can view checklist items"
    ON public.checklist_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.checklists c
            JOIN public.trips t ON t.id = c.trip_id
            WHERE c.id = public.checklist_items.checklist_id
              AND (
                (c.type = 'personal' AND c.owner_id = auth.uid()) OR
                (c.type = 'group' AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid())))
              )
        )
    );

CREATE POLICY "Users can insert checklist items"
    ON public.checklist_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.checklists c
            JOIN public.trips t ON t.id = c.trip_id
            WHERE c.id = public.checklist_items.checklist_id
              AND (
                (c.type = 'personal' AND c.owner_id = auth.uid()) OR
                (c.type = 'group' AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid())))
              )
        )
    );

CREATE POLICY "Users can update checklist items"
    ON public.checklist_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.checklists c
            JOIN public.trips t ON t.id = c.trip_id
            WHERE c.id = public.checklist_items.checklist_id
              AND (
                (c.type = 'personal' AND c.owner_id = auth.uid()) OR
                (c.type = 'group' AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid())))
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.checklists c
            JOIN public.trips t ON t.id = c.trip_id
            WHERE c.id = public.checklist_items.checklist_id
              AND (
                (c.type = 'personal' AND c.owner_id = auth.uid()) OR
                (c.type = 'group' AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid())))
              )
        )
    );

CREATE POLICY "Users can delete checklist items"
    ON public.checklist_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.checklists c
            JOIN public.trips t ON t.id = c.trip_id
            WHERE c.id = public.checklist_items.checklist_id
              AND (
                (c.type = 'personal' AND c.owner_id = auth.uid()) OR
                (c.type = 'group' AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid())))
              )
        )
    );

COMMENT ON TABLE public.checklist_items IS 'Items that belong to a trip checklist.';
