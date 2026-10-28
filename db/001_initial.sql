CREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY, google_id text UNIQUE NOT NULL, email text UNIQUE NOT NULL, name text NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash text PRIMARY KEY, user_id uuid REFERENCES users(id), is_admin boolean NOT NULL DEFAULT false, expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS products (id uuid PRIMARY KEY, name text NOT NULL, description text NOT NULL, price integer NOT NULL CHECK(price>0), category text NOT NULL, available boolean NOT NULL DEFAULT true, featured boolean NOT NULL DEFAULT false, emoji text NOT NULL, stock integer NOT NULL DEFAULT 100 CHECK(stock>=0));
CREATE TABLE IF NOT EXISTS orders (id uuid PRIMARY KEY, tracking_hash text UNIQUE NOT NULL, user_id uuid REFERENCES users(id), customer_name text NOT NULL, status text NOT NULL DEFAULT 'received' CHECK(status IN ('received','preparing','ready','completed','cancelled')), payment_method text NOT NULL CHECK(payment_method IN ('pix','card','verocard')), payment_status text NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending','paid')), total integer NOT NULL CHECK(total>0), scheduled_at timestamptz, notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS order_items (order_id uuid REFERENCES orders(id), product_id uuid REFERENCES products(id), name text NOT NULL, unit_price integer NOT NULL, quantity integer NOT NULL CHECK(quantity>0), PRIMARY KEY(order_id,product_id));
CREATE TABLE IF NOT EXISTS order_events (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, order_id uuid REFERENCES orders(id), status text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS order_events_order_idx ON order_events(order_id);
INSERT INTO products(id,name,description,price,category,featured,emoji) VALUES
('00000000-0000-4000-8000-000000000001','Carne da casa','Carne bem temperadinha, azeitona e aquele gostinho de quero mais.',900,'Salgados',true,'🥟'),
('00000000-0000-4000-8000-000000000002','Queijo derretendo','Mussarela de verdade. Crocante por fora, muito queijo por dentro.',900,'Salgados',true,'🧀'),
('00000000-0000-4000-8000-000000000003','Frango com catupiry','Frango desfiado e uma generosa camada de requeijão cremoso.',1100,'Salgados',true,'🥟'),
('00000000-0000-4000-8000-000000000004','Pizza','Mussarela, presunto, tomate e orégano. Uma combinação clássica.',1000,'Salgados',false,'🍅'),
('00000000-0000-4000-8000-000000000005','Chocolate','Chocolate derretido para adoçar o seu intervalo.',1000,'Doces',false,'🍫'),
('00000000-0000-4000-8000-000000000006','Banana com canela','Banana, açúcar e canela. Abraço em formato de pastel.',900,'Doces',false,'🍌'),
('00000000-0000-4000-8000-000000000007','Caldo de cana 300ml','Feito na hora. O par perfeito do seu pastel.',600,'Bebidas',false,'🥤'),
('00000000-0000-4000-8000-000000000008','Refrigerante lata','Geladinho para acompanhar. Consulte os sabores na retirada.',500,'Bebidas',false,'🥤') ON CONFLICT DO NOTHING;

ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price integer CHECK(sale_price>0 AND sale_price<price);
