-- Allow a testimonial to record that it was written on Google.
--
-- The words in a Google review belong to the client and are already public
-- there. Copying them onto the site is fair, but storing them as if the client
-- had typed them into the app misstates where they came from, and provenance is
-- exactly what makes a testimonial believable. With this value the card can say
-- "Avaliação no Google" and link to the place anyone can check it.
--
-- Run in the Supabase SQL Editor.

ALTER TABLE testimonials
  DROP CONSTRAINT IF EXISTS testimonials_source_check;

ALTER TABLE testimonials
  ADD CONSTRAINT testimonials_source_check
  CHECK (source IN ('manual', 'trial', 'google'));
