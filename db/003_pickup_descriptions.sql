-- Corrige somente a descrição do catálogo; pedidos e preços históricos são preservados.
UPDATE products SET description=replace(description,'frito após sua confirmação no balcão.','preparado após o envio do pedido para retirada.')
WHERE id::text LIKE '10000000-%' AND description LIKE '%frito após sua confirmação no balcão.%';
