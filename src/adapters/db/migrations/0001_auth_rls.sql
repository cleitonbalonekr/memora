ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "decks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cards" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "profiles" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "decks" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "cards" TO authenticated;
--> statement-breakpoint
CREATE POLICY "profiles_select_own"
ON "profiles"
FOR SELECT
TO authenticated
USING ((select auth.uid()) = "id");
--> statement-breakpoint
CREATE POLICY "profiles_insert_own"
ON "profiles"
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = "id");
--> statement-breakpoint
CREATE POLICY "profiles_update_own"
ON "profiles"
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = "id")
WITH CHECK ((select auth.uid()) = "id");
--> statement-breakpoint
CREATE POLICY "decks_select_own"
ON "decks"
FOR SELECT
TO authenticated
USING ((select auth.uid()) = "user_id");
--> statement-breakpoint
CREATE POLICY "decks_insert_own"
ON "decks"
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = "user_id");
--> statement-breakpoint
CREATE POLICY "decks_update_own"
ON "decks"
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = "user_id")
WITH CHECK ((select auth.uid()) = "user_id");
--> statement-breakpoint
CREATE POLICY "decks_delete_own"
ON "decks"
FOR DELETE
TO authenticated
USING ((select auth.uid()) = "user_id");
--> statement-breakpoint
CREATE POLICY "cards_select_own_deck"
ON "cards"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "decks"
    WHERE "decks"."id" = "cards"."deck_id"
      AND "decks"."user_id" = (select auth.uid())
  )
);
--> statement-breakpoint
CREATE POLICY "cards_insert_own_deck"
ON "cards"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "decks"
    WHERE "decks"."id" = "cards"."deck_id"
      AND "decks"."user_id" = (select auth.uid())
  )
);
--> statement-breakpoint
CREATE POLICY "cards_update_own_deck"
ON "cards"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "decks"
    WHERE "decks"."id" = "cards"."deck_id"
      AND "decks"."user_id" = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "decks"
    WHERE "decks"."id" = "cards"."deck_id"
      AND "decks"."user_id" = (select auth.uid())
  )
);
--> statement-breakpoint
CREATE POLICY "cards_delete_own_deck"
ON "cards"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "decks"
    WHERE "decks"."id" = "cards"."deck_id"
      AND "decks"."user_id" = (select auth.uid())
  )
);
