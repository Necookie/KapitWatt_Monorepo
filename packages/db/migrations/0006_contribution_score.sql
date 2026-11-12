-- KapitWatt 0006: Contribution Score.
--
-- The trust score is now shown to households as their Contribution Score, and a new account starts
-- at 25 (TRUST.start in packages/shared/src/constants.ts) instead of 50. Only the default changes:
-- households that already exist keep the score they have. The demo reset sets the demo accounts back
-- to the start and recreates the simulated households.
alter table households alter column trust_score set default 25;
