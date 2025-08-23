# querries

## transactions

```sparql
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX exs: <https://static.rwpz.net/spendcast/schema#>
SELECT ?transaction ?amount ?card ?date ?receipt WHERE {
  ?transaction a exs:FinancialTransaction .
  ?transaction exs:hasCard ?card .
  ?transaction exs:hasTransactionDate ?date .
  ?transaction exs:hasReceipt ?receipt .
  ?transaction exs:hasMonetaryAmount ?amount
}
```

## items

```sparql
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX exs: <https://static.rwpz.net/spendcast/schema#>
SELECT ?item ?receipt ?product ?subtotal ?unit_price ?quantity WHERE {
  ?item a exs:ReceiptLineItem .
  ?receipt exs:hasLineItem ?item .
  ?item exs:hasProduct ?product .
  ?item exs:lineSubtotal ?subtotal .
  ?item exs:unitPrice ?unit_price .
  ?item exs:quantity ?quantity
}
```

## products

```sparql
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX exs: <https://static.rwpz.net/spendcast/schema#>
SELECT ?product ?product_label ?category ?category_label WHERE {
  ?product rdfs:label ?product_label .
  ?product exs:category ?category .
  ?category rdfs:label ?category_label
}
```
