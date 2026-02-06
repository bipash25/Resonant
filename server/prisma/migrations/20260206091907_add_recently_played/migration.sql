-- CreateTable
CREATE TABLE "recently_played" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recently_played_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recently_played_user_id_played_at_idx" ON "recently_played"("user_id", "played_at" DESC);

-- AddForeignKey
ALTER TABLE "recently_played" ADD CONSTRAINT "recently_played_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_played" ADD CONSTRAINT "recently_played_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
