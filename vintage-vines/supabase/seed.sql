-- Local/dev-only sample data for Vintage Vines.
--
-- Section 17 (build sequence): "Seed data stays local or test-only so
-- production launches empty." Never run this against the production
-- Supabase project — it exists so Phase 3+ development and tests have
-- something to look at without a developer photographing real pieces.
-- Images reference placeholder storage keys; no real files back them
-- until an admin uploads through the app.

insert into inventory_items (
  slug, status, display_name, plant_description, price_cents, size_class,
  light_levels, care_difficulty, pet_safety,
  plant_common_name, plant_botanical_name, vessel_name, vessel_material,
  vessel_style_tags, directional_placement, watering,
  dimensions_height_in, dimensions_width_in,
  featured, sort_order, published_at
) values
  (
    'betty-snake-plant-brass-tumbler',
    'available',
    'Betty',
    'Snake plant in brass tumbler',
    2000,
    'standard',
    array['low', 'medium'],
    'easy',
    'unknown',
    'Snake plant',
    'Dracaena trifasciata',
    'Brass etched tumbler',
    'brass',
    array['brass', 'minimal'],
    'Tolerates a north-facing room several feet back from the window; gentle morning sun is fine, but keep it out of hot afternoon sun.',
    'infrequent',
    10,
    4,
    true,
    1,
    now()
  ),
  (
    'margot-pothos-stoneware-crock',
    'available',
    'Margot',
    'Pothos in stoneware crock',
    1000,
    'small',
    array['medium', 'high'],
    'easy',
    'unknown',
    'Pothos',
    'Epipremnum aureum',
    'Vintage stoneware crock',
    'stoneware',
    array['stoneware', 'neutral'],
    'Best a few feet back from an east-facing window; avoid several hours of direct afternoon sun.',
    'regular',
    8,
    5,
    false,
    2,
    now()
  ),
  (
    'harold-philodendron-ceramic-teapot',
    'draft',
    'Harold',
    'Philodendron in cottage ceramic teapot',
    4000,
    'large',
    array['medium'],
    'moderate',
    'unknown',
    null,
    null,
    'Cottage ceramic teapot',
    'ceramic',
    array['ceramic', 'cottage'],
    null,
    null,
    12,
    7,
    false,
    3,
    null
  );
