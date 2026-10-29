-- Valores preservados no pedido: o total líquido não depende do catálogo futuro.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_total integer NOT NULL DEFAULT 0 CHECK(discount_total>=0);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS ingredients jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(ingredients)='array');

-- Elegibilidade explícita: nem categoria nem nome recebido do cliente concedem desconto.
ALTER TABLE products ADD COLUMN IF NOT EXISTS combo_size text CHECK(combo_size IN ('pequeno','grande'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS combo_drink boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS customizable boolean NOT NULL DEFAULT false;
UPDATE products AS p SET combo_size=v.size
FROM (VALUES
 ('10000000-0000-4000-8000-000000000001'::uuid,'grande'),
 ('10000000-0000-4000-8000-000000000002'::uuid,'pequeno'),
 ('10000000-0000-4000-8000-000000000003'::uuid,'grande'),
 ('10000000-0000-4000-8000-000000000004'::uuid,'pequeno'),
 ('10000000-0000-4000-8000-000000000005'::uuid,'grande'),
 ('10000000-0000-4000-8000-000000000006'::uuid,'pequeno'),
 ('10000000-0000-4000-8000-000000000007'::uuid,'grande'),
 ('10000000-0000-4000-8000-000000000008'::uuid,'pequeno'),
 ('10000000-0000-4000-8000-000000000009'::uuid,'grande'),
 ('10000000-0000-4000-8000-000000000010'::uuid,'pequeno'),
 ('10000000-0000-4000-8000-000000000011'::uuid,'grande'),
 ('10000000-0000-4000-8000-000000000012'::uuid,'pequeno'),
 ('10000000-0000-4000-8000-000000000013'::uuid,'grande'),
 ('10000000-0000-4000-8000-000000000014'::uuid,'pequeno'),
 ('10000000-0000-4000-8000-000000000015'::uuid,'grande'),
 ('10000000-0000-4000-8000-000000000016'::uuid,'pequeno')
) AS v(id,size)
WHERE p.id=v.id;
UPDATE products SET combo_drink=true WHERE id IN (
 '10000000-0000-4000-8000-000000000026','10000000-0000-4000-8000-000000000027'
);

-- Novos produtos começam sem estoque; não alterar preços ou reservas existentes.
INSERT INTO products(id,name,description,price,category,featured,emoji,stock,combo_size,customizable) VALUES
('10000000-0000-4000-8000-000000000029','Queijo com goiabada · grande','Pastel grande de queijo com goiabada, preparado após o envio do pedido para retirada.',1400,'Doces',false,'🧀',0,'grande',false),
('10000000-0000-4000-8000-000000000030','Queijo com goiabada · pequeno','Pastel pequeno de queijo com goiabada, preparado após o envio do pedido para retirada.',800,'Doces',false,'🧀',0,'pequeno',false),
('10000000-0000-4000-8000-000000000031','Kibe','Kibe para acompanhar seu intervalo.',800,'Salgados',false,'🥙',0,NULL,false),
('10000000-0000-4000-8000-000000000032','Empada','Empada para acompanhar seu intervalo.',800,'Salgados',false,'🥧',0,NULL,false),
('10000000-0000-4000-8000-000000000033','Coxinha','Coxinha para acompanhar seu intervalo.',800,'Salgados',false,'🍗',0,NULL,false),
('10000000-0000-4000-8000-000000000034','Espetinho de frango','Espetinho de frango para acompanhar seu intervalo.',800,'Salgados',false,'🍢',0,NULL,false),
('10000000-0000-4000-8000-000000000035','Mini pizza de presunto e mussarela','Molho de tomate, presunto e mussarela.',800,'Mini pizza',false,'🍕',0,NULL,false),
('10000000-0000-4000-8000-000000000036','Mini pizza de calabresa','Molho de tomate e calabresa.',800,'Mini pizza',false,'🍕',0,NULL,false),
('10000000-0000-4000-8000-000000000037','Mini pizza personalizada','Molho de tomate e até três ingredientes dos pastéis à sua escolha.',800,'Mini pizza',false,'🍕',0,NULL,true)
ON CONFLICT DO NOTHING;
