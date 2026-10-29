ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK(status IN ('awaiting_arrival','received','preparing','ready','completed','cancelled','expired'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_reserved boolean NOT NULL DEFAULT true;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_accepted_at timestamptz;
CREATE INDEX IF NOT EXISTS orders_awaiting_expiry_idx ON orders(expires_at) WHERE status='awaiting_arrival';

-- O catálogo de exemplo deixa de ser ofertado; itens históricos permanecem intactos.
ALTER TABLE products ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
UPDATE products SET available=false,archived=true WHERE id IN (
 '00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002',
 '00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000004',
 '00000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000006',
 '00000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000008'
);

-- Estoque inicial zero: o gestor informa a disponibilidade real antes de vender.
INSERT INTO products(id,name,description,price,category,featured,emoji,stock) VALUES
('10000000-0000-4000-8000-000000000001','Chocolate · grande','Pastel grande, frito após sua confirmação no balcão.',1400,'Doces',false,'🍫',0),
('10000000-0000-4000-8000-000000000002','Chocolate · pequeno','Pastel pequeno, frito após sua confirmação no balcão.',800,'Doces',false,'🍫',0),
('10000000-0000-4000-8000-000000000003','Palmito · grande','Pastel grande, frito após sua confirmação no balcão.',1400,'Salgados',false,'🥟',0),
('10000000-0000-4000-8000-000000000004','Palmito · pequeno','Pastel pequeno, frito após sua confirmação no balcão.',800,'Salgados',false,'🥟',0),
('10000000-0000-4000-8000-000000000005','3 queijos · grande','Pastel grande, frito após sua confirmação no balcão.',1400,'Salgados',false,'🥟',0),
('10000000-0000-4000-8000-000000000006','3 queijos · pequeno','Pastel pequeno, frito após sua confirmação no balcão.',800,'Salgados',false,'🥟',0),
('10000000-0000-4000-8000-000000000007','Frango com catupiry · grande','Pastel grande, frito após sua confirmação no balcão.',1400,'Salgados',true,'🥟',0),
('10000000-0000-4000-8000-000000000008','Frango com catupiry · pequeno','Pastel pequeno, frito após sua confirmação no balcão.',800,'Salgados',true,'🥟',0),
('10000000-0000-4000-8000-000000000009','Queijo · grande','Pastel grande, frito após sua confirmação no balcão.',1400,'Salgados',true,'🥟',0),
('10000000-0000-4000-8000-000000000010','Queijo · pequeno','Pastel pequeno, frito após sua confirmação no balcão.',800,'Salgados',true,'🥟',0),
('10000000-0000-4000-8000-000000000011','Pizza · grande','Pastel grande, frito após sua confirmação no balcão.',1400,'Salgados',false,'🥟',0),
('10000000-0000-4000-8000-000000000012','Pizza · pequeno','Pastel pequeno, frito após sua confirmação no balcão.',800,'Salgados',false,'🥟',0),
('10000000-0000-4000-8000-000000000013','Carne com queijo · grande','Pastel grande, frito após sua confirmação no balcão.',1400,'Salgados',false,'🥟',0),
('10000000-0000-4000-8000-000000000014','Carne com queijo · pequeno','Pastel pequeno, frito após sua confirmação no balcão.',800,'Salgados',false,'🥟',0),
('10000000-0000-4000-8000-000000000015','Carne · grande','Pastel grande, frito após sua confirmação no balcão.',1400,'Salgados',true,'🥟',0),
('10000000-0000-4000-8000-000000000016','Carne · pequeno','Pastel pequeno, frito após sua confirmação no balcão.',800,'Salgados',true,'🥟',0),
('10000000-0000-4000-8000-000000000017','Coca-Cola lata','Bebida para acompanhar seu pastel.',700,'Bebidas',false,'🥤',0),
('10000000-0000-4000-8000-000000000018','Pepsi lata','Bebida para acompanhar seu pastel.',700,'Bebidas',false,'🥤',0),
('10000000-0000-4000-8000-000000000019','Fanta lata','Bebida para acompanhar seu pastel.',700,'Bebidas',false,'🥤',0),
('10000000-0000-4000-8000-000000000020','Guaraná lata','Bebida para acompanhar seu pastel.',700,'Bebidas',false,'🥤',0),
('10000000-0000-4000-8000-000000000021','Del Valle laranja lata','Bebida para acompanhar seu pastel.',700,'Bebidas',false,'🥤',0),
('10000000-0000-4000-8000-000000000022','Del Valle pêssego lata','Bebida para acompanhar seu pastel.',700,'Bebidas',false,'🥤',0),
('10000000-0000-4000-8000-000000000023','Del Valle uva lata','Bebida para acompanhar seu pastel.',700,'Bebidas',false,'🥤',0),
('10000000-0000-4000-8000-000000000024','Água sem gás','Bebida para acompanhar seu pastel.',400,'Bebidas',false,'🥤',0),
('10000000-0000-4000-8000-000000000025','Água com gás','Bebida para acompanhar seu pastel.',400,'Bebidas',false,'🥤',0),
('10000000-0000-4000-8000-000000000026','Guaraná 200 ml','Bebida para acompanhar seu pastel.',400,'Bebidas',false,'🥤',0),
('10000000-0000-4000-8000-000000000027','Coca-Cola 200 ml','Bebida para acompanhar seu pastel.',400,'Bebidas',false,'🥤',0),
('10000000-0000-4000-8000-000000000028','Monster Original','Bebida para acompanhar seu pastel.',1300,'Bebidas',false,'🥤',0)
ON CONFLICT DO NOTHING;
