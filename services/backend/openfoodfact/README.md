# openfoodfact

product_name
packaging_text

```sql
duckdb products.db -csv <<EOF
SELECT nutriscore_score FROM products WHERE packaging_text LIKE '%Banane%'
ORDER BY last_modified_datetime LIMIT 1;
EOF
```
