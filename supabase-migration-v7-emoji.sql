-- Add emoji column to users table
alter table users add column emoji text default '🎮';

-- Set default emojis for existing players
update users set emoji = '🐆' where name = 'Lander';
update users set emoji = '🚬' where name = 'Berten';
update users set emoji = '🍆' where name = 'Dries';
update users set emoji = '🥚' where name = 'Anton';
