-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Linked to auth.users)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    name text,
    age integer check (age >= 0),
    gender text,
    height numeric check (height > 0), -- in cm
    weight numeric check (weight > 0), -- in kg
    goal text check (goal in ('Weight Loss', 'Weight Gain', 'Muscle Building', 'Maintenance', 'Diabetic', 'Heart Health')),
    target_calories integer default 2000 check (target_calories > 0),
    target_protein integer default 60 check (target_protein >= 0),
    target_carbs integer default 250 check (target_carbs >= 0),
    target_fat integer default 70 check (target_fat >= 0),
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security on profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

create policy "Users can insert own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

-- 2. Meals Table
create table public.meals (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    meal_name text not null,
    image_url text,
    recorded_at timestamp with time zone default timezone('utc'::text, now()) not null,
    meal_type text check (meal_type in ('Breakfast', 'Lunch', 'Dinner', 'Snacks')),
    totals jsonb not null, -- { calories, protein, carbs, fat, fiber, sugar, sodium, iron, calcium }
    health_score jsonb not null, -- { overall, weight_loss, muscle_gain, heart_health, diabetic_friendly, kid_friendly, athlete }
    recommendations jsonb not null, -- array of strings
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security on meals
alter table public.meals enable row level security;

create policy "Users can view own meals"
    on public.meals for select
    using (auth.uid() = user_id);

create policy "Users can insert own meals"
    on public.meals for insert
    with check (auth.uid() = user_id);

create policy "Users can update own meals"
    on public.meals for update
    using (auth.uid() = user_id);

create policy "Users can delete own meals"
    on public.meals for delete
    using (auth.uid() = user_id);

-- 3. Food Items Table (Individual food items in a meal)
create table public.food_items (
    id uuid default gen_random_uuid() primary key,
    meal_id uuid references public.meals on delete cascade not null,
    food_name text not null,
    confidence numeric check (confidence >= 0 and confidence <= 1) not null,
    weight_grams numeric check (weight_grams >= 0) not null,
    portion_size text not null,
    ingredients jsonb not null, -- array of { name, amount, type }
    nutrition jsonb not null, -- full micronutrient list
    cuisine text,
    cooking_method text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security on food_items
alter table public.food_items enable row level security;

create policy "Users can view food items of own meals"
    on public.food_items for select
    using (
        exists (
            select 1 from public.meals
            where public.meals.id = public.food_items.meal_id
            and public.meals.user_id = auth.uid()
        )
    );

create policy "Users can insert food items of own meals"
    on public.food_items for insert
    with check (
        exists (
            select 1 from public.meals
            where public.meals.id = public.food_items.meal_id
            and public.meals.user_id = auth.uid()
        )
    );

create policy "Users can delete food items of own meals"
    on public.food_items for delete
    using (
        exists (
            select 1 from public.meals
            where public.meals.id = public.food_items.meal_id
            and public.meals.user_id = auth.uid()
        )
    );

-- 4. Automatically create profiles on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, target_calories, target_protein, target_carbs, target_fat)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    2000,
    60,
    250,
    70
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Performance Indexes
create index idx_meals_user_id_recorded_at on public.meals(user_id, recorded_at desc);
create index idx_food_items_meal_id on public.food_items(meal_id);
create index idx_profiles_goal on public.profiles(goal);
